import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';

// IMPORTANT: This command definition must stay in sync with
// registerGuildCommands() in discord.service.ts
const commands = [
  new SlashCommandBuilder()
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
    ),
].map((cmd) => cmd.toJSON());

const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

const missingVars = [
  !token && 'DISCORD_BOT_TOKEN',
  !clientId && 'DISCORD_CLIENT_ID',
  !guildId && 'DISCORD_GUILD_ID',
].filter(Boolean);

if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

const rest = new REST().setToken(token!);

(async () => {
  console.info(`Deploying ${commands.length} command(s) to guild ${guildId}...`);
  await rest.put(Routes.applicationGuildCommands(clientId!, guildId!), { body: commands });
  console.info(`Successfully deployed ${commands.length} command(s) to guild ${guildId}.`);
})().catch((error) => {
  console.error('Failed to deploy commands:', error);
  process.exit(1);
});
