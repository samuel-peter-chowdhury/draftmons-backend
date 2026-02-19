import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { ForbiddenError } from '../errors';

const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'x-xsrf-token';

/**
 * CSRF double-submit cookie middleware.
 *
 * On every response, sets a readable CSRF cookie with a random token.
 * On state-mutating requests (POST, PUT, DELETE, PATCH), validates that
 * the X-XSRF-TOKEN header matches the cookie value.
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  // Set or refresh the CSRF cookie on every request
  let csrfToken = req.cookies?.[CSRF_COOKIE_NAME];
  if (!csrfToken) {
    csrfToken = crypto.randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: false, // Must be readable by JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });
  }

  // Skip validation for safe methods
  const safeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  if (safeMethod) {
    return next();
  }

  // Validate the CSRF header against the cookie
  const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;
  if (!headerToken || headerToken !== csrfToken) {
    return next(new ForbiddenError('Invalid or missing CSRF token'));
  }

  return next();
};
