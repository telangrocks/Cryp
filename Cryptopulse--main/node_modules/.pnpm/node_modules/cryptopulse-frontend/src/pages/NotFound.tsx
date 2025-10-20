import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="text-center max-w-md mx-auto p-6">
        <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-white mb-4">Page Not Found</h2>
        <p className="text-gray-300 mb-6">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            ← Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            🏠 Go Home
          </button>
        </div>
      </div>
    </div>
  );
}