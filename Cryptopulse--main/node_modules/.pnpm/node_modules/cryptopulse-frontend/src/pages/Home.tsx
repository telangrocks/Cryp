import React from 'react';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="text-center max-w-2xl mx-auto p-6">
        <h1 className="text-6xl font-black text-white mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
          Welcome to CryptoPulse
        </h1>
        <p className="text-xl text-slate-300 font-medium mb-8">
          Your crypto tracking application is up and running!
        </p>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50">
          <h2 className="text-2xl font-bold text-white mb-4">System Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="w-3 h-3 bg-green-400 rounded-full mx-auto mb-2 animate-pulse"></div>
              <span className="text-green-400 font-semibold">Frontend</span>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-green-400 rounded-full mx-auto mb-2 animate-pulse"></div>
              <span className="text-green-400 font-semibold">Router</span>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-green-400 rounded-full mx-auto mb-2 animate-pulse"></div>
              <span className="text-green-400 font-semibold">Error Handler</span>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-green-400 rounded-full mx-auto mb-2 animate-pulse"></div>
              <span className="text-green-400 font-semibold">Service Worker</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;


