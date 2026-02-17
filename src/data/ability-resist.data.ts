/**
 * Ability-based type effectiveness modifiers: abilityName → typeName → multiplier.
 * These are multiplied into the type-based effectiveness calculation.
 * All keys are lowercase for case-insensitive matching.
 */
export const abilityResistData: Record<string, Record<string, number>> = {
  'volt absorb': { 'electric': 0 },
  'dry skin': { 'water': 0 },
  'earth eater': { 'ground': 0 },
  'flash fire': { 'fire': 0 },
  'fluffy': { 'fire': 2 },
  'heatproof': { 'fire': 0.5 },
  'levitate': { 'ground': 0 },
  'lightning rod': { 'electric': 0 },
  'motor drive': { 'electric': 0 },
  'purifying salt': { 'ghost': 0.5 },
  'sap sipper': { 'grass': 0 },
  'storm drain': { 'water': 0 },
  'thick fat': { 'fire': 0.5, 'ice': 0.5 },
  'water absorb': { 'water': 0 },
  'water bubble': { 'fire': 0.5 },
  'well-baked body': { 'fire': 0 },
};
