import { config } from 'dotenv';

// Load environment variables
config();

// Require SESSION_SECRET in all environments to prevent use of a hardcoded fallback
if (!process.env.SESSION_SECRET) {
  throw new Error(
    'SESSION_SECRET environment variable is required. ' +
    'Set it in your .env file or environment before starting the server.',
  );
}

// Application configuration
export const APP_CONFIG = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  sessionSecret: process.env.SESSION_SECRET,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3333',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || '',
  },
  auth: {
    google: {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
    },
  },
};
