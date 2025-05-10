import { Request, Response, Router } from 'express';
import { LeagueService } from '../services/league.service';
import { BaseController } from './base.controller';
import { League } from '../entities/league.entity';
import { LeagueDto, CreateLeagueDto, UpdateLeagueDto, LeagueUserDto, CreateLeagueUserDto, UpdateLeagueUserDto, SeasonDto, CreateSeasonDto, UpdateSeasonDto } from '../dtos/league.dto';
import { validateDto } from '../middleware/validation.middleware';
import { isAuthenticated, isLeagueModerator, isLeagueMember, AuthenticatedRequest } from '../middleware/auth.middleware';
import { ValidationError, UnauthorizedError } from '../errors';
import { plainToInstance } from 'class-transformer';
import { asyncHandler } from '../utils/error.utils';

/**
 * @swagger
 * tags:
 *   name: Leagues
 *   description: League management and operations
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
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         seasons:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SeasonSummary'
 *         leagueUsers:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/LeagueUser'
 *     SeasonSummary:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         gen:
 *           type: string
 *         status:
 *           type: string
 *           enum: [DRAFT, ACTIVE, COMPLETED]
 *     LeagueUser:
 *       type: object
 *       properties:
 *         leagueId:
 *           type: integer
 *         userId:
 *           type: integer
 *         isModerator:
 *           type: boolean
 *         user:
 *           $ref: '#/components/schemas/User'
 *         league:
 *           $ref: '#/components/schemas/League'
 *     Season:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         gen:
 *           type: string
 *         status:
 *           type: string
 *           enum: [DRAFT, ACTIVE, COMPLETED]
 *         rules:
 *           type: string
 *           nullable: true
 *         pointLimit:
 *           type: number
 *         maxPointValue:
 *           type: number
 *         leagueId:
 *           type: integer
 *         league:
 *           $ref: '#/components/schemas/League'
 *         teams:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TeamSummary'
 *         weeks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/WeekSummary'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     TeamSummary:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         userId:
 *           type: integer
 *     WeekSummary:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         number:
 *           type: integer
 *         status:
 *           type: string
 *           enum: [PENDING, ACTIVE, COMPLETED]
 */

export class LeagueController extends BaseController<League, LeagueDto> {
  public router = Router();

  constructor(private leagueService: LeagueService) {
    super(leagueService, LeagueDto);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Public league routes
    this.router.get('/', this.getAllLeagues);
    this.router.get('/:id', this.getLeagueById);

    // Authenticated routes
    this.router.post('/', isAuthenticated, validateDto(CreateLeagueDto), this.create);

    // League moderator routes
    this.router.put('/:id', isAuthenticated, isLeagueModerator(), validateDto(UpdateLeagueDto), this.update);
    this.router.delete('/:id', isAuthenticated, isLeagueModerator(), this.delete);

    // League user management
    this.router.get('/:id/members', isAuthenticated, isLeagueMember(), this.getLeagueMembers);
    this.router.post('/:id/members', isAuthenticated, isLeagueModerator(), validateDto(CreateLeagueUserDto), this.addMember);
    this.router.put('/:id/members/:userId', isAuthenticated, isLeagueModerator(), validateDto(UpdateLeagueUserDto), this.updateMember);
    this.router.delete('/:id/members/:userId', isAuthenticated, isLeagueModerator(), this.removeMember);

    // Season routes
    this.router.get('/:id/seasons', this.getSeasons);
    this.router.get('/:id/seasons/:seasonId', this.getSeasonById);
    this.router.post('/:id/seasons', isAuthenticated, isLeagueModerator(), validateDto(CreateSeasonDto), this.createSeason);
    this.router.put('/:id/seasons/:seasonId', isAuthenticated, isLeagueModerator(), validateDto(UpdateSeasonDto), this.updateSeason);
    this.router.delete('/:id/seasons/:seasonId', isAuthenticated, isLeagueModerator(), this.deleteSeason);
  }

