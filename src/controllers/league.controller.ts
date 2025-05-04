import { Request, Response, Router } from 'express';
import { LeagueService } from '../services/league.service';
import { BaseController } from './base.controller';
import { League } from '../entities/league.entity';
import { LeagueDto, CreateLeagueDto, UpdateLeagueDto, LeagueUserDto, CreateLeagueUserDto, UpdateLeagueUserDto, SeasonDto, CreateSeasonDto, UpdateSeasonDto } from '../dtos/league.dto';
import { validateDto } from '../middleware/validation.middleware';
import { isAuthenticated, isLeagueModerator, isLeagueMember, AuthenticatedRequest } from '../middleware/auth.middleware';
import { HttpException, asyncHandler } from '../utils/error.utils';
import { plainToInstance } from 'class-transformer';

export class LeagueController extends BaseController<League, LeagueDto, UpdateLeagueDto> {
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
    this.router.post('/', isAuthenticated, validateDto(CreateLeagueDto), this.createLeague);

    // League moderator routes
    this.router.put('/:id', isAuthenticated, isLeagueModerator(), validateDto(UpdateLeagueDto), this.updateLeague);
    this.router.delete('/:id', isAuthenticated, isLeagueModerator(), this.deleteLeague);

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

  // League methods
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

  getLeagueById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
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

  createLeague = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) {
      throw new HttpException(401, 'Unauthorized');
    }

    const league = await this.leagueService.createLeague(req.body, req.user.id);

    res.status(201).json(
      plainToInstance(LeagueDto, league, {
        excludeExtraneousValues: true,
      })
    );
  });

  updateLeague = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    const league = await this.leagueService.update(id, req.body);

    res.json(
      plainToInstance(LeagueDto, league, {
        excludeExtraneousValues: true,
      })
    );
  });

  deleteLeague = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(req.params.id);
    await this.leagueService.delete(id);

    res.status(204).send();
  });

  // League member methods
  getLeagueMembers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const leagueId = parseInt(req.params.id);
    const members = await this.leagueService.getLeagueMembers(leagueId);

    res.json(
      plainToInstance(LeagueUserDto, members, {
        excludeExtraneousValues: true,
        groups: ['leagueUser.full'],
      })
    );
  });

  addMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const leagueId = parseInt(req.params.id);
    const { userId, isModerator } = req.body;

    const member = await this.leagueService.addUserToLeague(leagueId, userId, isModerator);

    res.status(201).json(
      plainToInstance(LeagueUserDto, member, {
        excludeExtraneousValues: true,
      })
    );
  });

  updateMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const leagueId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);
    const { isModerator } = req.body;

    // Remove and re-add to update
    await this.leagueService.removeUserFromLeague(leagueId, userId);
    const member = await this.leagueService.addUserToLeague(leagueId, userId, isModerator);

    res.json(
      plainToInstance(LeagueUserDto, member, {
        excludeExtraneousValues: true,
      })
    );
  });

  removeMember = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const leagueId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);

    await this.leagueService.removeUserFromLeague(leagueId, userId);

    res.status(204).send();
  });

  // Season methods
  getSeasons = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const leagueId = parseInt(req.params.id);
    const seasons = await this.leagueService.getSeasons(leagueId);

    res.json(
      plainToInstance(SeasonDto, seasons, {
        excludeExtraneousValues: true,
      })
    );
  });

  getSeasonById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const seasonId = parseInt(req.params.seasonId);
    const season = await this.leagueService.getSeason(seasonId);
    const group = req.query.full === 'true' ? ['season.full'] : undefined;

    res.json(
      plainToInstance(SeasonDto, season, {
        excludeExtraneousValues: true,
        groups: group,
      })
    );
  });

  createSeason = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const leagueId = parseInt(req.params.id);

    // Ensure leagueId in path matches leagueId in body
    req.body.leagueId = leagueId;

    const season = await this.leagueService.createSeason(req.body);

    res.status(201).json(
      plainToInstance(SeasonDto, season, {
        excludeExtraneousValues: true,
      })
    );
  });

  updateSeason = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const seasonId = parseInt(req.params.seasonId);
    const season = await this.leagueService.updateSeason(seasonId, req.body);

    res.json(
      plainToInstance(SeasonDto, season, {
        excludeExtraneousValues: true,
      })
    );
  });

  deleteSeason = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const seasonId = parseInt(req.params.seasonId);
    await this.leagueService.deleteSeason(seasonId);

    res.status(204).send();
  });

  protected getFullTransformGroup(): string[] {
    return ['league.full'];
  }
}
