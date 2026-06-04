export function safeRedirect(value: string | null): string | null {
  if (!value) {
    return null;
  }
  let decoded: string;
  try {
    decoded = decodeURIComponent(value).trim();
  } catch {
    return null;
  }
  if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.includes('://')) {
    return null;
  }
  return decoded;
}

export function jwtExpiresAt(token: string | null): number | null {
  if (!token) {
    return null;
  }
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: unknown };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string | null, now = Date.now()): boolean {
  const expiresAt = jwtExpiresAt(token);
  return expiresAt !== null && expiresAt <= now;
}
