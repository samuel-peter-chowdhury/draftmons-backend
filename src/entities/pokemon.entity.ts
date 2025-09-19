import { Entity, Column, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { BaseApplicationEntity } from './base-application.entity';
import { PokemonMove } from './pokemon-move.entity';
import { TypeEffective } from './type-effective.entity';
import { SeasonPokemon } from './season-pokemon.entity';
import { PokemonType } from './pokemon-type.entity';
import { Ability } from './ability.entity';
import { Generation } from './generation.entity';

@Entity('pokemon')
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

  @Column()
  height: number;

  @Column()
  weight: number;

  @Column()
  sprite: string;

  @ManyToMany(() => PokemonType, pokemonType => pokemonType.pokemon)
  @JoinTable({
    name: 'pokemon_pokemon_types',
    joinColumn: {
      name: 'pokemon_id',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'pokemon_type_id',
      referencedColumnName: 'id'
    }
  })
  pokemonTypes: PokemonType[];

  @OneToMany(() => PokemonMove, pokemonMove => pokemonMove.pokemon)
  pokemonMoves: PokemonMove[];

  @ManyToMany(() => Ability, ability => ability.pokemon)
  @JoinTable({
    name: 'pokemon_abilities',
    joinColumn: {
      name: 'pokemon_id',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'ability_id',
      referencedColumnName: 'id'
    }
  })
  abilities: Ability[];

  @OneToMany(() => TypeEffective, typeEffective => typeEffective.pokemon)
  typeEffectiveness: TypeEffective[];

  @OneToMany(() => SeasonPokemon, seasonPokemon => seasonPokemon.pokemon)
  seasonPokemon: SeasonPokemon[];

  @ManyToMany(() => Generation, generation => generation.pokemon)
  @JoinTable({
    name: 'pokemon_generations',
    joinColumn: {
      name: 'pokemon_id',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'generation_id',
      referencedColumnName: 'id'
    }
  })
  generations: Generation[];
}