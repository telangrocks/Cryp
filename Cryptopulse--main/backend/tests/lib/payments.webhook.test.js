// Payments webhook test

const express = require('express');
const request = require('supertest');

jest.mock('../../lib/logging', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }
}));

jest.mock('../../lib/database', () => ({
  Subscription: {
    upsertActive: jest.fn().mockResolvedValue({ id: 'sub-1', status: 'ACTIVE' }),
    getByUserId: jest.fn().mockResolvedValue({ id: 'sub-1', status: 'ACTIVE' })
  }
}));

describe('Cashfree webhook', () => {
  let app;

  beforeEach(() => {
    jest.resetModules();
    app = express();
    const paymentsRoutes = require('../../routes/payments');
    app.use('/api/v1/payments', paymentsRoutes);
  });

  test('updates subscription on successful payment', async () => {
    const payload = {
      type: 'payment.captured',
      data: {
        order: { order_id: 'order_123', order_amount: '499', order_currency: 'INR', order_meta: { plan_id: 'premium_monthly' } },
        payment: { payment_status: 'SUCCESS', payment_amount: '499', payment_currency: 'INR', cf_payment_id: 'pay_abc' },
        customer_details: { customer_id: 'user-123' }
      }
    };

    const res = await request(app)
      .post('/api/v1/payments/webhook/cashfree')
      .send(payload)
      .set('Content-Type', 'application/json')
      .expect(200);

    expect(res.body.success).toBe(true);

    const { Subscription } = require('../../lib/database');
    expect(Subscription.upsertActive).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123',
        planId: 'premium_monthly',
        amount: 499,
        currency: 'INR',
        paymentId: 'pay_abc',
        orderId: 'order_123'
      })
    );
  });
});


