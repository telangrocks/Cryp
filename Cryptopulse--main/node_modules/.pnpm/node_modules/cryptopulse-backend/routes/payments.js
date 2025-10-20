/**
 * Payments API Routes - Cashfree Integration
 */

import express from 'express';
import crypto from 'crypto';
import { body } from 'express-validator';
import { authenticateToken, validateInput } from '../lib/auth.js';
import { logger } from '../lib/logging.js';
import { Subscription } from '../lib/database.js';

const router = express.Router();

// Create payment order (proxy for frontend to initiate Cashfree flow)
router.post('/create-order',
  authenticateToken,
  [
    body('planId').isString().notEmpty(),
    body('amount').isFloat({ gt: 0 }),
    body('currency').optional().isString()
  ],
  validateInput,
  async (req, res) => {
    try {
      const { planId, amount, currency = 'INR' } = req.body;
      const userId = req.user.userId;

      // Generate order payload
      const orderId = `cf_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

      // In a full integration, call Cashfree Orders API and return the payment URL
      const paymentUrl = `${process.env.CASHFREE_BASE_URL || 'https://sandbox.cashfree.com'}/pgapp/js/checkout.js?order_id=${orderId}`;

      res.json({
        success: true,
        data: {
          orderId,
          paymentUrl,
          planId,
          amount,
          currency,
          userId
        }
      });
    } catch (error) {
      logger.error('Create order failed:', error);
      res.status(500).json({ success: false, error: 'Failed to create order' });
    }
  }
);

// Cashfree webhook for payment status updates
router.post('/webhook/cashfree', express.json({ type: '*/*' }), async (req, res) => {
  try {
    const signature = req.header('x-webhook-signature') || req.header('x-cashfree-signature');
    const secret = process.env.CASHFREE_WEBHOOK_SECRET || '';
    const payload = JSON.stringify(req.body);

    // Validate signature if secret is configured
    if (secret) {
      const expected = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('base64');

      if (signature !== expected) {
        logger.warn('Invalid Cashfree webhook signature');
        return res.status(400).json({ success: false });
      }
    }

    const event = req.body?.type || req.body?.event || 'payment.updated';
    const data = req.body?.data || req.body;

    // Map fields from Cashfree payload
    const orderId = data?.order?.order_id || data?.order_id;
    const payment = data?.payment || data;
    const paymentStatus = (payment?.payment_status || payment?.status || '').toUpperCase();
    const amount = parseFloat(payment?.payment_amount || payment?.amount || data?.order?.order_amount || '0');
    const currency = payment?.payment_currency || data?.order?.order_currency || 'INR';
    const paymentId = payment?.cf_payment_id || payment?.payment_id || payment?.id;
    const planId = data?.order?.order_meta?.plan_id || data?.order_meta?.plan_id || 'default';
    const customerId = data?.customer_details?.customer_id || data?.customer_id || data?.customer?.id;

    if (!customerId) {
      return res.status(400).json({ success: false, error: 'Missing customerId' });
    }

    // Update subscription on successful payment
    if (paymentStatus === 'SUCCESS' || paymentStatus === 'PAID' || event === 'payment.captured') {
      await Subscription.upsertActive({
        userId: customerId,
        planId,
        amount,
        currency,
        paymentId,
        orderId,
        autoRenew: true
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Cashfree webhook error:', error);
    res.status(500).json({ success: false });
  }
});

// Get subscription status
router.get('/subscription/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const sub = await Subscription.getByUserId(userId);
    res.json({ success: true, data: sub });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch subscription' });
  }
});

module.exports = router;


