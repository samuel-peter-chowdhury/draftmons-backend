import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Match } from "./match.entity";
import { Team } from "./team.entity";

@Entity('match_team')
export class MatchTeam {
  @Column({ primary: true, name: 'match_id' })
  matchId: number;

  @Column({ primary: true, name: 'team_id' })
  teamId: number;

  @Column()
  status: string;

  @ManyToOne(() => Match, match => match.matchTeams)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @ManyToOne(() => Team, team => team.matchTeams)
  @JoinColumn({ name: 'team_id' })
  team: Team;
}