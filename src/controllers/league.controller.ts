import { Request, Router } from 'express';
import { LeagueService } from '../services/league.service';
import { BaseController } from './base.controller';
import { League } from '../entities/league.entity';
import { validateDto, validatePartialDto } from '../middleware/validation.middleware';
import { isAuthenticated, isLeagueModerator } from '../middleware/auth.middleware';
import { LeagueInputDto, LeagueOutputDto } from '../dtos/league.dto';
import { FindOptionsWhere, FindOptionsRelations } from 'typeorm';
import { plainToInstance } from 'class-transformer';

export class LeagueController extends BaseController<League, LeagueInputDto, LeagueOutputDto> {
  public router = Router();

  constructor(private leagueService: LeagueService) {
    super(leagueService, LeagueOutputDto);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Public league routes
    this.router.get('/', this.getAll);
    this.router.get('/:id', this.getById);

    // Authenticated routes
    this.router.post('/', isAuthenticated, validateDto(LeagueInputDto), this.create);

    // League moderator routes
    this.router.put('/:id', isAuthenticated, isLeagueModerator(), validatePartialDto(LeagueInputDto), this.update);
    this.router.delete('/:id', isAuthenticated, isLeagueModerator(), this.delete);
  }

  protected getFullTransformGroup(): string[] {
    return ['league.full', 'leagueUser.full'];
  }

  protected async getWhere(req: Request): Promise<FindOptionsWhere<League> | undefined> {
    return plainToInstance(LeagueInputDto, req.query);
  }

  protected getBaseRelations(): FindOptionsRelations<League> | undefined {
    return undefined;
  }

  protected getFullRelations(): FindOptionsRelations<League> | undefined {
    return {
      leagueUsers: {
        user: true
      },
      seasons: true
    }
  }

  /**
   * @swagger
   * tags:
   *   name: League
   *   description: League CRUD operations
   * 
   * components:
   *   schemas:
   *     League:
   *       type: object
   *       properties:
   *         id:
   *           type: integer
   *         name:
   *           type: string
   *         abbreviation:
   *           type: string
   *         password:
   *           type: string
   *         createdAt:
   *           type: string
   *           format: date-time
   *         updatedAt:
   *           type: string
   *           format: date-time
   *         seasons:
   *           type: array
   *           items:
   *             $ref: '#/components/schemas/Season'
   *         leagueUsers:
   *           type: array
   *           items:
   *             $ref: '#/components/schemas/LeagueUser'
   */

  /**
   * @swagger
   * /api/league:
   *   get:
   *     tags:
   *       - League
   *     summary: Get all leagues
   *     parameters:
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *         description: Whether to include full league details
   *     responses:
   *       200:
   *         description: List of leagues
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/League'
   */

  /**
   * @swagger
   * /api/league/{id}:
   *   get:
   *     tags:
   *       - League
   *     summary: Get a league by ID
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: League ID
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *         description: Whether to include full league details
   *     responses:
   *       200:
   *         description: League details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/League'
   *       404:
   *         description: League not found
   *       400:
   *         description: Invalid League ID format
   */

  /**
   * @swagger
   * /api/league:
   *   post:
   *     tags:
   *       - League
   *     summary: Create a new league
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - abbreviation
   *             properties:
   *               name:
   *                 type: string
   *               abbreviation:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       201:
   *         description: League created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/League'
   *       401:
   *         description: Unauthorized
   *       400:
   *         description: Invalid input
   */
}
