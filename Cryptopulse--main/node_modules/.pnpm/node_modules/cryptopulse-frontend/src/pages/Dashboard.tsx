import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">
          Dashboard
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">Portfolio Overview</h2>
            <p className="text-slate-300">Your dashboard content goes here.</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">Trading Bot</h2>
            <p className="text-slate-300">Bot configuration and status.</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">Analytics</h2>
            <p className="text-slate-300">Performance metrics and insights.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