  /**
   * @swagger
   * /api/leagues:
   *   get:
   *     tags:
   *       - Leagues
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
  getAllLeagues = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const leagues = await this.leagueService.findAll();
    const group = req.query.full === 'true' ? this.getFullTransformGroup() : undefined;

    res.json(
      plainToInstance(LeagueDto, leagues, {
        excludeExtraneousValues: true,
        groups: group,
      })
    );
  });

  /**
   * @swagger
   * /api/leagues/{id}:
   *   get:
   *     tags:
   *       - Leagues
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
  getLeagueById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new ValidationError('Invalid League ID format');
    }

    let league: League;

    if (req.query.full === 'true') {
      league = await this.leagueService.findOneWithDetails(id);
    } else {
      league = await this.leagueService.findOne(id);
    }

    const group = req.query.full === 'true' ? this.getFullTransformGroup() : undefined;

    res.json(
      plainToInstance(LeagueDto, league, {
        excludeExtraneousValues: true,
        groups: group,
      })
    );
  });

  /**
   * @swagger
   * /api/leagues:
   *   post:
   *     tags:
   *       - Leagues
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
  create = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const league = await this.leagueService.createLeague(req.body, req.user.id);

    res.status(201).json(
      plainToInstance(LeagueDto, league, {
        excludeExtraneousValues: true,
      })
    );
  });

  /**
   * @swagger
   * /api/leagues/{id}/members:
   *   get:
   *     tags:
   *       - Leagues
   *     summary: Get league members
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: League ID
   *     responses:
   *       200:
   *         description: List of league members
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/LeagueUser'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Not a league member
   *       404:
   *         description: League not found
   *       400:
   *         description: Invalid League ID format
   */
  getLeagueMembers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const leagueId = parseInt(req.params.id);
    if (isNaN(leagueId)) {
      throw new ValidationError('Invalid League ID format');
    }

    const members = await this.leagueService.getLeagueMembers(leagueId);

