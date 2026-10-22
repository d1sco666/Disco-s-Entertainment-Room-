const API_URL = 'https://anilist.co/api/v2/oauth';
const CLIENT_ID = import.meta.env.VITE_ANILIST_CLIENT_ID || '54461';
const CLIENT_SECRET = import.meta.env.VITE_ANILIST_CLIENT_SECRET || '08FFcZU6oFiVjZ0mu7B3ZqaWi9NwzH6Hwtg9Lsf3';
const AUTH_KEY = 'entertainment-room-anilist-auth';
const PENDING_AUTH_KEY = 'entertainment-room-anilist-pending';

interface AniListAuth {
  accessToken: string;
  expiresAt: number;
  tokenType: string;
  scope: string;
  refreshToken?: string;
}

interface PendingAuth {
  state: string;
  redirectUri: string;
}

function getRedirectUri() {
  return `${window.location.origin}/anilist/callback`;
}

function randomString(size: number) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  let result = '';
  for (const byte of bytes) result += chars[byte % chars.length];
  return result;
}

function readAuth(): AniListAuth | null {
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    if (
      !parsed || typeof parsed !== 'object'
      || typeof (parsed as AniListAuth).accessToken !== 'string'
      || typeof (parsed as AniListAuth).expiresAt !== 'number'
      || typeof (parsed as AniListAuth).tokenType !== 'string'
      || typeof (parsed as AniListAuth).scope !== 'string'
    ) {
      return null;
    }
    return parsed as AniListAuth;
  } catch {
    return null;
  }
}

function saveAuth(auth: AniListAuth) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  window.dispatchEvent(new Event('anilist-auth-changed'));
}

async function exchangeToken(fields: Record<string, string>): Promise<AniListAuth> {
  const response = await fetch(`${API_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      ...fields,
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`AniList authorization failed (${response.status})${detail ? `: ${detail.slice(0, 240)}` : ''}`);
  }

  const result = await response.json() as {
    access_token?: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
    refresh_token?: string;
  };
  if (!result.access_token) {
    throw new Error('AniList did not return an access token.');
  }
  const auth: AniListAuth = {
    accessToken: result.access_token,
    expiresAt: Date.now() + (result.expires_in ?? 86400) * 1000,
    tokenType: result.token_type ?? 'Bearer',
    scope: result.scope ?? '',
  };
  if (result.refresh_token) auth.refreshToken = result.refresh_token;
  return auth;
}

function disconnectAnilist() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(PENDING_AUTH_KEY);
  window.dispatchEvent(new Event('anilist-auth-changed'));
}

export const anilistAPI = {
  isConfigured: Boolean(CLIENT_ID && CLIENT_SECRET),
  isConnected: () => Boolean(readAuth()),

  async connect() {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      throw new Error('Set VITE_ANILIST_CLIENT_ID and VITE_ANILIST_CLIENT_SECRET before connecting AniList.');
    }
    const state = randomString(32);
    const pending: PendingAuth = {
      state,
      redirectUri: getRedirectUri(),
    };
    sessionStorage.setItem(PENDING_AUTH_KEY, JSON.stringify(pending));
    const url = new URL('https://anilist.co/api/v2/oauth/authorize');
    url.search = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: pending.redirectUri,
      response_type: 'code',
      state,
    }).toString();
    window.location.assign(url.toString());
  },

  async completeConnection(code: string, state: string) {
    const raw = sessionStorage.getItem(PENDING_AUTH_KEY);
    sessionStorage.removeItem(PENDING_AUTH_KEY);
    if (!raw) throw new Error('AniList sign-in expired. Start the connection again.');
    const pending = JSON.parse(raw) as PendingAuth;
    if (!state || state !== pending.state) throw new Error('AniList sign-in state did not match. Start again.');
    const auth = await exchangeToken({
      grant_type: 'authorization_code',
      code,
      redirect_uri: pending.redirectUri,
    });
    saveAuth(auth);
  },

  disconnect() {
    disconnectAnilist();
  },
};
