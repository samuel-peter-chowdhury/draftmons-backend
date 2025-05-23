import { Request, Response, Router } from 'express';
import passport from 'passport';
import { asyncHandler } from '../utils/error.utils';
import { isAuthenticated, AuthenticatedRequest } from '../middleware/auth.middleware';
import { plainToInstance } from 'class-transformer';
import { UserDto } from '../dtos/user.dto';

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and session management
 * 
 * components:
 *   schemas:
 *     AuthStatus:
 *       type: object
 *       properties:
 *         isAuthenticated:
 *           type: boolean
 *         user:
 *           $ref: '#/components/schemas/User'
 *     AuthResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 */

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

  /**
   * @swagger
   * /api/auth/google:
   *   get:
   *     tags:
   *       - Authentication
   *     summary: Initiate Google OAuth login
   *     description: Redirects to Google's OAuth consent screen
   *     responses:
   *       302:
   *         description: Redirect to Google OAuth
   */
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

  /**
   * @swagger
   * /api/auth/google/callback:
   *   get:
   *     tags:
   *       - Authentication
   *     summary: Google OAuth callback
   *     description: Handles the OAuth callback from Google
   *     responses:
   *       302:
   *         description: Redirect to success or failure URL
   *         headers:
   *           Location:
   *             schema:
   *               type: string
   *             description: Redirect URL based on authentication result
   */

  /**
   * @swagger
   * /api/auth/status:
   *   get:
   *     tags:
   *       - Authentication
   *     summary: Get authentication status
   *     description: Returns the current authentication status and user information if authenticated
   *     responses:
   *       200:
   *         description: Authentication status
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthStatus'
   */
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

  /**
   * @swagger
   * /api/auth/logout:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Logout user
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: Logout successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthResponse'
   *       401:
   *         description: Unauthorized
   */
  loginSucceeded = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      message: 'Authentication succeeded',
    });
  });

  /**
   * @swagger
   * /api/auth/login-succeeded:
   *   get:
   *     tags:
   *       - Authentication
   *     summary: Authentication success callback
   *     description: Called after successful authentication
   *     responses:
   *       200:
   *         description: Authentication success message
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthResponse'
   */
  loginFailed = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    res.status(401).json({
      message: 'Authentication failed',
    });
  });

  /**
   * @swagger
   * /api/auth/login-failed:
   *   get:
   *     tags:
   *       - Authentication
   *     summary: Authentication failure callback
   *     description: Called after failed authentication
   *     responses:
   *       401:
   *         description: Authentication failure message
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthResponse'
   */
}