    res.json(
      plainToInstance(LeagueUserDto, members, {
        excludeExtraneousValues: true,
        groups: ['leagueUser.full'],
      })
    );
  });

  /**
   * @swagger
   * /api/leagues/{id}/members:
   *   post:
   *     tags:
   *       - Leagues
   *     summary: Add a member to the league
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: League ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - userId
   *             properties:
   *               userId:
   *                 type: integer
   *               isModerator:
   *                 type: boolean
   *     responses:
   *       201:
   *         description: Member added successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LeagueUser'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Not a league moderator
   *       404:
   *         description: League or user not found
   *       400:
   *         description: Invalid input
   */
  addMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const leagueId = parseInt(req.params.id);
    if (isNaN(leagueId)) {
      throw new ValidationError('Invalid League ID format');
    }

    const { userId, isModerator } = req.body;
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const member = await this.leagueService.addUserToLeague(leagueId, userId, isModerator);

    res.status(201).json(
      plainToInstance(LeagueUserDto, member, {
        excludeExtraneousValues: true,
      })
    );
  });

  /**
   * @swagger
   * /api/leagues/{id}/members/{userId}:
   *   put:
   *     tags:
   *       - Leagues
   *     summary: Update a league member's role
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: League ID
   *       - in: path
   *         name: userId
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
   *             required:
   *               - isModerator
   *             properties:
   *               isModerator:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Member updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LeagueUser'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Not a league moderator
   *       404:
   *         description: League or user not found
   *       400:
   *         description: Invalid input
   */
  updateMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const leagueId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    if (isNaN(leagueId)) {
      throw new ValidationError('Invalid League ID format');
    }
    if (isNaN(userId)) {
      throw new ValidationError('Invalid User ID format');
    }

    const { isModerator } = req.body;
    if (typeof isModerator !== 'boolean') {
      throw new ValidationError('isModerator must be a boolean');
    }

    // Remove and re-add to update
    await this.leagueService.removeUserFromLeague(leagueId, userId);
    const member = await this.leagueService.addUserToLeague(leagueId, userId, isModerator);

    res.json(
      plainToInstance(LeagueUserDto, member, {
        excludeExtraneousValues: true,
      })
    );
  });

  /**
   * @swagger
   * /api/leagues/{id}/members/{userId}:
   *   delete:
   *     tags:
   *       - Leagues
   *     summary: Remove a member from the league
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: League ID
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: integer
   *         description: User ID
   *     responses:
   *       204:
   *         description: Member removed successfully
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Not a league moderator
   *       404:
   *         description: League or user not found
   *       400:
   *         description: Invalid input
   */
  removeMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const leagueId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    if (isNaN(leagueId)) {
      throw new ValidationError('Invalid League ID format');
    }
    if (isNaN(userId)) {
      throw new ValidationError('Invalid User ID format');
    }

    await this.leagueService.removeUserFromLeague(leagueId, userId);

    res.status(204).send();
  });

  /**
   * @swagger
   * /api/leagues/{id}/seasons:
   *   get:
   *     tags:
   *       - Leagues
   *     summary: Get all seasons for a league
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: League ID
   *     responses:
   *       200:
   *         description: List of seasons
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Season'
   *       404:
   *         description: League not found
   *       400:
   *         description: Invalid League ID format
   */
  getSeasons = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const leagueId = parseInt(req.params.id);
    if (isNaN(leagueId)) {
      throw new ValidationError('Invalid League ID format');
    }

    const seasons = await this.leagueService.getSeasons(leagueId);

    res.json(
      plainToInstance(SeasonDto, seasons, {
        excludeExtraneousValues: true,
      })
    );
  });

  /**
   * @swagger
   * /api/leagues/{id}/seasons/{seasonId}:
   *   get:
   *     tags:
   *       - Leagues
   *     summary: Get a season by ID
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: League ID
   *       - in: path
   *         name: seasonId
   *         required: true
   *         schema:
   *           type: integer
   *         description: Season ID
   *       - in: query
   *         name: full
   *         schema:
   *           type: boolean
   *         description: Whether to include full season details
   *     responses:
   *       200:
   *         description: Season details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Season'
   *       404:
   *         description: Season not found
   *       400:
   *         description: Invalid ID format
   */
  getSeasonById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const seasonId = parseInt(req.params.seasonId);
    if (isNaN(seasonId)) {
      throw new ValidationError('Invalid Season ID format');
    }

    const season = await this.leagueService.getSeason(seasonId);
    const group = req.query.full === 'true' ? ['season.full'] : undefined;

    res.json(
      plainToInstance(SeasonDto, season, {
        excludeExtraneousValues: true,
        groups: group,
      })
    );
  });

  /**
   * @swagger
   * /api/leagues/{id}/seasons:
   *   post:
   *     tags:
   *       - Leagues
   *     summary: Create a new season
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: League ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - gen
   *               - status
   *               - leagueId
   *             properties:
   *               name:
   *                 type: string
   *               gen:
   *                 type: string
   *               status:
   *                 type: string
   *                 enum: [DRAFT, ACTIVE, COMPLETED]
   *               rules:
   *                 type: string
   *               pointLimit:
   *                 type: number
   *               maxPointValue:
   *                 type: number
   *               leagueId:
   *                 type: integer
   *     responses:
   *       201:
   *         description: Season created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Season'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Not a league moderator
   *       404:
   *         description: League not found
   *       400:
   *         description: Invalid input
   */
  createSeason = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const leagueId = parseInt(req.params.id);
    if (isNaN(leagueId)) {
      throw new ValidationError('Invalid League ID format');
    }

    // Ensure leagueId in path matches leagueId in body
    req.body.leagueId = leagueId;

    const season = await this.leagueService.createSeason(req.body);

    res.status(201).json(
      plainToInstance(SeasonDto, season, {
        excludeExtraneousValues: true,
      })
    );
  });

  /**
   * @swagger
   * /api/leagues/{id}/seasons/{seasonId}:
   *   put:
   *     tags:
   *       - Leagues
   *     summary: Update a season
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: League ID
   *       - in: path
   *         name: seasonId
   *         required: true
   *         schema:
   *           type: integer
   *         description: Season ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               gen:
   *                 type: string
   *               status:
   *                 type: string
   *                 enum: [DRAFT, ACTIVE, COMPLETED]
   *               rules:
   *                 type: string
   *               pointLimit:
   *                 type: number
   *               maxPointValue:
   *                 type: number
   *     responses:
   *       200:
   *         description: Season updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Season'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Not a league moderator
   *       404:
   *         description: Season not found
   *       400:
   *         description: Invalid input
   */
  updateSeason = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const seasonId = parseInt(req.params.seasonId);
    if (isNaN(seasonId)) {
      throw new ValidationError('Invalid Season ID format');
    }

    const season = await this.leagueService.updateSeason(seasonId, req.body);

    res.json(
      plainToInstance(SeasonDto, season, {
        excludeExtraneousValues: true,
      })
    );
  });

  /**
   * @swagger
   * /api/leagues/{id}/seasons/{seasonId}:
   *   delete:
   *     tags:
   *       - Leagues
   *     summary: Delete a season
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: League ID
   *       - in: path
   *         name: seasonId
   *         required: true
   *         schema:
   *           type: integer
   *         description: Season ID
   *     responses:
   *       204:
   *         description: Season deleted successfully
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - Not a league moderator
   *       404:
   *         description: Season not found
   *       400:
   *         description: Invalid ID format
   */
  deleteSeason = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const seasonId = parseInt(req.params.seasonId);
    if (isNaN(seasonId)) {
      throw new ValidationError('Invalid Season ID format');
    }

    await this.leagueService.deleteSeason(seasonId);

    res.status(204).send();
  });

  protected getFullTransformGroup(): string[] {
    return ['league.full'];
  }
}
