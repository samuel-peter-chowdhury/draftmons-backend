import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

const rateLimitMessage = (req: Request, res: Response) => ({
  error: 'Too many requests, please try again later.',
  statusCode: 429,
  timestamp: new Date().toISOString(),
});

// Higher limit for read endpoints (GET requests)
export const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage,
  skip: (req) => req.method !== 'GET',
});

// Lower limit for write endpoints (POST, PUT, DELETE)
export const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage,
  skip: (req) => req.method === 'GET',
});
