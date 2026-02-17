/**
 * Type effectiveness chart: attackingType → defendingType → multiplier.
 * All keys are lowercase for case-insensitive matching.
 */
export const typeEffectiveData: Record<string, Record<string, number>> = {
  'bug': {
    'bug': 1, 'dark': 2, 'dragon': 1, 'electric': 1, 'fairy': 0.5,
    'fighting': 0.5, 'fire': 0.5, 'flying': 0.5, 'ghost': 0.5, 'grass': 2,
    'ground': 1, 'ice': 1, 'normal': 1, 'poison': 0.5, 'psychic': 2,
    'rock': 1, 'steel': 0.5, 'water': 1,
  },
  'dark': {
    'bug': 1, 'dark': 0.5, 'dragon': 1, 'electric': 1, 'fairy': 0.5,
    'fighting': 0.5, 'fire': 1, 'flying': 1, 'ghost': 2, 'grass': 1,
    'ground': 1, 'ice': 1, 'normal': 1, 'poison': 1, 'psychic': 2,
    'rock': 1, 'steel': 1, 'water': 1,
  },
  'dragon': {
    'bug': 1, 'dark': 1, 'dragon': 2, 'electric': 1, 'fairy': 0,
    'fighting': 1, 'fire': 1, 'flying': 1, 'ghost': 1, 'grass': 1,
    'ground': 1, 'ice': 1, 'normal': 1, 'poison': 1, 'psychic': 1,
    'rock': 1, 'steel': 0.5, 'water': 1,
  },
  'electric': {
    'bug': 1, 'dark': 1, 'dragon': 0.5, 'electric': 0.5, 'fairy': 1,
    'fighting': 1, 'fire': 1, 'flying': 2, 'ghost': 1, 'grass': 0.5,
    'ground': 0, 'ice': 1, 'normal': 1, 'poison': 1, 'psychic': 1,
    'rock': 1, 'steel': 1, 'water': 2,
  },
  'fairy': {
    'bug': 1, 'dark': 2, 'dragon': 2, 'electric': 1, 'fairy': 1,
    'fighting': 2, 'fire': 0.5, 'flying': 1, 'ghost': 1, 'grass': 1,
    'ground': 1, 'ice': 1, 'normal': 1, 'poison': 0.5, 'psychic': 1,
    'rock': 1, 'steel': 0.5, 'water': 1,
  },
  'fighting': {
    'bug': 0.5, 'dark': 2, 'dragon': 1, 'electric': 1, 'fairy': 0.5,
    'fighting': 1, 'fire': 1, 'flying': 0.5, 'ghost': 0, 'grass': 1,
    'ground': 1, 'ice': 2, 'normal': 2, 'poison': 0.5, 'psychic': 0.5,
    'rock': 2, 'steel': 2, 'water': 1,
  },
  'fire': {
    'bug': 2, 'dark': 1, 'dragon': 0.5, 'electric': 1, 'fairy': 1,
    'fighting': 1, 'fire': 0.5, 'flying': 1, 'ghost': 1, 'grass': 2,
    'ground': 1, 'ice': 2, 'normal': 1, 'poison': 1, 'psychic': 1,
    'rock': 0.5, 'steel': 2, 'water': 0.5,
  },
  'flying': {
    'bug': 2, 'dark': 1, 'dragon': 1, 'electric': 0.5, 'fairy': 1,
    'fighting': 2, 'fire': 1, 'flying': 1, 'ghost': 1, 'grass': 2,
    'ground': 1, 'ice': 1, 'normal': 1, 'poison': 1, 'psychic': 1,
    'rock': 0.5, 'steel': 0.5, 'water': 1,
  },
  'ghost': {
    'bug': 1, 'dark': 0.5, 'dragon': 1, 'electric': 1, 'fairy': 1,
    'fighting': 1, 'fire': 1, 'flying': 1, 'ghost': 2, 'grass': 1,
    'ground': 1, 'ice': 1, 'normal': 0, 'poison': 1, 'psychic': 2,
    'rock': 1, 'steel': 1, 'water': 1,
  },
  'grass': {
    'bug': 0.5, 'dark': 1, 'dragon': 0.5, 'electric': 1, 'fairy': 1,
    'fighting': 1, 'fire': 0.5, 'flying': 0.5, 'ghost': 1, 'grass': 0.5,
    'ground': 2, 'ice': 1, 'normal': 1, 'poison': 0.5, 'psychic': 1,
    'rock': 2, 'steel': 0.5, 'water': 2,
  },
  'ground': {
    'bug': 0.5, 'dark': 1, 'dragon': 1, 'electric': 2, 'fairy': 1,
    'fighting': 1, 'fire': 2, 'flying': 0, 'ghost': 1, 'grass': 0.5,
    'ground': 1, 'ice': 1, 'normal': 1, 'poison': 2, 'psychic': 1,
    'rock': 2, 'steel': 2, 'water': 1,
  },
  'ice': {
    'bug': 1, 'dark': 1, 'dragon': 2, 'electric': 1, 'fairy': 1,
    'fighting': 1, 'fire': 0.5, 'flying': 2, 'ghost': 1, 'grass': 2,
    'ground': 2, 'ice': 0.5, 'normal': 1, 'poison': 1, 'psychic': 1,
    'rock': 1, 'steel': 0.5, 'water': 0.5,
  },
  'normal': {
    'bug': 1, 'dark': 1, 'dragon': 1, 'electric': 1, 'fairy': 1,
    'fighting': 1, 'fire': 1, 'flying': 1, 'ghost': 0, 'grass': 1,
    'ground': 1, 'ice': 1, 'normal': 1, 'poison': 1, 'psychic': 1,
    'rock': 0.5, 'steel': 0.5, 'water': 1,
  },
  'poison': {
    'bug': 1, 'dark': 1, 'dragon': 1, 'electric': 1, 'fairy': 2,
    'fighting': 1, 'fire': 1, 'flying': 1, 'ghost': 0.5, 'grass': 2,
    'ground': 0.5, 'ice': 1, 'normal': 1, 'poison': 0.5, 'psychic': 1,
    'rock': 0.5, 'steel': 0, 'water': 1,
  },
  'psychic': {
    'bug': 1, 'dark': 0, 'dragon': 1, 'electric': 1, 'fairy': 1,
    'fighting': 2, 'fire': 1, 'flying': 1, 'ghost': 1, 'grass': 1,
    'ground': 1, 'ice': 1, 'normal': 1, 'poison': 2, 'psychic': 0.5,
    'rock': 1, 'steel': 0.5, 'water': 1,
  },
  'rock': {
    'bug': 2, 'dark': 1, 'dragon': 1, 'electric': 1, 'fairy': 1,
    'fighting': 0.5, 'fire': 2, 'flying': 2, 'ghost': 1, 'grass': 1,
    'ground': 0.5, 'ice': 2, 'normal': 1, 'poison': 1, 'psychic': 1,
    'rock': 1, 'steel': 0.5, 'water': 1,
  },
  'steel': {
    'bug': 1, 'dark': 1, 'dragon': 1, 'electric': 0.5, 'fairy': 2,
    'fighting': 1, 'fire': 0.5, 'flying': 1, 'ghost': 1, 'grass': 1,
    'ground': 1, 'ice': 2, 'normal': 1, 'poison': 1, 'psychic': 1,
    'rock': 2, 'steel': 0.5, 'water': 0.5,
  },
  'water': {
    'bug': 1, 'dark': 1, 'dragon': 0.5, 'electric': 1, 'fairy': 1,
    'fighting': 1, 'fire': 2, 'flying': 1, 'ghost': 1, 'grass': 0.5,
    'ground': 2, 'ice': 1, 'normal': 1, 'poison': 1, 'psychic': 1,
    'rock': 2, 'steel': 1, 'water': 0.5,
  },
};
