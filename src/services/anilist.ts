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

function parseFragmentToken(): { accessToken: string; expiresIn?: number; state?: string } | null {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  if (!accessToken) return null;
  const expiresIn = params.get('expires_in');
  const state = params.get('state');
  return { accessToken, expiresIn: expiresIn ? Number(expiresIn) : undefined, state: state ?? undefined };
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
      response_type: 'token',
      state,
    }).toString();
    window.location.assign(url.toString());
  },

  async completeConnection() {
    const raw = sessionStorage.getItem('entertainment-room-anilist-state');
    sessionStorage.removeItem('entertainment-room-anilist-state');
    const parsed = parseFragmentToken();
    if (!parsed || !parsed.accessToken || !parsed.state || !raw || parsed.state !== raw) {
      throw new Error('AniList did not return a valid access token.');
    }
    const auth: AniListAuth = {
      accessToken: parsed.accessToken,
      expiresAt: Date.now() + (parsed.expiresIn ? parsed.expiresIn : 365 * 24 * 60 * 60) * 1000,
      tokenType: 'Bearer',
    };
    saveAuth(auth);
    window.history.replaceState({}, document.title, window.location.pathname);
  },

  disconnect() {
    disconnectAnilist();
  },
};
