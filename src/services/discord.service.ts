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
  SlashCommandSubcommandsOnlyBuilder,
  Guild,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  MessageFlags,
} from 'discord.js';
import { Repository, Not, IsNull } from 'typeorm';
import { Service, Inject } from 'typedi';
import { League } from '../entities/league.entity';
import { Match } from '../entities/match.entity';
import { Season } from '../entities/season.entity';
import { SeasonPokemonTeam } from '../entities/season-pokemon-team.entity';
import { Team } from '../entities/team.entity';
import { Week } from '../entities/week.entity';

export type DiscordBotStatus = 'connected' | 'disconnected' | 'disabled';

// Full subcommand tree — keep in sync with deploy-commands.ts
function buildLeagueCommand(): SlashCommandSubcommandsOnlyBuilder {
  return new SlashCommandBuilder()
    .setName('league')
    .setDescription('League commands')
    .addSubcommand((sub) => sub.setName('info').setDescription('Show league information'))
    .addSubcommand((sub) =>
      sub
        .setName('standings')
        .setDescription('Show league standings')
        .addStringOption((opt) =>
          opt.setName('season').setDescription('Season name').setAutocomplete(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('roster')
        .setDescription("Show a team's roster")
        .addStringOption((opt) =>
          opt.setName('team').setDescription('Team name').setRequired(true).setAutocomplete(true),
        )
        .addStringOption((opt) =>
          opt.setName('season').setDescription('Season name').setAutocomplete(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('schedule')
        .setDescription('Show weekly schedule')
        .addStringOption((opt) =>
          opt.setName('season').setDescription('Season name').setAutocomplete(true),
        )
        .addStringOption((opt) =>
          opt.setName('week').setDescription('Week name').setAutocomplete(true),
        ),
    );
}

@Service()
export class DiscordService {
  private client: Client | null = null;
  private status: DiscordBotStatus = 'disabled';

  constructor(
    @Inject('LeagueRepository') private leagueRepository: Repository<League>,
    @Inject('SeasonRepository') private seasonRepository: Repository<Season>,
    @Inject('TeamRepository') private teamRepository: Repository<Team>,
    @Inject('MatchRepository') private matchRepository: Repository<Match>,
    @Inject('WeekRepository') private weekRepository: Repository<Week>,
    @Inject('SeasonPokemonTeamRepository')
    private seasonPokemonTeamRepository: Repository<SeasonPokemonTeam>,
  ) {}

  async initialize(): Promise<void> {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) {
      console.info('Discord bot: disabled (DISCORD_BOT_TOKEN not set)');
      this.status = 'disabled';
      return;
    }

    if (!process.env.DISCORD_CLIENT_ID) {
      console.warn(
        'Discord bot: DISCORD_CLIENT_ID not set — slash command registration will be skipped',
      );
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

    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (interaction.isChatInputCommand()) {
        await this.handleSlashCommand(interaction).catch((err: unknown) => {
          console.error('[discord] slash command handler error', err);
        });
      } else if (interaction.isAutocomplete()) {
        await this.handleAutocomplete(interaction).catch((err: unknown) => {
          console.error('[discord] autocomplete handler error', err);
        });
      }
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

    const commands = [buildLeagueCommand()].map((cmd) => cmd.toJSON());

    const rest = new REST().setToken(token);

    try {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      console.info(`Discord bot: registered ${commands.length} command(s) for guild ${guildId}`);
    } catch (error) {
      console.error('Discord bot: failed to register guild commands', guildId, error);
    }
  }

  // ---------------------------------------------------------------------------
  // Guild lookup helper
  // ---------------------------------------------------------------------------

  private async findLeagueByGuildId(guildId: string): Promise<League | null> {
    return this.leagueRepository.findOne({ where: { discordGuildId: guildId } });
  }

  // ---------------------------------------------------------------------------
  // Slash command router
  // ---------------------------------------------------------------------------

  private async handleSlashCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.guildId) return;

    // Guild lookup happens BEFORE deferring so we can send a true ephemeral reply
    // for unlinked servers (CMD-03). The query is fast (indexed discordGuildId).
    const league = await this.findLeagueByGuildId(interaction.guildId).catch(() => null);
    if (!league) {
      await interaction.reply({
        content: 'This server is not linked to a Draftmons league. Link it at draftmons.com.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Defer before any further async/DB work (CMD-02: avoid Discord 3-second timeout)
    await interaction.deferReply();

    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case 'info':
        return this.handleInfo(interaction, league);
      case 'standings':
        return this.handleStandings(interaction, league);
      case 'roster':
        return this.handleRoster(interaction, league);
      case 'schedule':
        return this.handleSchedule(interaction, league);
      default:
        await interaction.editReply({ content: 'Unknown subcommand.' });
    }
  }

  // ---------------------------------------------------------------------------
  // /league info
  // ---------------------------------------------------------------------------

  private async handleInfo(interaction: ChatInputCommandInteraction, league: League): Promise<void> {
    const seasons = await this.seasonRepository.find({
      where: { leagueId: league.id },
      order: { createdAt: 'DESC' },
    });
    const currentSeason = seasons[0] ?? null;
    const teamCount = currentSeason
      ? await this.teamRepository.count({ where: { seasonId: currentSeason.id } })
      : 0;

    const embed = this.buildInfoEmbed(league, currentSeason, seasons.length, teamCount);
    await interaction.editReply({ embeds: [embed] });
  }

  private buildInfoEmbed(
    league: League,
    currentSeason: Season | null,
    totalSeasons: number,
    teamCount: number,
  ): EmbedBuilder {
    const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:3333';
    return new EmbedBuilder()
      .setTitle(league.name)
      .setColor(0x5865f2)
      .setURL(`${clientUrl}/league/${league.id}`)
      .addFields(
        { name: 'Current Season', value: currentSeason?.name ?? 'None', inline: true },
        { name: 'Teams', value: String(teamCount), inline: true },
        { name: 'Total Seasons', value: String(totalSeasons), inline: true },
      )
      .setFooter({ text: `${league.name} \u2022 Updated` })
      .setTimestamp();
  }

  // ---------------------------------------------------------------------------
  // /league standings
  // ---------------------------------------------------------------------------

  private async handleStandings(
    interaction: ChatInputCommandInteraction,
    league: League,
  ): Promise<void> {
    const seasonName = interaction.options.getString('season');

    let season: Season | null;
    if (seasonName) {
      season = await this.seasonRepository.findOne({
        where: { leagueId: league.id, name: seasonName },
      });
      if (!season) {
        await interaction.editReply({ content: `Season "${seasonName}" not found.` });
        return;
      }
    } else {
      season = await this.seasonRepository.findOne({
        where: { leagueId: league.id },
        order: { createdAt: 'DESC' },
      });
    }

    if (!season) {
      await interaction.editReply({
        content: 'No seasons found. Create one at draftmons.com.',
      });
      return;
    }

    // Load all teams in the season with user (coach) relation
    const teams = await this.teamRepository.find({
      where: { seasonId: season.id },
      relations: { user: true },
      order: { name: 'ASC' },
    });

    // Load all completed matches in the season (winningTeamId is set)
    const matches = await this.matchRepository.find({
      where: { week: { seasonId: season.id }, winningTeamId: Not(IsNull()) },
      relations: { week: true },
    });

    const embed = this.buildStandingsEmbed(league, season, teams, matches);
    await interaction.editReply({ embeds: [embed] });
  }

  private buildStandingsEmbed(
    league: League,
    season: Season,
    teams: Team[],
    matches: Match[],
  ): EmbedBuilder {
    const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:3333';

    // Compute wins and losses per team from match results
    const record = new Map<number, { wins: number; losses: number }>();
    for (const team of teams) {
      record.set(team.id, { wins: 0, losses: 0 });
    }
    for (const match of matches) {
      const winner = record.get(match.winningTeamId);
      const loser = record.get(match.losingTeamId);
      if (winner) winner.wins++;
      if (loser) loser.losses++;
    }

    // Sort teams: most wins first, then fewest losses, then alphabetical
    const standings = teams
      .map((team) => {
        const r = record.get(team.id) ?? { wins: 0, losses: 0 };
        return {
          teamName: team.name,
          coachName: team.user?.firstName ?? 'Unknown',
          wins: r.wins,
          losses: r.losses,
        };
      })
      .sort(
        (a, b) =>
          b.wins - a.wins ||
          a.losses - b.losses ||
          a.teamName.localeCompare(b.teamName),
      );

    const table = this.buildStandingsTable(standings);
    const noMatches = matches.length === 0;

    return new EmbedBuilder()
      .setTitle(`${season.name} Standings`)
      .setColor(0xfee75c)
      .setURL(`${clientUrl}/league/${league.id}`)
      .setDescription(table + (noMatches ? '\n*No matches recorded yet*' : ''))
      .setFooter({ text: `${league.name} \u2022 Updated` })
      .setTimestamp();
  }

  private buildStandingsTable(
    standings: Array<{ teamName: string; coachName: string; wins: number; losses: number }>,
  ): string {
    const header = `${'#'.padEnd(3)}${'Team'.padEnd(20)}${'Coach'.padEnd(15)}${'W'.padEnd(4)}${'L'.padEnd(4)}Diff`;
    const divider = '-'.repeat(header.length);
    const rows = standings.map((t, i) => {
      const rank = String(i + 1).padEnd(3);
      const team = t.teamName.slice(0, 19).padEnd(20);
      const coach = t.coachName.slice(0, 14).padEnd(15);
      const wins = String(t.wins).padEnd(4);
      const losses = String(t.losses).padEnd(4);
      const diff = t.wins - t.losses >= 0 ? `+${t.wins - t.losses}` : String(t.wins - t.losses);
      return `${rank}${team}${coach}${wins}${losses}${diff}`;
    });
    return `\`\`\`\n${header}\n${divider}\n${rows.join('\n')}\n\`\`\``;
  }

  // ---------------------------------------------------------------------------
  // /league roster (stub — Plan 02)
  // ---------------------------------------------------------------------------

  private async handleRoster(
    interaction: ChatInputCommandInteraction,
    _league: League,
  ): Promise<void> {
    await interaction.editReply({ content: 'Roster command coming soon.' });
  }

  // ---------------------------------------------------------------------------
  // /league schedule (stub — Plan 02)
  // ---------------------------------------------------------------------------

  private async handleSchedule(
    interaction: ChatInputCommandInteraction,
    _league: League,
  ): Promise<void> {
    await interaction.editReply({ content: 'Schedule command coming soon.' });
  }

  // ---------------------------------------------------------------------------
  // Autocomplete (stub — Plan 02)
  // ---------------------------------------------------------------------------

  private async handleAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
    await interaction.respond([]);
  }

  // ---------------------------------------------------------------------------
  // Notification senders (Phase 2)
  // ---------------------------------------------------------------------------

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
    await this.sendToChannelWithRetry(
      league.discordChannelId,
      embed,
      'draft pick ' + seasonPokemonTeam.id,
    );
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
