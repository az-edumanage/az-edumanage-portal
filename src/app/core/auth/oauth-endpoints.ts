import { environment } from '../../../environments/environment';

export type OAuthProvider = 'google' | 'microsoft';

function resolveBackendBaseUrl(): string {
  return environment.apiBaseUrl.replace(/\/api\/v1\/?$/, '');
}

export function buildOAuthStartUrl(provider: OAuthProvider, callbackUrl: string): string {
  const encodedCallback = encodeURIComponent(callbackUrl);
  return `${resolveBackendBaseUrl()}/auth/oauth2/authorization/${provider}?redirect_uri=${encodedCallback}`;
}

