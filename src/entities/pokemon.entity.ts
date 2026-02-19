import { Entity, Column, OneToMany, ManyToMany, ManyToOne, JoinTable, JoinColumn, Unique } from 'typeorm';
import { BaseApplicationEntity } from './base-application.entity';
import { Move } from './move.entity';
import { TypeEffective } from './type-effective.entity';
import { SeasonPokemon } from './season-pokemon.entity';
import { PokemonType } from './pokemon-type.entity';
import { Ability } from './ability.entity';
import { Generation } from './generation.entity';

@Entity('pokemon')
@Unique(['name', 'generationId'])
export class Pokemon extends BaseApplicationEntity {
  @Column()
  dexId: number;

  @Column()
  name: string;

  @Column()
  hp: number;

  @Column()
  attack: number;

  @Column()
  defense: number;

  @Column()
  specialAttack: number;

  @Column()
  specialDefense: number;

  @Column()
  speed: number;

  @Column()
  baseStatTotal: number;

  @Column({ type: 'double precision' })
  height: number;

  @Column({ type: 'double precision' })
  weight: number;

  @Column()
  sprite: string;

  @Column()
  generationId: number;

  @ManyToOne(() => Generation, (generation) => generation.pokemon, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'generation_id' })
  generation: Generation;

  @ManyToMany(() => PokemonType, (pokemonType) => pokemonType.pokemon)
  @JoinTable({
    name: 'pokemon_pokemon_types',
    joinColumn: {
      name: 'pokemon_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'pokemon_type_id',
      referencedColumnName: 'id',
    },
  })
  pokemonTypes: PokemonType[];

  @ManyToMany(() => Move, (move) => move.pokemon)
  @JoinTable({
    name: 'pokemon_moves',
    joinColumn: {
      name: 'pokemon_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'move_id',
      referencedColumnName: 'id',
    },
  })
  moves: Move[];

  @ManyToMany(() => Ability, (ability) => ability.pokemon)
  @JoinTable({
    name: 'pokemon_abilities',
    joinColumn: {
      name: 'pokemon_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'ability_id',
      referencedColumnName: 'id',
    },
  })
  abilities: Ability[];

  @OneToMany(() => TypeEffective, (typeEffective) => typeEffective.pokemon)
  typeEffectiveness: TypeEffective[];

  @OneToMany(() => SeasonPokemon, (seasonPokemon) => seasonPokemon.pokemon)
  seasonPokemon: SeasonPokemon[];
}
