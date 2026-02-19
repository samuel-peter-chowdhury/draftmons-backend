import { Request, Response, NextFunction } from 'express';

// Async wrapper for route handlers to catch and forward errors
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction): Promise<void> => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
};
