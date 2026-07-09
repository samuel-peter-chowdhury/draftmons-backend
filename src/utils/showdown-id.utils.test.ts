import { toID } from './showdown-id.utils';

describe('toID', () => {
  it('lowercases and strips spaces', () => {
    expect(toID('Ash Ketchum')).toBe('ashketchum');
  });

  it('strips hyphens', () => {
    expect(toID('ash-ketchum')).toBe('ashketchum');
  });

  it('leaves already-normalized strings unchanged', () => {
    expect(toID('urshifu')).toBe('urshifu');
  });

  it('lowercases and strips hyphens in form names', () => {
    expect(toID('Urshifu-Rapid-Strike')).toBe('urshifurapidstrike');
  });

  it('returns empty string for empty input', () => {
    expect(toID('')).toBe('');
  });

  it('returns empty string for null (no throw)', () => {
    expect(toID(null as any)).toBe('');
  });

  it('returns empty string for undefined (no throw)', () => {
    expect(toID(undefined as any)).toBe('');
  });

  it('trims surrounding whitespace', () => {
    expect(toID('  Brock  ')).toBe('brock');
  });
});
