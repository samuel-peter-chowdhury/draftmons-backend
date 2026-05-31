export type KillType = "D" | "P" | "N";

export interface Rules {
  recoil: KillType;
  suicide: KillType;
  abilityitem: KillType;
  selfteam: KillType;
  db: KillType;
  forfeit: KillType;
}

export const DEFAULT_RULES: Rules = {
  recoil: "D",
  suicide: "D",
  abilityitem: "P",
  selfteam: "N",
  db: "P",
  forfeit: "N",
};

export interface PlayerStats {
  ps: string;
  kills: { [pokemonName: string]: { direct: number; passive: number } };
  deaths: { [pokemonName: string]: number };
}

export interface BattleInfo {
  replay: string;
  history: string;
  turns: number;
  winner: string;
  loser: string;
  rules: Rules;
  result: string;
  battleId: string;
}

export interface ReplayAnalysis {
  players: { [playerName: string]: PlayerStats };
  playerNames: string[];
  info: BattleInfo;
  error?: string;
}
