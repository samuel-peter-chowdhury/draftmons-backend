import { Entity, Column, OneToMany } from 'typeorm';
import { BaseApplicationEntity } from './base.entity';
import { PokemonType } from './pokemon-type.entity';
import { PokemonMove } from './pokemon-move.entity';
import { PokemonAbility } from './pokemon-ability.entity';
import { TypeEffective } from './type-effective.entity';
import { SeasonPokemon } from './season-pokemon.entity';

@Entity('pokemon')
export class Pokemon extends BaseApplicationEntity {
  @Column({ name: 'dex_id' })
  dexId: number;

  @Column()
  name: string;

  @Column()
  hp: number;

  @Column()
  attack: number;

  @Column()
  defense: number;

  @Column({ name: 'special_attack' })
  specialAttack: number;

  @Column({ name: 'special_defense' })
  specialDefense: number;

  @Column()
  speed: number;

  @Column({ name: 'base_stat_total' })
  baseStatTotal: number;

  @Column({ type: 'double precision' })
  height: number;

  @Column({ type: 'double precision' })
  weight: number;

  @OneToMany(() => PokemonType, pokemonType => pokemonType.pokemon)
  types: PokemonType[];

  @OneToMany(() => PokemonMove, pokemonMove => pokemonMove.pokemon)
  moves: PokemonMove[];

  @OneToMany(() => PokemonAbility, pokemonAbility => pokemonAbility.pokemon)
  abilities: PokemonAbility[];

  @OneToMany(() => TypeEffective, typeEffective => typeEffective.pokemon)
  typeEffectiveness: TypeEffective[];

  @OneToMany(() => SeasonPokemon, seasonPokemon => seasonPokemon.pokemon)
  seasonPokemon: SeasonPokemon[];
}
