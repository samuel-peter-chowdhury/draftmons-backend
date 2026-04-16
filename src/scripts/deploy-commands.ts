import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';

const commands = [
  new SlashCommandBuilder().setName('league').setDescription('League commands'),
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
