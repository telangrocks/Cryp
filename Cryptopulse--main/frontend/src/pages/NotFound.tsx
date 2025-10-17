import React from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEO title="404 - Page Not Found | CryptoPulse" />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-8xl font-black text-red-500 mb-4">404</h1>
          <h2 className="text-3xl font-bold text-white mb-4">Page Not Found</h2>
          <p className="text-slate-300 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-white bg-opacity-20 text-white border-2 border-white border-opacity-30 rounded-lg font-semibold hover:bg-opacity-30 transition-all duration-300"
            >
              ← Go Back
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-white text-purple-600 border-none rounded-lg font-semibold hover:transform hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
            >
              🏠 Go Home
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotFound;
