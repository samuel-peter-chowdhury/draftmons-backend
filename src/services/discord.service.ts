import {
  Client,
  GatewayIntentBits,
  Events,
  ActivityType,
  EmbedBuilder,
  ChannelType,
  TextChannel,
  REST,
  Routes,
  SlashCommandBuilder,
  Guild,
} from 'discord.js';
import { Repository, Not, IsNull } from 'typeorm';
import { Service, Inject } from 'typedi';
import { League } from '../entities/league.entity';
import { Match } from '../entities/match.entity';
import { SeasonPokemonTeam } from '../entities/season-pokemon-team.entity';

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

    if (!process.env.DISCORD_CLIENT_ID) {
      console.warn('Discord bot: DISCORD_CLIENT_ID not set — slash command registration will be skipped');
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
    // Fetch full guild data — cache may not be populated when guildCreate fires
    const fetched = await guild.fetch();
    const systemChannel = fetched.systemChannel;

    if (systemChannel && systemChannel.isTextBased()) {
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

  async sendMatchNotification(match: Match): Promise<void> {
    if (this.status !== 'connected' || !this.client) {
      console.debug('[discord] bot not connected, skipping match notification');
      return;
    }
    const league = match.week?.season?.league;
    if (!league?.discordChannelId) {
      console.debug(
        `[discord] League ${league?.id ?? 'unknown'} has no channel configured, skipping notification`,
      );
      return;
    }
    const embed = this.buildMatchEmbed(match);
    await this.sendToChannelWithRetry(league.discordChannelId, embed, 'match ' + match.id);
  }

  async sendDraftPickNotification(seasonPokemonTeam: SeasonPokemonTeam): Promise<void> {
    if (this.status !== 'connected' || !this.client) {
      console.debug('[discord] bot not connected, skipping draft pick notification');
      return;
    }
    const league = seasonPokemonTeam.seasonPokemon?.season?.league;
    if (!league?.discordChannelId) {
      console.debug(
        `[discord] League ${league?.id ?? 'unknown'} has no channel configured, skipping notification`,
      );
      return;
    }
    const embed = this.buildDraftPickEmbed(seasonPokemonTeam);
    await this.sendToChannelWithRetry(league.discordChannelId, embed, 'draft pick ' + seasonPokemonTeam.id);
  }

  private buildMatchEmbed(match: Match): EmbedBuilder {
    const season = match.week?.season;
    const winner = match.winningTeam;
    const loser = match.losingTeam;
    const winnerCoach = winner?.user;
    const loserCoach = loser?.user;
    const winnerMention = winnerCoach?.discordId
      ? '<@' + winnerCoach.discordId + '>'
      : (winnerCoach?.firstName ?? 'Unknown');
    const loserMention = loserCoach?.discordId
      ? '<@' + loserCoach.discordId + '>'
      : (loserCoach?.firstName ?? 'Unknown');
    const games = match.games ?? [];
    const gamesWon = games.filter((g) => g.winningTeamId === winner?.id).length;
    const gamesLost = games.filter((g) => g.winningTeamId === loser?.id).length;
    const scoreStr = games.length > 0 ? `${gamesWon} - ${gamesLost}` : '-';
    const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:3333';
    const url = `${clientUrl}/league/${season?.league?.id}/match/${match.id}`;

    return new EmbedBuilder()
      .setTitle('Match Result')
      .setColor(0x57f287)
      .setURL(url)
      .addFields(
        { name: 'Winner', value: `${winner?.name ?? 'TBD'} (${winnerMention})`, inline: true },
        { name: 'Loser', value: `${loser?.name ?? 'TBD'} (${loserMention})`, inline: true },
        { name: 'Score', value: scoreStr, inline: true },
        { name: 'Week', value: match.week?.name ?? 'Unknown', inline: true },
        { name: 'Season', value: season?.name ?? 'Unknown', inline: true },
      )
      .setTimestamp();
  }

  private buildDraftPickEmbed(spt: SeasonPokemonTeam): EmbedBuilder {
    const pokemon = spt.seasonPokemon?.pokemon;
    const season = spt.seasonPokemon?.season;
    const league = season?.league;
    const team = spt.team;
    const coach = team?.user;
    const coachMention = coach?.discordId
      ? '<@' + coach.discordId + '>'
      : (coach?.firstName ?? 'Unknown');
    const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:3333';
    const url = `${clientUrl}/league/${league?.id}/team/${team?.id}`;

    return new EmbedBuilder()
      .setTitle(`${pokemon?.name ?? 'Pokemon'} was drafted!`)
      .setColor(0x5865f2)
      .setURL(url)
      .addFields(
        { name: 'Team', value: team?.name ?? 'Unknown', inline: true },
        { name: 'Coach', value: coachMention, inline: true },
        { name: 'Season', value: season?.name ?? 'Unknown', inline: true },
      )
      .setTimestamp();
  }

  private async sendToChannelWithRetry(
    channelId: string,
    embed: EmbedBuilder,
    context: string,
  ): Promise<void> {
    const trySend = async (): Promise<void> => {
      const channel = await this.client!.channels.fetch(channelId);
      if (!channel || !channel.isTextBased()) {
        throw new Error(`Channel ${channelId} is not a valid text channel`);
      }
      await (channel as TextChannel).send({ embeds: [embed] });
    };

    try {
      await trySend();
    } catch (firstErr) {
      console.warn(`[discord] First send attempt failed for ${context}, retrying in 2s`, firstErr);
      await new Promise((res) => setTimeout(res, 2000));
      try {
        await trySend();
      } catch (secondErr) {
        console.error(`[discord] Notification failed after retry for ${context}`, {
          channelId,
          context,
          error: secondErr,
        });
      }
    }
  }
}
