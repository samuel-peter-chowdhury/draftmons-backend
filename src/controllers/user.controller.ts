import { Request, Response, Router } from 'express';
import { UserService } from '../services/user.service';
import { BaseController } from './base.controller';
import { User } from '../entities/user.entity';
import { validateDto, validatePartialDto } from '../middleware/validation.middleware';
import { isAuthenticated, isAdmin, isAdminOrUser } from '../middleware/auth.middleware';
import { UserInputDto, UserOutputDto } from '../dtos/user.dto';
import { FindOptionsWhere, FindOptionsRelations, Brackets, Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { asyncHandler } from '../utils/error.utils';

export class UserController extends BaseController<User, UserInputDto, UserOutputDto> {
  public router = Router();

  constructor(private userService: UserService) {
    super(userService, UserOutputDto);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // GET routes require authentication
    this.router.get('/', isAuthenticated, this.getAll);
    this.router.get('/:id', isAuthenticated, this.getById);

    // POST and DELETE require admin
    this.router.post('/', isAuthenticated, isAdmin, validateDto(UserInputDto), this.create);
    this.router.delete('/:id', isAuthenticated, isAdmin, this.delete);

    // PUT allows user to update their own profile OR admin to update any
    this.router.put(
      '/:id',
      isAuthenticated,
      isAdminOrUser(),
      validatePartialDto(UserInputDto),
      this.update,
    );
  }

  getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const isFull = req.query.full === 'true';
    const relations = isFull ? this.getFullRelations() : this.getBaseRelations();
    const paginationOptions = await this.getPaginationOptions(req);
    const sortOptions = await this.getSortOptions(req);
    const group = isFull ? this.getFullTransformGroup() : undefined;

    const paginatedEntities = await this.userService.search(
      req,
      relations,
      paginationOptions,
      sortOptions,
    );

    const response = {
      data: plainToInstance(this.outputDtoClass, paginatedEntities.data, {
        groups: group,
        excludeExtraneousValues: true,
      }),
      total: paginatedEntities.total,
      page: paginatedEntities.page,
      pageSize: paginatedEntities.pageSize,
      totalPages: paginatedEntities.totalPages,
    };
    res.json(response);
  });

  protected getFullTransformGroup(): string[] {
    return ['user.full'];
  }

  protected getAllowedSortFields(): string[] {
    return ['id', 'firstName', 'lastName', 'email', 'createdAt', 'updatedAt'];
  }

  protected async getWhere(
    req: Request,
  ): Promise<FindOptionsWhere<User> | FindOptionsWhere<User>[] | undefined> {
    return plainToInstance(UserInputDto, req.query, {
      excludeExtraneousValues: true,
    });
  }

  protected getBaseRelations(): FindOptionsRelations<User> | undefined {
    return undefined;
  }

  protected getFullRelations(): FindOptionsRelations<User> | undefined {
    return undefined;
  }

  /**
   * @swagger
   * tags:
   *   name: User
   *   description: User management and operations
   *
   * components:
   *   schemas:
   *     User:
   *       type: object
   *       required:
   *         - id
   *         - email
   *         - isAdmin
   *         - isActive
   *         - createdAt
   *         - updatedAt
   *       properties:
   *         id:
   *           type: integer
   *           description: Unique identifier of the user
   *           example: 1
   *         firstName:
   *           type: string
   *           nullable: true
   *           description: User's first name
   *           example: "John"
   *         lastName:
   *           type: string
   *           nullable: true
   *           description: User's last name
   *           example: "Doe"
   *         fullName:
   *           type: string
   *           description: User's full name (computed from firstName and lastName)
   *           example: "John Doe"
   *         email:
   *           type: string
   *           format: email
   *           description: User's email address (unique)
   *           example: "john.doe@example.com"
   *         isAdmin:
   *           type: boolean
   *           description: Whether the user has admin privileges
   *           example: false
   *         googleId:
   *           type: string
   *           nullable: true
   *           description: User's Google OAuth ID
   *           example: "1234567890"
   *         showdownUsername:
   *           type: string
   *           nullable: true
   *           description: User's Pokemon Showdown username
   *           example: "JohnDoe123"
   *         discordUsername:
   *           type: string
   *           nullable: true
   *           description: User's Discord username
   *           example: "JohnDoe#1234"
   *         timezone:
   *           type: string
   *           nullable: true
   *           description: User's timezone
   *           example: "America/New_York"
   *         isActive:
   *           type: boolean
   *           description: Whether the user account is currently active
   *           example: true
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the user was created
   *           example: "2024-01-01T00:00:00.000Z"
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: Timestamp when the user was last updated
   *           example: "2024-01-15T12:30:00.000Z"
   *
   *     UserFull:
   *       allOf:
   *         - $ref: '#/components/schemas/User'
   *         - type: object
   *           properties:
   *             leagueUsers:
   *               type: array
   *               description: List of league memberships
   *               items:
   *                 $ref: '#/components/schemas/LeagueUser'
   *             teams:
   *               type: array
   *               description: List of teams owned by the user
   *               items:
   *                 $ref: '#/components/schemas/Team'
   *
   *     UserInput:
   *       type: object
   *       required:
   *         - isAdmin
   *       properties:
   *         firstName:
   *           type: string
   *           nullable: true
   *           description: User's first name
   *           example: "John"
   *           maxLength: 100
   *         lastName:
   *           type: string
   *           nullable: true
   *           description: User's last name
   *           example: "Doe"
   *           maxLength: 100
   *         email:
   *           type: string
   *           format: email
   *           description: User's email address (must be unique)
   *           example: "john.doe@example.com"
   *           maxLength: 255
   *         isAdmin:
   *           type: boolean
   *           description: Whether the user has admin privileges
   *           example: false
   *         googleId:
   *           type: string
   *           nullable: true
   *           description: User's Google OAuth ID
   *           example: "1234567890"
   *           maxLength: 255
   *         showdownUsername:
   *           type: string
   *           nullable: true
   *           description: User's Pokemon Showdown username
   *           example: "JohnDoe123"
   *           maxLength: 100
   *         discordUsername:
   *           type: string
   *           nullable: true
   *           description: User's Discord username
   *           example: "JohnDoe#1234"
   *           maxLength: 100
   *         timezone:
   *           type: string
   *           nullable: true
   *           description: User's timezone
   *           example: "America/New_York"
   *           maxLength: 50
   *
   *     UserUpdateInput:
   *       type: object
   *       properties:
   *         firstName:
   *           type: string
   *           nullable: true
   *           description: User's first name
   *           example: "John"
   *           maxLength: 100
   *         lastName:
   *           type: string
   *           nullable: true
   *           description: User's last name
   *           example: "Doe"
   *           maxLength: 100
   *         email:
   *           type: string
   *           format: email
   *           description: User's email address (must be unique)
   *           example: "john.doe@example.com"
   *           maxLength: 255
   *         isAdmin:
   *           type: boolean
   *           description: Whether the user has admin privileges
   *           example: false
   *         googleId:
   *           type: string
   *           nullable: true
   *           description: User's Google OAuth ID
   *           example: "1234567890"
   *           maxLength: 255
   *         showdownUsername:
   *           type: string
   *           nullable: true
   *           description: User's Pokemon Showdown username
   *           example: "JohnDoe123"
   *           maxLength: 100
   *         discordUsername:
   *           type: string
   *           nullable: true
   *           description: User's Discord username
   *           example: "JohnDoe#1234"
   *           maxLength: 100
   *         timezone:
   *           type: string
   *           nullable: true
   *           description: User's timezone
   *           example: "America/New_York"
   *           maxLength: 50
   */

  /**
   * @swagger
   * /api/user:
   *   get:
   *     tags:
   *       - User
   *     summary: Get all users
   *     description: Retrieve a list of all users with optional pagination, sorting, and full details
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: Page number for pagination
   *       - in: query
   *         name: pageSize
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 25
   *         description: Number of items per page
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *         description: Field name to sort by (e.g., email, firstName, createdAt)
   *         example: email
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [ASC, DESC]
   *           default: ASC
   *         description: Sort order (ascending or descending)
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full user details (leagueUsers and teams)
   *       - in: query
   *         name: nameLike
   *         schema:
   *           type: string
   *         description: Search for first name, last name, full name (first + last), or email using LIKE
   *     responses:
   *       200:
   *         description: List of users retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 oneOf:
   *                   - $ref: '#/components/schemas/User'
   *                   - $ref: '#/components/schemas/UserFull'
   *             examples:
   *               basic:
   *                 summary: Basic user list
   *                 value:
   *                   - id: 1
   *                     firstName: "John"
   *                     lastName: "Doe"
   *                     fullName: "John Doe"
   *                     email: "john.doe@example.com"
   *                     isAdmin: false
   *                     googleId: "1234567890"
   *                     showdownUsername: "JohnDoe123"
   *                     discordUsername: "JohnDoe#1234"
   *                     timezone: "America/New_York"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *                   - id: 2
   *                     firstName: "Jane"
   *                     lastName: "Smith"
   *                     fullName: "Jane Smith"
   *                     email: "jane.smith@example.com"
   *                     isAdmin: true
   *                     googleId: null
   *                     showdownUsername: "JaneS"
   *                     discordUsername: "JaneSmith#5678"
   *                     timezone: "Europe/London"
   *                     isActive: true
   *                     createdAt: "2024-01-01T00:00:00.000Z"
   *                     updatedAt: "2024-01-15T12:30:00.000Z"
   *       400:
   *         description: Invalid query parameters
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/user/{id}:
   *   get:
   *     tags:
   *       - User
   *     summary: Get a user by ID
   *     description: Retrieve detailed information about a specific user
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the user
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full user details (leagueUsers and teams)
   *     responses:
   *       200:
   *         description: User details retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/User'
   *                 - $ref: '#/components/schemas/UserFull'
   *             examples:
   *               basic:
   *                 summary: Basic user details
   *                 value:
   *                   id: 1
   *                   firstName: "John"
   *                   lastName: "Doe"
   *                   fullName: "John Doe"
   *                   email: "john.doe@example.com"
   *                   isAdmin: false
   *                   googleId: "1234567890"
   *                   showdownUsername: "JohnDoe123"
   *                   discordUsername: "JohnDoe#1234"
   *                   timezone: "America/New_York"
   *                   isActive: true
   *                   createdAt: "2024-01-01T00:00:00.000Z"
   *                   updatedAt: "2024-01-15T12:30:00.000Z"
   *       400:
   *         description: Invalid user ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/user:
   *   post:
   *     tags:
   *       - User
   *     summary: Create a new user
   *     description: Create a new user account with profile information
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UserInput'
   *           examples:
   *             standard:
   *               summary: Create a standard user
   *               value:
   *                 firstName: "Alice"
   *                 lastName: "Johnson"
   *                 email: "alice.johnson@example.com"
   *                 isAdmin: false
   *                 showdownUsername: "AliceJ"
   *                 discordUsername: "AliceJ#9012"
   *                 timezone: "America/Chicago"
   *             admin:
   *               summary: Create an admin user
   *               value:
   *                 firstName: "Bob"
   *                 lastName: "Admin"
   *                 email: "bob.admin@example.com"
   *                 isAdmin: true
   *                 timezone: "UTC"
   *     responses:
   *       201:
   *         description: User created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *             example:
   *               id: 3
   *               firstName: "Alice"
   *               lastName: "Johnson"
   *               fullName: "Alice Johnson"
   *               email: "alice.johnson@example.com"
   *               isAdmin: false
   *               googleId: null
   *               showdownUsername: "AliceJ"
   *               discordUsername: "AliceJ#9012"
   *               timezone: "America/Chicago"
   *               isActive: true
   *               createdAt: "2024-01-20T10:00:00.000Z"
   *               updatedAt: "2024-01-20T10:00:00.000Z"
   *       400:
   *         description: Invalid input data or email already exists
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "email: must be a valid email; isAdmin: must be a boolean"
   *               statusCode: 400
   *               timestamp: "2024-01-20T10:00:00.000Z"
   *       401:
   *         description: User not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Please log in to access this resource"
   *               statusCode: 401
   *               timestamp: "2024-01-20T10:00:00.000Z"
   */

  /**
   * @swagger
   * /api/user/{id}:
   *   put:
   *     tags:
   *       - User
   *     summary: Update a user
   *     description: Update an existing user's information. All fields are optional for partial updates.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the user
   *         example: 1
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *           default: false
   *         description: Include full user details in the response
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UserUpdateInput'
   *           examples:
   *             updateProfile:
   *               summary: Update profile information
   *               value:
   *                 firstName: "Johnny"
   *                 showdownUsername: "JohnnyD"
   *                 timezone: "America/Los_Angeles"
   *             updateMultiple:
   *               summary: Update multiple fields
   *               value:
   *                 firstName: "Johnny"
   *                 lastName: "Davidson"
   *                 email: "johnny.davidson@example.com"
   *                 discordUsername: "JohnnyD#4321"
   *     responses:
   *       200:
   *         description: User updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/User'
   *                 - $ref: '#/components/schemas/UserFull'
   *             example:
   *               id: 1
   *               firstName: "Johnny"
   *               lastName: "Davidson"
   *               fullName: "Johnny Davidson"
   *               email: "johnny.davidson@example.com"
   *               isAdmin: false
   *               googleId: "1234567890"
   *               showdownUsername: "JohnnyD"
   *               discordUsername: "JohnnyD#4321"
   *               timezone: "America/Los_Angeles"
   *               isActive: true
   *               createdAt: "2024-01-01T00:00:00.000Z"
   *               updatedAt: "2024-01-20T15:00:00.000Z"
   *       400:
   *         description: Invalid user ID format or invalid input data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *       401:
   *         description: User not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Please log in to access this resource"
   *               statusCode: 401
   *               timestamp: "2024-01-20T15:00:00.000Z"
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   */

  /**
   * @swagger
   * /api/user/{id}:
   *   delete:
   *     tags:
   *       - User
   *     summary: Delete a user
   *     description: |
   *       Permanently delete a user account.
   *       This action cannot be undone.
   *       Note: Ensure the user has no active teams or league memberships before deletion.
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *           minimum: 1
   *         description: Unique identifier of the user to delete
   *         example: 1
   *     responses:
   *       204:
   *         description: User deleted successfully (no content returned)
   *       400:
   *         description: Invalid user ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Invalid ID format"
   *               statusCode: 400
   *               timestamp: "2024-01-20T16:00:00.000Z"
   *       401:
   *         description: User not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Please log in to access this resource"
   *               statusCode: 401
   *               timestamp: "2024-01-20T16:00:00.000Z"
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "User not found"
   *               statusCode: 404
   *               timestamp: "2024-01-20T16:00:00.000Z"
   */
}
