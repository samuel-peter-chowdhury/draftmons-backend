import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Pokemon } from "./pokemon.entity";
import { Ability } from "./ability.entity";

@Entity('pokemon_ability')
export class PokemonAbility {
  @PrimaryColumn({ name: 'pokemon_id' })
  pokemonId: number;

  @PrimaryColumn({ name: 'ability_id' })
  abilityId: number;

  @ManyToOne(() => Pokemon, pokemon => pokemon.abilities)
  @JoinColumn({ name: 'pokemon_id' })
  pokemon: Pokemon;

  @ManyToOne(() => Ability, ability => ability.pokemonAbilities)
  @JoinColumn({ name: 'ability_id' })
  ability: Ability;
}