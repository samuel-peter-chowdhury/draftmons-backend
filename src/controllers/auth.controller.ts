import { Request, Response, NextFunction, Router } from 'express';
import passport from 'passport';
import crypto from 'crypto';
import { asyncHandler } from '../utils/error.utils';
import { isAuthenticated, AuthenticatedRequest } from '../middleware/auth.middleware';
import { plainToInstance } from 'class-transformer';
import { UserOutputDto } from '../dtos/user.dto';
import { APP_CONFIG } from '../config/app.config';
import { UserService } from '../services/user.service';

export class AuthController {
  public router = Router();

  constructor(private userService: UserService) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Google OAuth routes
    this.router.get('/google', (req: Request, _res: Response, next: NextFunction) => {
      const redirect = req.query.redirect as string | undefined;
      let state = '/home';

      if (redirect === 'swagger') {
        state = 'swagger';
      } else if (redirect) {
        try {
          const url = new URL(redirect);
          if (url.origin === APP_CONFIG.clientUrl) {
            state = url.pathname + url.search;
          }
        } catch {
          // Invalid URL — use default
        }
      }

      passport.authenticate('google', { scope: ['profile', 'email'], state })(req, _res, next);
    });

    this.router.get(
      '/google/callback',
      passport.authenticate('google', { failureRedirect: APP_CONFIG.clientUrl }),
      (req: Request, res: Response) => {
        const state = req.query.state as string | undefined;

        if (state === 'swagger') {
          return res.redirect('/api-docs');
        }

        const redirectPath =
          state && /^\/[a-zA-Z0-9/_-]*(\?[a-zA-Z0-9_=&.%-]*)?$/.test(state) ? state : '/home';
        return res.redirect(`${APP_CONFIG.clientUrl}${redirectPath}`);
      },
    );

    // Discord OAuth routes
    this.router.get('/discord', isAuthenticated, (req: Request, res: Response) => {
      const state = crypto.randomBytes(32).toString('hex');
      (req.session as any).discordOAuthState = state;

      const params = new URLSearchParams({
        client_id: APP_CONFIG.auth.discord.clientId,
        redirect_uri: APP_CONFIG.auth.discord.callbackURL,
        response_type: 'code',
        scope: 'identify',
        state,
      });

      res.redirect(`https://discord.com/oauth2/authorize?${params}`);
    });

    this.router.get(
      '/discord/callback',
      isAuthenticated,
      asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
        const { code, state } = req.query as { code?: string; state?: string };
        const userId = (req.user as UserOutputDto).id;
        const frontendProfileUrl = `${APP_CONFIG.clientUrl}/user/${userId}`;

        // Validate CSRF state nonce
        const sessionState = (req.session as any).discordOAuthState;
        if (!state || state !== sessionState) {
          delete (req.session as any).discordOAuthState;
          res.redirect(`${frontendProfileUrl}?linked=false&error=state_mismatch`);
          return;
        }

        // Delete nonce before processing (single-use — delete on both success and failure)
        delete (req.session as any).discordOAuthState;

        if (!code) {
          res.redirect(`${frontendProfileUrl}?linked=false&error=no_code`);
          return;
        }

        // Exchange code for access token
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: APP_CONFIG.auth.discord.clientId,
            client_secret: APP_CONFIG.auth.discord.clientSecret,
            grant_type: 'authorization_code',
            code,
            redirect_uri: APP_CONFIG.auth.discord.callbackURL,
          }),
        });

        if (!tokenResponse.ok) {
          res.redirect(`${frontendProfileUrl}?linked=false&error=token_exchange`);
          return;
        }

        const tokenData = (await tokenResponse.json()) as { access_token: string };

        // Fetch Discord identity
        const identityResponse = await fetch('https://discord.com/api/users/@me', {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        if (!identityResponse.ok) {
          res.redirect(`${frontendProfileUrl}?linked=false&error=identity_fetch`);
          return;
        }

        const identity = (await identityResponse.json()) as {
          id: string;
          username: string;
          global_name?: string;
        };
        const discordId = identity.id;
        const discordUsername = identity.global_name || identity.username;

        // Save Discord identity to user record
        try {
          await this.userService.update(
            { id: userId } as any,
            { discordId, discordUsername } as any,
          );
          res.redirect(`${frontendProfileUrl}?linked=true`);
        } catch (err: any) {
          // Unique constraint violation — same Discord account linked to another user
          const isUniqueViolation =
            err?.code === '23505' ||
            (typeof err?.message === 'string' && err.message.toLowerCase().includes('duplicate'));
          if (isUniqueViolation) {
            res.redirect(`${frontendProfileUrl}?linked=false&error=already_taken`);
          } else {
            res.redirect(`${frontendProfileUrl}?linked=false&error=save_failed`);
          }
        }
      }),
    );

    // Session management routes
    this.router.get('/status', this.getAuthStatus);
    this.router.post('/logout', isAuthenticated, this.logout);

    // Discord unlink route
    this.router.delete('/discord', isAuthenticated, this.unlinkDiscord);
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
    await new Promise<void>((resolve, reject) => {
      req.logout((err) => {
        if (err) return reject(err);
        req.session.destroy((err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });

    res.clearCookie('connect.sid');
    res.json({
      message: 'Logged out successfully',
    });
  });

  unlinkDiscord = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = (req.user as UserOutputDto).id;
    await this.userService.update(
      { id: userId } as any,
      { discordId: null, discordUsername: null } as any,
    );
    res.json({ message: 'Discord account unlinked' });
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
   *     description: Redirects to Google's OAuth consent screen. Pass `?redirect=swagger` to redirect back to `/api-docs` after login instead of the frontend.
   *     parameters:
   *       - in: query
   *         name: redirect
   *         schema:
   *           type: string
   *           enum: [swagger]
   *         description: Set to "swagger" to redirect back to Swagger UI after login
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
   * /api/auth/discord:
   *   get:
   *     tags:
   *       - Authentication
   *     summary: Initiate Discord OAuth account linking
   *     description: Redirects an authenticated user to Discord's OAuth2 consent screen to link their Discord account. A CSRF state nonce is generated and stored in the session for validation on callback.
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       302:
   *         description: Redirect to Discord OAuth2 authorize URL
   *       401:
   *         description: Unauthorized — must be logged in
   *   delete:
   *     tags:
   *       - Authentication
   *     summary: Unlink Discord account
   *     description: Clears the discordId and discordUsername fields for the authenticated user, unlinking their Discord account.
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: Discord account unlinked successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthResponse'
   *       401:
   *         description: Unauthorized — must be logged in
   */

  /**
   * @swagger
   * /api/auth/discord/callback:
   *   get:
   *     tags:
   *       - Authentication
   *     summary: Discord OAuth callback
   *     description: Handles the OAuth callback from Discord. Validates state nonce, exchanges code for token, fetches Discord identity, saves discordId and discordUsername to the user record, then redirects to the frontend profile page with a linked=true/false query param.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: query
   *         name: code
   *         schema:
   *           type: string
   *         description: Authorization code from Discord
   *       - in: query
   *         name: state
   *         schema:
   *           type: string
   *         description: CSRF state nonce for validation
   *     responses:
   *       302:
   *         description: Redirect to frontend profile page with linked=true or linked=false&error=<reason>
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
