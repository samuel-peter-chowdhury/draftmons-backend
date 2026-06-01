/**
 * Converts a string to a Showdown ID: lowercase, with all non-alphanumeric
 * characters stripped. Null-safe — returns '' for null/undefined/empty.
 *
 * This is the canonical normalization applied to BOTH sides of every username
 * and Pokémon name comparison in the analysis pipeline.
 */
export function toID(text: string): string {
  return (text || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}
