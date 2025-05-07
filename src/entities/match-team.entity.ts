import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Match } from "./match.entity";
import { Team } from "./team.entity";
import { BaseApplicationEntity } from "./base-application-entity.entity";

export enum MatchTeamStatus {
  WINNER = "WINNER",
  LOSER = "LOSER",
}

@Entity('match_team')
export class MatchTeam extends BaseApplicationEntity {
  @Column({ primary: true })
  matchId: number;

  @Column({ primary: true })
  teamId: number;

  @Column({
    type: "enum",
    enum: MatchTeamStatus,
    nullable: true,
    default: null,
  })
  status: MatchTeamStatus;

  @ManyToOne(() => Match, match => match.matchTeams)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @ManyToOne(() => Team, team => team.matchTeams)
  @JoinColumn({ name: 'team_id' })
  team: Team;
}