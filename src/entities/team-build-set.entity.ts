import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseApplicationEntity } from './base-application.entity';
import { TeamBuild } from './team-build.entity';
import { Pokemon } from './pokemon.entity';
import { Item } from './item.entity';
import { Ability } from './ability.entity';
import { Move } from './move.entity';
import { Nature } from './nature.entity';

@Entity('team_build_set')
@Unique(['teamBuildId', 'pokemonId'])
export class TeamBuildSet extends BaseApplicationEntity {
  @Column()
  teamBuildId: number;

  @Column()
  pokemonId: number;

  @Column({ nullable: true })
  pointValue: number;

  @Column({ nullable: true })
  condition: string;

  @Column({ nullable: true })
  itemId: number;

  @Column({ nullable: true })
  abilityId: number;

  @Column({ nullable: true })
  move1Id: number;

  @Column({ nullable: true })
  move2Id: number;

  @Column({ nullable: true })
  move3Id: number;

  @Column({ nullable: true })
  move4Id: number;

  @Column({ default: 0 })
  hpEv: number;

  @Column({ default: 0 })
  attackEv: number;

  @Column({ default: 0 })
  defenseEv: number;

  @Column({ default: 0 })
  specialAttackEv: number;

  @Column({ default: 0 })
  specialDefenseEv: number;

  @Column({ default: 0 })
  speedEv: number;

  @Column({ default: 31 })
  hpIv: number;

  @Column({ default: 31 })
  attackIv: number;

  @Column({ default: 31 })
  defenseIv: number;

  @Column({ default: 31 })
  specialAttackIv: number;

  @Column({ default: 31 })
  specialDefenseIv: number;

  @Column({ default: 31 })
  speedIv: number;

  @Column({ nullable: true })
  natureId: number;

  @ManyToOne(() => TeamBuild, (teamBuild) => teamBuild.teamBuildSets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'team_build_id' })
  teamBuild: TeamBuild;

  @ManyToOne(() => Pokemon, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'pokemon_id' })
  pokemon: Pokemon;

  @ManyToOne(() => Item, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @ManyToOne(() => Ability, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'ability_id' })
  ability: Ability;

  @ManyToOne(() => Move, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'move_1_id' })
  move1: Move;

  @ManyToOne(() => Move, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'move_2_id' })
  move2: Move;

  @ManyToOne(() => Move, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'move_3_id' })
  move3: Move;

  @ManyToOne(() => Move, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'move_4_id' })
  move4: Move;

  @ManyToOne(() => Nature, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'nature_id' })
  nature: Nature;
}
