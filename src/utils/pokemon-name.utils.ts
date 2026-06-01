/**
 * Strips the cosmetic Tera suffix from a Pokémon name, leaving all other
 * forme-distinguishing suffixes intact.
 *
 * Algorithm:
 * 1. Strip Tera suffix: replace(/-Tera-[A-Za-z]+$/i, '')
 *    - Tera formes are cosmetic (e.g. "Charizard-Tera-Fire" → "Charizard")
 *    - They are NOT draft-distinct — both players may use the same base Pokémon
 *      with different Tera types; draft pools track the base forme only.
 * 2. All other suffixes are kept intact:
 *    - "Urshifu-Rapid-Strike" and "Urshifu-Single-Strike" → stay distinct
 *    - "Wormadam-Trash" and "Wormadam-Sandy" → stay distinct
 *    - "Landorus-Therian" → preserved
 *
 * The returned string should be passed through toID() for the actual
 * draft-pool comparison — this utility only handles suffix normalization.
 *
 * Null-safe: returns '' for null/undefined/empty input.
 */
export function normalizePokemonName(rawName: string): string {
  if (!rawName) {
    return '';
  }
  // Strip cosmetic Tera suffix only (e.g. -Tera-Fire, -Tera-Water, -tera-dragon)
  return rawName.replace(/-Tera-[A-Za-z]+$/i, '');
}
