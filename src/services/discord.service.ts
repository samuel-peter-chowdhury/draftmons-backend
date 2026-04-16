import {
  Client,
  GatewayIntentBits,
  Events,
  ActivityType,
  EmbedBuilder,
  ChannelType,
  REST,
  Routes,
  SlashCommandBuilder,
  Guild,
} from 'discord.js';
import { Repository, Not, IsNull } from 'typeorm';
import { Service, Inject } from 'typedi';
import { League } from '../entities/league.entity';

export type DiscordBotStatus = 'connected' | 'disconnected' | 'disabled';

@Service()
export class DiscordService {
  private client: Client | null = null;
  private status: DiscordBotStatus = 'disabled';

  constructor(
    @Inject('LeagueRepository')
    private leagueRepository: Repository<League>,
  ) {}

  async initialize(): Promise<void> {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) {
      console.info('Discord bot: disabled (DISCORD_BOT_TOKEN not set)');
      this.status = 'disabled';
      return;
    }

    // Only Guilds intent (non-privileged) -- MessageContent/GuildMembers are privileged
    this.client = new Client({ intents: [GatewayIntentBits.Guilds] });

    this.client.on(Events.ClientReady, async (readyClient) => {
      console.info(`Discord bot: connected as ${readyClient.user.tag}`);
      this.status = 'connected';
      await this.updatePresence();
    });

    this.client.on(Events.GuildCreate, async (guild) => {
      await this.handleGuildCreate(guild);
    });

    try {
      await this.client.login(token);
    } catch (error) {
      console.error('Discord bot: failed to connect', error);
      this.status = 'disconnected';
      // Do NOT re-throw -- the API must start regardless (BOT-04)
    }
  }

  async destroy(): Promise<void> {
    if (this.client) {
      await this.client.destroy();
      this.status = 'disabled';
    }
  }

  getStatus(): DiscordBotStatus {
    return this.status;
  }

  getGuilds() {
    if (this.status !== 'connected' || !this.client) {
      return null;
    }
    return this.client.guilds.cache;
  }

  getGuildChannels(guildId: string) {
    if (this.status !== 'connected' || !this.client) {
      return null;
    }
    const guild = this.client.guilds.cache.get(guildId);
    if (!guild) {
      return null;
    }
    return guild.channels.cache.filter((channel) => channel.type === ChannelType.GuildText);
  }

  async updatePresence(linkedLeagueCount?: number): Promise<void> {
    if (this.status !== 'connected' || !this.client || !this.client.user) {
      return;
    }

    let count = linkedLeagueCount;
    if (count === undefined) {
      try {
        count = await this.leagueRepository.count({
          where: { discordGuildId: Not(IsNull()) } as any,
        });
      } catch {
        // discordGuildId column may not exist yet (added in Plan 02)
        count = 0;
      }
    }

    this.client.user.setPresence({
      activities: [
        {
          name: `${count} league${count !== 1 ? 's' : ''}`,
          type: ActivityType.Watching,
        },
      ],
      status: 'online',
    });
  }

  private async handleGuildCreate(guild: Guild): Promise<void> {
    const systemChannel = guild.systemChannel;
    if (!systemChannel || !systemChannel.isTextBased()) {
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('Draftmons is here!')
      .setDescription(
        "Link this server to your league at draftmons.com to get started. Once linked, I'll post match results and draft picks here.",
      )
      .setColor(0x5865f2);

    try {
      await systemChannel.send({ embeds: [embed] });
    } catch (error) {
      console.warn('Discord bot: failed to send welcome message to guild', guild.id, error);
    }

    await this.registerGuildCommands(guild.id);
  }

  async registerGuildCommands(guildId: string): Promise<void> {
    const token = process.env.DISCORD_BOT_TOKEN;
    const clientId = process.env.DISCORD_CLIENT_ID;

    if (!token || !clientId) {
      console.warn(
        'Discord bot: cannot register guild commands - missing',
        !token ? 'DISCORD_BOT_TOKEN' : 'DISCORD_CLIENT_ID',
      );
      return;
    }

    const commands = [
      new SlashCommandBuilder().setName('league').setDescription('League commands'),
    ].map((cmd) => cmd.toJSON());

    const rest = new REST().setToken(token);

    try {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      console.info(`Discord bot: registered ${commands.length} command(s) for guild ${guildId}`);
    } catch (error) {
      console.error('Discord bot: failed to register guild commands', guildId, error);
    }
  }
}
