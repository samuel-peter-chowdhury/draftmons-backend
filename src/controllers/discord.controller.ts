import { Router, Request, Response } from 'express';
import { Container } from 'typedi';
import { Repository, Not, IsNull } from 'typeorm';
import { DiscordService } from '../services/discord.service';
import { asyncHandler } from '../utils/error.utils';
import { isAuthenticated } from '../middleware/auth.middleware';
import { League } from '../entities/league.entity';
import { APP_CONFIG } from '../config/app.config';

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
    this.router.get('/invite-url', isAuthenticated, asyncHandler(this.getInviteUrl));
    this.router.get('/guilds', isAuthenticated, asyncHandler(this.getGuilds));
    this.router.get('/guilds/:guildId/channels', isAuthenticated, asyncHandler(this.getChannels));
  }

  private getInviteUrl = async (_req: Request, res: Response): Promise<void> => {
    const clientId = APP_CONFIG.auth.discord.clientId;

    if (!clientId) {
      res.status(503).json({ message: 'Discord bot is not configured' });
      return;
    }

    // Permission flags: View Channels (1<<10) | Send Messages (1<<11) | Embed Links (1<<14) | Read Message History (1<<16)
    const permissions = (1 << 10) | (1 << 11) | (1 << 14) | (1 << 16); // 84992
    const url = `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=bot%20applications.commands&permissions=${permissions}`;

    res.json({ url });
  };

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
