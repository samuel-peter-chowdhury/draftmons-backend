import { Request, Response, Router } from 'express';
import passport from 'passport';
import { asyncHandler } from '../utils/error.utils';
import { isAuthenticated, AuthenticatedRequest } from '../middleware/auth.middleware';
import { plainToInstance } from 'class-transformer';
import { UserDto } from '../dtos/user.dto';

export class AuthController {
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Google OAuth routes
    this.router.get(
      '/google',
      passport.authenticate('google', { scope: ['profile', 'email'] })
    );

    this.router.get(
      '/google/callback',
      passport.authenticate('google', {
        failureRedirect: 'api/auth/login-failed',
        successRedirect: process.env.CLIENT_URL || '/api/auth/login-succeeded',
      })
    );

    // Session management routes
    this.router.get('/status', this.getAuthStatus);
    this.router.post('/logout', isAuthenticated, this.logout);
    this.router.get('/login-failed', this.loginFailed);
    this.router.get('/login-succeeded', this.loginSucceeded);
  }

  getAuthStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (req.isAuthenticated() && req.user) {
      res.json({
        isAuthenticated: true,
        user: plainToInstance(UserDto, req.user, {
          excludeExtraneousValues: true,
        }),
      });
    } else {
      res.json({
        isAuthenticated: false,
      });
    }
  });

  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
      }
    });

    res.json({
      message: 'Logged out successfully',
    });
  });

  loginSucceeded = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      message: 'Authentication succeeded',
    });
  });

  loginFailed = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    res.status(401).json({
      message: 'Authentication failed',
    });
  });
}
