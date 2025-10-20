import { Request, Response, Router } from 'express';
import passport from 'passport';
import { asyncHandler } from '../utils/error.utils';
import { isAuthenticated, AuthenticatedRequest } from '../middleware/auth.middleware';
import { plainToInstance } from 'class-transformer';
import { UserOutputDto } from '../dtos/user.dto';

export class AuthController {
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Google OAuth routes
    this.router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

    this.router.get(
      '/google/callback',
      passport.authenticate('google', {
        failureRedirect: 'http://localhost:3333',
        successRedirect: process.env.CLIENT_URL || 'http://localhost:3333/home',
      }),
    );

    // Session management routes
    this.router.get('/status', this.getAuthStatus);
    this.router.post('/logout', isAuthenticated, this.logout);
  }

  getAuthStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (req.isAuthenticated() && req.user) {
      res.json({
        isAuthenticated: true,
        user: plainToInstance(UserOutputDto, req.user, {
          excludeExtraneousValues: true,
          groups: ['user.full'],
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
}
