import { SeasonStatus } from '../entities/season.entity';

export const mockUsers = [
  { firstName: 'Red', lastName: 'Trainer', email: 'red@pokemon.com', showdownUsername: 'TrainerRed', discordUsername: 'red_trainer', timezone: 'America/New_York' },
  { firstName: 'Blue', lastName: 'Oak', email: 'blue@pokemon.com', showdownUsername: 'TrainerBlue', discordUsername: 'blue_oak', timezone: 'America/New_York' },
  { firstName: 'Ash', lastName: 'Ketchum', email: 'ash@pokemon.com', showdownUsername: 'AshKetchum', discordUsername: 'ash_ketchum', timezone: 'America/Chicago' },
  { firstName: 'Misty', lastName: 'Waterflower', email: 'misty@pokemon.com', showdownUsername: 'MistyWater', discordUsername: 'misty_water', timezone: 'America/Chicago' },
  { firstName: 'Brock', lastName: 'Harrison', email: 'brock@pokemon.com', showdownUsername: 'BrockRock', discordUsername: 'brock_rock', timezone: 'America/Denver' },
  { firstName: 'Gary', lastName: 'Oak', email: 'gary@pokemon.com', showdownUsername: 'GaryOak', discordUsername: 'gary_oak', timezone: 'America/Denver' },
  { firstName: 'Cynthia', lastName: 'Shirona', email: 'cynthia@pokemon.com', showdownUsername: 'ChampCynthia', discordUsername: 'cynthia_champ', timezone: 'America/Los_Angeles' },
  { firstName: 'Steven', lastName: 'Stone', email: 'steven@pokemon.com', showdownUsername: 'StevenStone', discordUsername: 'steven_stone', timezone: 'America/Los_Angeles' },
];

export const mockLeagues = [
  { name: 'Indigo Plateau League', abbreviation: 'IPL' },
  { name: 'Johto Champions League', abbreviation: 'JCL' },
];

export interface MockLeagueAssignment {
  leagueIndex: number;
  userIndices: number[];
  moderatorIndex: number;
}

export const mockLeagueAssignments: MockLeagueAssignment[] = [
  { leagueIndex: 0, userIndices: [0, 1, 2, 3], moderatorIndex: 0 },
  { leagueIndex: 1, userIndices: [4, 5, 6, 7], moderatorIndex: 4 },
];

export interface MockSeasonConfig {
  name: string;
  leagueIndex: number;
  generationId: number;
  status: SeasonStatus;
  pointLimit: number;
  maxPointValue: number;
  rules: string | null;
  userIndices: number[];
  teamNames: string[];
  weekNames: string[];
}

export const mockSeasons: MockSeasonConfig[] = [
  {
    name: 'Season 1',
    leagueIndex: 0,
    generationId: 9,
    status: SeasonStatus.PLAYOFFS,
    pointLimit: 100,
    maxPointValue: 12,
    rules: 'Standard Gen 9 OU rules. Sleep clause, evasion clause, species clause.',
    userIndices: [0, 1, 2, 3],
    teamNames: ['Kanto Crushers', 'Cerulean Surfers', 'Pallet Pioneers', 'Pewter Punishers'],
    weekNames: ['Week 1', 'Week 2', 'Week 3'],
  },
  {
    name: 'Season 1',
    leagueIndex: 1,
    generationId: 10,
    status: SeasonStatus.REGULAR_SEASON,
    pointLimit: 100,
    maxPointValue: 12,
    rules: 'National Dex OU rules. Sleep clause, evasion clause, species clause.',
    userIndices: [4, 5, 6, 7],
    teamNames: ['Saffron Strikers', 'Viridian Victors', 'Lavender Legends', 'Cinnabar Flames'],
    weekNames: ['Week 1', 'Week 2'],
  },
  {
    name: 'Season 2',
    leagueIndex: 0,
    generationId: 9,
    status: SeasonStatus.PRE_DRAFT,
    pointLimit: 100,
    maxPointValue: 12,
    rules: null,
    userIndices: [],
    teamNames: [],
    weekNames: [],
  },
];

// Round-robin schedule for 4 teams (indices within the season's team array)
export const roundRobinSchedule: [number, number][][] = [
  [[0, 1], [2, 3]],
  [[0, 2], [1, 3]],
  [[0, 3], [1, 2]],
];

export const SEASON_POKEMON_POOL_SIZE = 60;
export const TEAM_ROSTER_SIZE = 10;
