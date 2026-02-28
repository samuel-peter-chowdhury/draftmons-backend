import { Column, Entity, JoinColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import { BaseApplicationEntity } from './base-application.entity';
import { User } from './user.entity';
import { Season } from './season.entity';
import { Generation } from './generation.entity';
import { TeamBuildSet } from './team-build-set.entity';

@Entity('team_build')
@Unique(['name', 'userId'])
export class TeamBuild extends BaseApplicationEntity {
  @Column()
  name: string;

  @Column()
  userId: number;

  @Column({ nullable: true })
  seasonId: number;

  @Column()
  generationId: number;

  @ManyToOne(() => User, (user) => user.teamBuilds, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Season, (season) => season.teamBuilds, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'season_id' })
  season: Season;

  @ManyToOne(() => Generation, (generation) => generation.teamBuilds, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'generation_id' })
  generation: Generation;

  @OneToMany(() => TeamBuildSet, (teamBuildSet) => teamBuildSet.teamBuild)
  teamBuildSets: TeamBuildSet[];
}
