import { Request, Response, Router } from 'express';
import { UserService } from '../services/user.service';
import { BaseController } from './base.controller';
import { User } from '../entities/user.entity';
import { UserDto, CreateUserDto, UpdateUserDto, AdminUpdateUserDto } from '../dtos/user.dto';
import { validateDto } from '../middleware/validation.middleware';
import { isAuthenticated, isAdmin, AuthenticatedRequest } from '../middleware/auth.middleware';
import { ValidationError, UnauthorizedError } from '../errors';
import { plainToInstance } from 'class-transformer';
import { asyncHandler } from '../utils/error.utils';

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and operations
 * 
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         isAdmin:
 *           type: boolean
 *         showdownUsername:
 *           type: string
 *           nullable: true
 *         discordUsername:
 *           type: string
 *           nullable: true
 *         timezone:
 *           type: string
 *           nullable: true
 *         fullName:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

export class UserController extends BaseController<User, UserDto> {
  public router = Router();

  constructor(private userService: UserService) {
    super(userService, UserDto);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Authenticated routes
    this.router.get('/me', isAuthenticated, this.getCurrentUser);
    this.router.put('/me', isAuthenticated, validateDto(UpdateUserDto), this.updateCurrentUser);
    this.router.delete('/me', isAuthenticated, this.deleteCurrentUser);

    // Admin routes
    this.router.get('/', isAuthenticated, isAdmin, this.getAll);
    this.router.post('/', isAuthenticated, isAdmin, validateDto(CreateUserDto), this.create);
    this.router.put('/:id', isAuthenticated, isAdmin, validateDto(AdminUpdateUserDto), this.update);
    this.router.delete('/:id', isAuthenticated, isAdmin, this.delete);
    this.router.post('/:id/promote', isAuthenticated, isAdmin, this.promoteToAdmin);
    this.router.post('/:id/demote', isAuthenticated, isAdmin, this.demoteFromAdmin);

    // Public routes
    this.router.get('/:id', this.getById);
  }

  /**
   * @swagger
   * /api/users/me:
   *   get:
   *     tags:
   *       - Users
   *     summary: Get current user's profile
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *         description: Whether to include full user details
   *     responses:
   *       200:
   *         description: Current user's profile
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       401:
   *         description: Unauthorized
   */
  getCurrentUser = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    const user = await this.userService.findOne(req.user.id);
    const group = req.query.full === 'true' ? this.getFullTransformGroup() : undefined;

    res.json(
      plainToInstance(UserDto, user, {
        excludeExtraneousValues: true,
        groups: group,
      })
    );
  });

  /**
   * @swagger
   * /api/users/me:
   *   put:
   *     tags:
   *       - Users
   *     summary: Update current user's profile
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *               email:
   *                 type: string
   *                 format: email
   *               showdownUsername:
   *                 type: string
   *               discordUsername:
   *                 type: string
   *               timezone:
   *                 type: string
   *     responses:
   *       200:
   *         description: Updated user profile
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       401:
   *         description: Unauthorized
   *       400:
   *         description: Invalid input
   */
  updateCurrentUser = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const user = await this.userService.update(req.user.id, req.body);

    res.json(
      plainToInstance(UserDto, user, {
        excludeExtraneousValues: true,
      })
    );
  });

  /**
   * @swagger
   * /api/users/me:
   *   delete:
   *     tags:
   *       - Users
   *     summary: Delete current user's account
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       204:
   *         description: User account deleted successfully
   *       401:
   *         description: Unauthorized
   */
  deleteCurrentUser = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    await this.userService.delete(req.user.id);

    res.status(204).send();
  });

  /**
   * @swagger
   * /api/users:
   *   get:
   *     tags:
   *       - Users
   *     summary: Get all users (Admin only)
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *         description: Whether to include full user details
   *     responses:
   *       200:
   *         description: List of users
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/User'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Admin access required
   */

  /**
   * @swagger
   * /api/users:
   *   post:
   *     tags:
   *       - Users
   *     summary: Create a new user (Admin only)
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - firstName
   *               - lastName
   *               - email
   *             properties:
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *               email:
   *                 type: string
   *                 format: email
   *               showdownUsername:
   *                 type: string
   *               discordUsername:
   *                 type: string
   *               timezone:
   *                 type: string
   *     responses:
   *       201:
   *         description: User created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Admin access required
   *       400:
   *         description: Invalid input
   */

  /**
   * @swagger
   * /api/users/{id}:
   *   put:
   *     tags:
   *       - Users
   *     summary: Update a user (Admin only)
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: User ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               firstName:
   *                 type: string
   *               lastName:
   *                 type: string
   *               email:
   *                 type: string
   *                 format: email
   *               showdownUsername:
   *                 type: string
   *               discordUsername:
   *                 type: string
   *               timezone:
   *                 type: string
   *               isAdmin:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: User updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Admin access required
   *       404:
   *         description: User not found
   *       400:
   *         description: Invalid input
   */

  /**
   * @swagger
   * /api/users/{id}:
   *   delete:
   *     tags:
   *       - Users
   *     summary: Delete a user (Admin only)
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: User ID
   *     responses:
   *       204:
   *         description: User deleted successfully
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Admin access required
   *       404:
   *         description: User not found
   */

  /**
   * @swagger
   * /api/users/{id}/promote:
   *   post:
   *     tags:
   *       - Users
   *     summary: Promote a user to admin (Admin only)
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: User ID
   *     responses:
   *       200:
   *         description: User promoted to admin successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Admin access required
   *       404:
   *         description: User not found
   */
  promoteToAdmin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError('Invalid User ID format');
    }

    const user = await this.userService.promoteToAdmin(id);

    res.json(
      plainToInstance(UserDto, user, {
        excludeExtraneousValues: true,
        groups: ['user.admin'],
      })
    );
  });

  /**
   * @swagger
   * /api/users/{id}/demote:
   *   post:
   *     tags:
   *       - Users
   *     summary: Demote a user from admin (Admin only)
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: User ID
   *     responses:
   *       200:
   *         description: User demoted from admin successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Admin access required
   *       404:
   *         description: User not found
   */
  demoteFromAdmin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError('Invalid User ID format');
    }

    const user = await this.userService.demoteFromAdmin(id);

    res.json(
      plainToInstance(UserDto, user, {
        excludeExtraneousValues: true,
        groups: ['user.admin'],
      })
    );
  });

  protected getFullTransformGroup(): string[] {
    return ['user.full'];
  }
}
