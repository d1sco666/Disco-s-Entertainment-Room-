const CLIENT_ID = import.meta.env.VITE_MAL_CLIENT_ID || '8d96d1c3e67e9cbeb6acb455a254ebcd';
const AUTH_KEY = 'entertainment-room-mal-auth';
const PENDING_AUTH_KEY = 'entertainment-room-mal-pending';

interface MalAuth {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: string;
}

interface PendingAuth {
  verifier: string;
  state: string;
  redirectUri: string;
}

function getRedirectUri() {
  return `${window.location.origin}/mal/callback`;
}

function toBase64Url(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomString(size: number) {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(size)));
}

function readAuth(): MalAuth | null {
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    if (
      !parsed || typeof parsed !== 'object'
      || typeof (parsed as MalAuth).accessToken !== 'string'
      || typeof (parsed as MalAuth).refreshToken !== 'string'
      || typeof (parsed as MalAuth).expiresAt !== 'number'
      || typeof (parsed as MalAuth).tokenType !== 'string'
    ) {
      return null;
    }
    return parsed as MalAuth;
  } catch {
    return null;
  }
}

function saveAuth(auth: MalAuth) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  window.dispatchEvent(new Event('mal-auth-changed'));
}

function disconnectMal() {
  localStorage.removeItem(AUTH_KEY);
  window.dispatchEvent(new Event('mal-auth-changed'));
}

async function exchangeToken(fields: Record<string, string>): Promise<MalAuth> {
  const response = await fetch(`${window.location.origin}/mal/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`MyAnimeList authorization failed (${response.status})${body ? `: ${body.slice(0, 240)}` : ''}`);
  }
  const result = await response.json() as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
  };
  if (!result.access_token || !result.refresh_token) {
    throw new Error('MyAnimeList did not return valid tokens.');
  }
  return {
    accessToken: result.access_token,
    refreshToken: result.refresh_token,
    expiresAt: Date.now() + (result.expires_in ?? 604800) * 1000,
    tokenType: result.token_type ?? 'Bearer',
  };
}

async function getValidAuth() {
  const auth = readAuth();
  if (!auth) throw new Error('Connect your MyAnimeList account to sync your library.');
  if (auth.expiresAt > Date.now() + 60_000) return auth;
  try {
    const refreshed = await exchangeToken({
      grant_type: 'refresh_token',
      refresh_token: auth.refreshToken,
    });
    saveAuth(refreshed);
    return refreshed;
  } catch (error) {
    disconnectMal();
    throw error;
  }
}

export const malAPI = {
  isConfigured: Boolean(CLIENT_ID),
  isConnected: () => Boolean(readAuth()),
  getValidAuth,

  async connect() {
    if (!CLIENT_ID) {
      throw new Error('Set VITE_MAL_CLIENT_ID before connecting MyAnimeList.');
    }
    const verifier = randomString(64);
    const challenge = toBase64Url(new Uint8Array(await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(verifier)
    )));
    const pending: PendingAuth = {
      verifier,
      state: randomString(32),
      redirectUri: getRedirectUri(),
    };
    sessionStorage.setItem(PENDING_AUTH_KEY, JSON.stringify(pending));
    const url = new URL('https://myanimelist.net/v1/oauth2/authorize');
    url.search = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: pending.redirectUri,
      response_type: 'code',
      state: pending.state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    }).toString();
    window.location.assign(url.toString());
  },

  async completeConnection(code: string, state: string) {
    const raw = sessionStorage.getItem(PENDING_AUTH_KEY);
    sessionStorage.removeItem(PENDING_AUTH_KEY);
    if (!raw) throw new Error('MyAnimeList sign-in expired. Start the connection again.');
    const pending = JSON.parse(raw) as PendingAuth;
    if (!state || state !== pending.state) throw new Error('MyAnimeList sign-in state did not match. Start again.');
    const auth = await exchangeToken({
      grant_type: 'authorization_code',
      code,
      redirect_uri: pending.redirectUri,
      code_verifier: pending.verifier,
    });
    saveAuth(auth);
  },

  disconnect() {
    disconnectMal();
  },
};
