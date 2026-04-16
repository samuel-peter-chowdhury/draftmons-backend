import { Router, Request, Response } from 'express';
import { Container } from 'typedi';
import { Repository, Not, IsNull } from 'typeorm';
import { DiscordService } from '../services/discord.service';
import { asyncHandler } from '../utils/error.utils';
import { isAuthenticated } from '../middleware/auth.middleware';
import { League } from '../entities/league.entity';

export class DiscordController {
  public router = Router({ mergeParams: true });
  private discordService: DiscordService;
  private leagueRepository: Repository<League>;

  constructor() {
    this.discordService = Container.get(DiscordService);
    this.leagueRepository = Container.get('LeagueRepository') as Repository<League>;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get('/guilds', isAuthenticated, asyncHandler(this.getGuilds));
    this.router.get('/guilds/:guildId/channels', isAuthenticated, asyncHandler(this.getChannels));
  }

  private getGuilds = async (req: Request, res: Response): Promise<void> => {
    if (this.discordService.getStatus() !== 'connected') {
      res.status(503).json({ message: 'Discord bot is not available' });
      return;
    }

    const guilds = this.discordService.getGuilds();
    if (!guilds) {
      res.status(503).json({ message: 'Discord bot is not available' });
      return;
    }

    const linkedLeagues = await this.leagueRepository.find({
      where: { discordGuildId: Not(IsNull()) },
      select: ['id', 'name', 'discordGuildId'],
    });

    const guildLeagueMap = new Map(linkedLeagues.map((l) => [l.discordGuildId!, l.name]));

    const result = guilds.map((g) => ({
      id: g.id,
      name: g.name,
      linkedLeagueName: guildLeagueMap.get(g.id) || null,
    }));

    res.json(result);
  };

  private getChannels = async (req: Request, res: Response): Promise<void> => {
    if (this.discordService.getStatus() !== 'connected') {
      res.status(503).json({ message: 'Discord bot is not available' });
      return;
    }

    const channels = this.discordService.getGuildChannels(req.params.guildId);
    if (channels === null) {
      res.status(404).json({ message: 'Guild not found' });
      return;
    }

    const result = channels.map((ch) => ({
      id: ch.id,
      name: ch.name,
    }));

    res.json(result);
  };
}
