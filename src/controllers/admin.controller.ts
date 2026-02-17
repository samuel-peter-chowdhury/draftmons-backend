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
    res.status(200).json({ message: 'All data has been wiped successfully (admin users preserved)' });
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
   *           example: "All data has been wiped successfully (admin users preserved)"
   */

  /**
   * @swagger
   * /api/admin/wipe:
   *   delete:
   *     tags:
   *       - Admin
   *     summary: Wipe all data from the database (except admin users)
   *     description: |
   *       Truncates all tables in the database except the user table, removing all data and
   *       resetting auto-increment sequences. Then deletes all non-admin users.
   *       Only admin user accounts are preserved.
   *       Uses CASCADE to handle foreign key constraints automatically.
   *       **WARNING: This action is irreversible and will destroy all non-admin data.**
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
   *               message: "All data has been wiped successfully (admin users preserved)"
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
   *       Populates the database with all Pokemon-related data using fixture data and the
   *       @pkmn/dex package. Initializes the following tables in order: generations, Pokemon types,
   *       special move categories, abilities (gen 1-9 + nat dex), moves with special move category
   *       links (gen 1-9 + nat dex), Pokemon with type/ability/move links and type effectiveness
   *       calculations (gen 1-9 + nat dex). This operation may take several minutes to complete.
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
   *       Populates the database with deterministic mock data (seeded via @faker-js/faker) for
   *       non-Pokemon related tables. Creates 8 Pokemon trainer users, 2 leagues, 3 seasons
   *       (playoffs, regular season, pre-draft) across Gen 9 and Nat Dex, 8 teams with drafted
   *       rosters of 10 Pokemon each, round-robin match schedules, best-of-3 games with results,
   *       and per-Pokemon game stats with kill/death distributions.
   *       Requires Pokemon data to be initialized first via the `/api/admin/initialize-pokemon` endpoint.
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
