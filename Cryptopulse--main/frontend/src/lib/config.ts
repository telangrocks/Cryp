interface AppConfig {
  apiUrl: string;
  appName: string;
  environment: 'development' | 'staging' | 'production';
  enableAnalytics: boolean;
  enableErrorTracking: boolean;
}

const validateEnv = (): AppConfig => {
  const env = import.meta.env;
  
  // Required variables
  const required = {
    apiUrl: env.VITE_API_URL || env.VITE_API_ENDPOINT,
    appName: env.VITE_APP_NAME || 'CryptoPulse',
    environment: (env.MODE || 'production') as AppConfig['environment'],
  };

  // Optional with defaults
  const optional = {
    enableAnalytics: env.VITE_ENABLE_ANALYTICS === 'true',
    enableErrorTracking: env.VITE_ENABLE_ERROR_TRACKING !== 'false', // enabled by default
  };

  // Validate required fields
  if (!required.apiUrl) {
    console.error('❌ VITE_API_URL is required but not set');
    throw new Error('Missing required environment variable: VITE_API_URL');
  }

  const config: AppConfig = { ...required, ...optional };

  console.log('✅ Environment configuration loaded:', {
    environment: config.environment,
    apiUrl: config.apiUrl.substring(0, 20) + '...',
    appName: config.appName,
  });

  return config;
};

export const appConfig = validateEnv();
export default appConfig;

