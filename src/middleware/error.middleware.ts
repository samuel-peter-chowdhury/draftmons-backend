import { Request, Response, NextFunction } from 'express';
import { BaseError } from '../errors';
import { QueryFailedError } from 'typeorm';

export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(`[Error] ${error.stack}`);

  if (error instanceof BaseError) {
    res.status(error.statusCode).json(error.toJSON());
    return;
  }

  // TypeORM specific errors
  if (error instanceof QueryFailedError) {
    res.status(400).json({
      statusCode: 400,
      errorCode: 'DATABASE_ERROR',
      message: 'Database query failed',
      timestamp: new Date().toISOString(),
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
    return;
  }

  // Default internal server error
  res.status(500).json({
    statusCode: 500,
    errorCode: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error',
    timestamp: new Date().toISOString(),
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};