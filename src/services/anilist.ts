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

// Parses an access token from the URL fragment (implicit grant response).
// Returns null when no token is present. Clears the fragment after reading.
function readFragmentToken(expectedState: string | null): AniListAuth | null {
  if (typeof window === 'undefined' || !window.location.hash) return null;
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const accessToken = params.get('access_token');
  const state = params.get('state');
  const expiresIn = params.get('expires_in');
  const tokenType = params.get('token_type');
  if (!accessToken) return null;
  if (!state || !expectedState || state !== expectedState) return null;

  const auth: AniListAuth = {
    accessToken,
    expiresAt: Date.now() + (expiresIn ? Number(expiresIn) : 365 * 24 * 60 * 60) * 1000,
    tokenType: tokenType ?? 'Bearer',
  };

  // Remove the token fragment so it isn't left in the URL / history.
  const url = new URL(window.location.href);
  url.hash = '';
  window.history.replaceState({}, document.title, url.toString());

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
      response_type: 'token',
      state,
    }).toString();
    window.location.assign(url.toString());
  },

  completeConnection() {
    const raw = sessionStorage.getItem('entertainment-room-anilist-state');
    sessionStorage.removeItem('entertainment-room-anilist-state');
    const auth = readFragmentToken(raw ?? null);
    if (!auth) throw new Error('AniList did not return an access token.');
    saveAuth(auth);
  },

  disconnect() {
    disconnectAnilist();
  },
};
