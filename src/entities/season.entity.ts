import { Column, Entity, JoinColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import { League } from './league.entity';
import { SeasonPokemon } from './season-pokemon.entity';
import { Week } from './week.entity';
import { Team } from './team.entity';
import { BaseApplicationEntity } from './base-application.entity';
import { Generation } from './generation.entity';

export enum SeasonStatus {
  PRE_DRAFT = 'PRE_DRAFT',
  DRAFT = 'DRAFT',
  PRE_SEASON = 'PRE_SEASON',
  REGULAR_SEASON = 'REGULAR_SEASON',
  POST_SEASON = 'POST_SEASON',
  PLAYOFFS = 'PLAYOFFS',
}

@Entity('season')
@Unique(['name', 'leagueId'])
export class Season extends BaseApplicationEntity {
  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: SeasonStatus,
    default: SeasonStatus.PRE_DRAFT,
  })
  status: SeasonStatus;

  @Column({ nullable: true })
  rules: string;

  @Column()
  pointLimit: number;

  @Column()
  maxPointValue: number;

  @Column()
  leagueId: number;

  @Column()
  generationId: number;

  @ManyToOne(() => League, (league) => league.seasons, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'league_id' })
  league: League;

  @ManyToOne(() => Generation, (generation) => generation.seasons, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'generation_id' })
  generation: Generation;

  @OneToMany(() => Team, (team) => team.season)
  teams: Team[];

  @OneToMany(() => Week, (week) => week.season)
  weeks: Week[];

  @OneToMany(() => SeasonPokemon, (seasonPokemon) => seasonPokemon.season)
  seasonPokemon: SeasonPokemon[];
}
