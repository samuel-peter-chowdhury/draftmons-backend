import { normalizePokemonName } from './pokemon-name.utils';
import { toID } from './showdown-id.utils';

describe('normalizePokemonName', () => {
  // ---------------------------------------------------------------------------
  // Tera suffix stripping (cosmetic — not draft-distinct)
  // ---------------------------------------------------------------------------

  it('strips Tera suffix from base form', () => {
    const result = normalizePokemonName('Charizard-Tera-Fire');
    expect(toID(result)).toBe(toID('Charizard'));
  });

  it('strips Tera suffix from a different type', () => {
    const result = normalizePokemonName('Pikachu-Tera-Electric');
    expect(toID(result)).toBe(toID('Pikachu'));
  });

  it('strips Tera suffix (case-insensitive match)', () => {
    const result = normalizePokemonName('Garchomp-tera-Dragon');
    expect(toID(result)).toBe(toID('Garchomp'));
  });

  // ---------------------------------------------------------------------------
  // Forme-distinguishing suffixes preserved (draft-distinct)
  // ---------------------------------------------------------------------------

  it('preserves -Rapid-Strike forme suffix (Urshifu)', () => {
    const result = normalizePokemonName('Urshifu-Rapid-Strike');
    expect(toID(result)).toBe(toID('Urshifu-Rapid-Strike'));
  });

  it('preserves -Single-Strike forme suffix (Urshifu)', () => {
    const result = normalizePokemonName('Urshifu-Single-Strike');
    expect(toID(result)).toBe(toID('Urshifu-Single-Strike'));
  });

  it('keeps the two Urshifu formes DISTINCT from each other', () => {
    const rapidStrike = toID(normalizePokemonName('Urshifu-Rapid-Strike'));
    const singleStrike = toID(normalizePokemonName('Urshifu-Single-Strike'));
    expect(rapidStrike).not.toBe(singleStrike);
  });

  it('keeps Urshifu-Rapid-Strike distinct from base Urshifu', () => {
    const rapidStrike = toID(normalizePokemonName('Urshifu-Rapid-Strike'));
    const base = toID(normalizePokemonName('Urshifu'));
    expect(rapidStrike).not.toBe(base);
  });

  it('preserves -Trash forme suffix (Wormadam)', () => {
    const result = normalizePokemonName('Wormadam-Trash');
    expect(toID(result)).toBe(toID('Wormadam-Trash'));
  });

  it('preserves -Sandy forme suffix (Wormadam)', () => {
    const result = normalizePokemonName('Wormadam-Sandy');
    expect(toID(result)).toBe(toID('Wormadam-Sandy'));
  });

  it('keeps Wormadam-Trash and Wormadam-Sandy DISTINCT from each other', () => {
    const trash = toID(normalizePokemonName('Wormadam-Trash'));
    const sandy = toID(normalizePokemonName('Wormadam-Sandy'));
    expect(trash).not.toBe(sandy);
  });

  // ---------------------------------------------------------------------------
  // Base names pass through unchanged
  // ---------------------------------------------------------------------------

  it('passes through plain base names unchanged', () => {
    const result = normalizePokemonName('Pikachu');
    expect(toID(result)).toBe(toID('Pikachu'));
  });

  it('passes through Landorus-Therian unchanged', () => {
    const result = normalizePokemonName('Landorus-Therian');
    expect(toID(result)).toBe(toID('Landorus-Therian'));
  });

  // ---------------------------------------------------------------------------
  // Null-safety
  // ---------------------------------------------------------------------------

  it('returns empty string for empty input without throwing', () => {
    expect(() => normalizePokemonName('')).not.toThrow();
    expect(normalizePokemonName('')).toBe('');
  });
});
