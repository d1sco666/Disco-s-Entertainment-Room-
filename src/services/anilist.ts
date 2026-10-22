const CLIENT_ID = import.meta.env.VITE_ANILIST_CLIENT_ID || '54461';
const AUTH_KEY = 'entertainment-room-anilist-auth';

interface AniListAuth {
  accessToken: string;
  expiresAt: number;
  tokenType: string;
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

function disconnectAnilist() {
  localStorage.removeItem(AUTH_KEY);
  window.dispatchEvent(new Event('anilist-auth-changed'));
}

function getTokenEndpoint() {
  const origin = window.location.origin;
  return origin.includes('localhost') || origin.includes('127.0.0.1')
    ? `${origin}/anilist/token`
    : '/anilist/token';
}

async function exchangeCodeForToken(code: string): Promise<AniListAuth> {
  const response = await fetch(getTokenEndpoint(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, redirect_uri: getRedirectUri() }),
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`AniList token exchange failed (${response.status})${body ? `: ${body}` : ''}`);
  }
  const data = await response.json();
  if (!data.access_token) {
    throw new Error('AniList token exchange returned no access token.');
  }
  const auth: AniListAuth = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in ? Number(data.expires_in) : 365 * 24 * 60 * 60) * 1000,
    tokenType: data.token_type ?? 'Bearer',
  };
  return auth;
}

export const anilistAPI = {
  isConfigured: Boolean(CLIENT_ID),
  isConnected: () => Boolean(readAuth()),

  async connect() {
    if (!CLIENT_ID) {
      throw new Error('Set VITE_ANILIST_CLIENT_ID before connecting AniList.');
    }
    const state = randomString(32);
    sessionStorage.setItem('entertainment-room-anilist-state', state);
    const url = new URL('https://anilist.co/api/v2/oauth/authorize');
    url.search = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: getRedirectUri(),
      response_type: 'code',
      state,
    }).toString();
    window.location.assign(url.toString());
  },

  async completeConnection() {
    const raw = sessionStorage.getItem('entertainment-room-anilist-state');
    sessionStorage.removeItem('entertainment-room-anilist-state');
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (!code || !state || !raw || state !== raw) {
      throw new Error('AniList did not return a valid authorization code.');
    }
    const auth = await exchangeCodeForToken(code);
    saveAuth(auth);
    // Remove the code/state query params so they aren't left in the URL / history.
    const url = new URL(window.location.href);
    url.search = '';
    window.history.replaceState({}, document.title, url.toString());
  },

  disconnect() {
    disconnectAnilist();
  },
};
