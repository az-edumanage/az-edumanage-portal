import { describe, expect, it } from 'vitest';
import { isJwtExpired, safeRedirect } from './auth-url.utils';

function tokenWithExp(exp: number): string {
  const payload = btoa(JSON.stringify({ exp })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `header.${payload}.signature`;
}

describe('dashboard auth url utilities', () => {
  it('accepts only local redirect paths', () => {
    expect(safeRedirect('/owner/plans')).toBe('/owner/plans');
    expect(safeRedirect('https://evil.example')).toBeNull();
    expect(safeRedirect('//evil.example')).toBeNull();
  });

  it('detects expired jwt tokens from exp claim', () => {
    expect(isJwtExpired(tokenWithExp(100), 101_000)).toBe(true);
    expect(isJwtExpired(tokenWithExp(200), 101_000)).toBe(false);
  });
});
