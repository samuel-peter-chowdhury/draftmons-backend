import { HttpException } from '../utils/error.utils';
import { Request, Response, NextFunction } from 'express';

export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(`[Error] ${error.stack}`);

  if (error instanceof HttpException) {
    res.status(error.status).json({
      status: error.status,
      message: error.message,
    });
    return;
  }

  // TypeORM specific errors
  if (error.name === 'QueryFailedError') {
    res.status(400).json({
      status: 400,
      message: 'Database query failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
    return;
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    res.status(400).json({
      status: 400,
      message: 'Validation failed',
      error: error.message,
    });
    return;
  }

  // Default internal server error
  res.status(500).json({
    status: 500,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
};