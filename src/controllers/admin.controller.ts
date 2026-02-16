import { Request, Response, Router } from 'express';
import { AdminService } from '../services/admin.service';
import { asyncHandler } from '../utils/error.utils';

export class AdminController {
  public router = Router();

  constructor(private adminService: AdminService) {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.delete('/wipe', this.wipeAllData);
    this.router.post('/initialize-pokemon', this.initializePokemonData);
    this.router.post('/initialize-mock', this.createMockData);
  }

  wipeAllData = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await this.adminService.wipeAllData();
    res.status(200).json({ message: 'All data has been wiped successfully' });
  });

  initializePokemonData = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await this.adminService.initializePokemonData();
    res.status(201).json({ message: 'Pokemon data initialized successfully' });
  });

  createMockData = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await this.adminService.createMockData();
    res.status(201).json({ message: 'Mock data created successfully' });
  });

  /**
   * @swagger
   * tags:
   *   name: Admin
   *   description: Administrative database management operations (admin access only)
   *
   * components:
   *   schemas:
   *     AdminResponse:
   *       type: object
   *       required:
   *         - message
   *       properties:
   *         message:
   *           type: string
   *           description: Status message describing the result of the operation
   *           example: "All data has been wiped successfully"
   */

  /**
   * @swagger
   * /api/admin/wipe:
   *   delete:
   *     tags:
   *       - Admin
   *     summary: Wipe all data from the database
   *     description: |
   *       Truncates all tables in the database, removing all data and resetting auto-increment sequences.
   *       Uses CASCADE to handle foreign key constraints automatically.
   *       **WARNING: This action is irreversible and will destroy all data.**
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: All data wiped successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AdminResponse'
   *             example:
   *               message: "All data has been wiped successfully"
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
   *       403:
   *         description: User is not an admin
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Admin access required"
   *               statusCode: 403
   *               timestamp: "2024-01-20T10:00:00.000Z"
   */

  /**
   * @swagger
   * /api/admin/initialize-pokemon:
   *   post:
   *     tags:
   *       - Admin
   *     summary: Initialize Pokemon data
   *     description: |
   *       Populates the database with all Pokemon-related data including types, generations,
   *       abilities, moves, Pokemon, and type effectiveness data from a third-party data source.
   *       **Note: This endpoint is not yet implemented.**
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       201:
   *         description: Pokemon data initialized successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AdminResponse'
   *             example:
   *               message: "Pokemon data initialized successfully"
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
   *       403:
   *         description: User is not an admin
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Admin access required"
   *               statusCode: 403
   *               timestamp: "2024-01-20T10:00:00.000Z"
   */

  /**
   * @swagger
   * /api/admin/initialize-mock:
   *   post:
   *     tags:
   *       - Admin
   *     summary: Create mock data
   *     description: |
   *       Populates the database with mock data for non-Pokemon related tables including
   *       users, leagues, seasons, teams, matches, and games.
   *       Requires Pokemon data to be initialized first via the `/api/admin/initialize-pokemon` endpoint.
   *       **Note: This endpoint is not yet implemented.**
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       201:
   *         description: Mock data created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AdminResponse'
   *             example:
   *               message: "Mock data created successfully"
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
   *       403:
   *         description: User is not an admin
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ErrorResponse'
   *             example:
   *               error: "Admin access required"
   *               statusCode: 403
   *               timestamp: "2024-01-20T10:00:00.000Z"
   */
}
