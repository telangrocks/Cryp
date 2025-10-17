import React from 'react';
import SEO from '../components/SEO';

const Privacy: React.FC = () => {
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
    </>
  );
};

export default Privacy;
