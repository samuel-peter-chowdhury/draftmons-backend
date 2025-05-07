import { Repository } from 'typeorm';
import { League } from '../entities/league.entity';
import { LeagueUser } from '../entities/league-user.entity';
import { Season } from '../entities/season.entity';
import { BaseService } from './base.service';
import { HttpException } from '../utils/error.utils';
import { CreateLeagueDto, CreateSeasonDto, UpdateSeasonDto } from '../dtos/league.dto';
import { Service, Inject } from 'typedi';

@Service()
export class LeagueService extends BaseService<League> {
  constructor(
    @Inject('LeagueRepository')
    private leagueRepository: Repository<League>,

    @Inject('LeagueUserRepository')
    private leagueUserRepository: Repository<LeagueUser>,

    @Inject('SeasonRepository')
    private seasonRepository: Repository<Season>
  ) {
    super(leagueRepository);
  }

  async findAllWithDetails(): Promise<League[]> {
    return this.leagueRepository.find({
      relations: ['seasons', 'leagueUsers', 'leagueUsers.user'],
    });
  }

  async findOneWithDetails(id: number): Promise<League> {
    const league = await this.leagueRepository.findOne({
      where: { id },
      relations: ['seasons', 'leagueUsers', 'leagueUsers.user'],
    });

    if (!league) {
      throw new HttpException(404, 'League not found');
    }

    return league;
  }

  async createLeague(createLeagueDto: CreateLeagueDto, creatorId: number): Promise<League> {
    // Create the league
    const league = await this.create(createLeagueDto);

    // Add creator as a moderator
    await this.leagueUserRepository.save({
      leagueId: league.id,
      userId: creatorId,
      isModerator: true,
    });

    return this.findOneWithDetails(league.id);
  }

  async addUserToLeague(leagueId: number, userId: number, isModerator: boolean = false): Promise<LeagueUser> {
    // Check if user is already in the league
    const existingMembership = await this.leagueUserRepository.findOne({
      where: {
        leagueId,
        userId,
      },
    });

    if (existingMembership) {
      // If only changing moderator status, update that
      if (existingMembership.isModerator !== isModerator) {
        existingMembership.isModerator = isModerator;
        return this.leagueUserRepository.save(existingMembership);
      }

      throw new HttpException(400, 'User is already a member of this league');
    }

    // Add user to league
    return this.leagueUserRepository.save({
      leagueId,
      userId,
      isModerator,
    });
  }

  async removeUserFromLeague(leagueId: number, userId: number): Promise<boolean> {
    // Check if user is in the league
    const membership = await this.leagueUserRepository.findOne({
      where: {
        leagueId,
        userId,
      },
    });

    if (!membership) {
      throw new HttpException(404, 'User is not a member of this league');
    }

    // Remove user from league
    await this.leagueUserRepository.remove(membership);
    return true;
  }

  async getLeagueMembers(leagueId: number): Promise<LeagueUser[]> {
    return this.leagueUserRepository.find({
      where: { leagueId },
      relations: ['user'],
    });
  }

  // Season methods
  async getSeasons(leagueId: number): Promise<Season[]> {
    return this.seasonRepository.find({
      where: { leagueId },
    });
  }

  async getSeason(id: number): Promise<Season> {
    const season = await this.seasonRepository.findOne({
      where: { id },
      relations: ['league', 'teams', 'weeks'],
    });

    if (!season) {
      throw new HttpException(404, 'Season not found');
    }

    return season;
  }

  async createSeason(createSeasonDto: CreateSeasonDto): Promise<Season> {
    // Verify league exists
    await this.findOne(createSeasonDto.leagueId);

    // Create season
    const season = this.seasonRepository.create(createSeasonDto);
    return this.seasonRepository.save(season);
  }

  async updateSeason(id: number, updateSeasonDto: UpdateSeasonDto): Promise<Season> {
    const season = await this.getSeason(id);

    // Update season
    Object.assign(season, updateSeasonDto);
    await this.seasonRepository.save(season);

    return this.getSeason(id);
  }

  async deleteSeason(id: number): Promise<boolean> {
    const season = await this.getSeason(id);

    await this.seasonRepository.remove(season);
    return true;
  }
}
