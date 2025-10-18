import { TrendingUp } from 'lucide-react';
import { useEffect } from 'react';

export default function SplashScreen() {
  useEffect(() => {
    // Simple redirect after 1.5 seconds
    const timer = setTimeout(() => {
      console.log('[SplashScreen] Redirecting to disclaimer');
      window.location.href = '/disclaimer';
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="text-center">
        {/* Simple Logo */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl mb-6">
            <TrendingUp className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-black text-white mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            CryptoPulse
          </h1>
          <p className="text-xl text-slate-300 font-medium">
            AI-Powered Trading Bot
          </p>
        </div>

        {/* Simple Loading Spinner */}
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
        </div>
      </div>
    </div>
  );
}


