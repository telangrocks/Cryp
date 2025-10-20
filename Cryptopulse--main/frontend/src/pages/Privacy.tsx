import React, { useEffect, useState } from 'react';
import SEO from '../components/SEO';
import { Dialog, DialogPortal, DialogOverlay, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogButton, DialogClose } from '../components/Dialog';

const Privacy: React.FC = () => {
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    try {
      const accepted = localStorage.getItem('cp_disclaimer_accepted');
      if (!accepted) setShowDisclaimer(true);
    } catch {}
  }, []);

  const handleAccept = () => {
    try { localStorage.setItem('cp_disclaimer_accepted', '1'); } catch {}
    setShowDisclaimer(false);
  };

  const handleDecline = () => {
    setShowDisclaimer(false);
    // Optionally, navigate or show limited functionality; preserving current logic by just closing.
  };

  return (
    <>
      <SEO title="Privacy Policy | CryptoPulse" />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
        <h1>Privacy Policy</h1>
        <p><em>Last updated: {new Date().toLocaleDateString()}</em></p>
        
        <h2>1. Information We Collect</h2>
        <p>We collect information you provide directly to us...</p>
        
        <h2>2. How We Use Your Information</h2>
        <p>We use the information we collect to...</p>
        
        <h2>3. Information Sharing</h2>
        <p>We do not sell your personal information...</p>
        
        <h2>4. Data Security</h2>
        <p>We implement appropriate security measures...</p>
        
        <h2>5. Contact Us</h2>
        <p>If you have questions about this Privacy Policy, contact us at: privacy@cryptopulse.com</p>
      </div>

      <Dialog open={showDisclaimer} onOpenChange={(v) => (!v ? setShowDisclaimer(false) : undefined)}>
        <DialogPortal>
          <DialogOverlay onDismiss={() => setShowDisclaimer(false)} />
          <DialogContent ariaLabel="Disclaimer">
            <DialogHeader>
              <DialogTitle>Disclaimer</DialogTitle>
              <DialogDescription>
                CryptoPulse provides market data and insights for informational purposes only and does not constitute financial advice. Trading involves risk. By proceeding, you acknowledge and accept these terms.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose onClick={handleDecline}>Decline</DialogClose>
              <DialogButton onClick={handleAccept}>Accept</DialogButton>
            </DialogFooter>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </>
  );
};

export default Privacy;
