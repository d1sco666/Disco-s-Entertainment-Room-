import type { AnimeTitle, AnimeWatchHistoryItem } from '../types';

const API_URL = 'https://api.myanimelist.net/v2';
const AUTHORIZE_URL = 'https://myanimelist.net/v1/oauth2/authorize';
const CLIENT_ID = import.meta.env.VITE_MAL_CLIENT_ID || '8d96d1c3e67e9cbeb6acb455a254ebcd';
const AUTH_KEY = 'entertainment-room-mal-auth';
const PENDING_AUTH_KEY = 'entertainment-room-mal-pending';

interface MalAuth {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface PendingAuth {
  verifier: string;
  state: string;
  redirectUri: string;
}

interface MalAnimeNode {
  node: {
    id: number;
    title: string;
    main_picture: { large?: string; medium?: string };
    start_date?: string | null;
    end_date?: string | null;
    mean?: number;
    popularity?: number;
    num_episodes?: number;
    media_type?: string;
    status?: string;
    genres?: { name: string }[];
    studios?: { name: string }[];
    synopsis?: string;
  };
  list_status: {
    status: string;
    score?: number;
    num_watched_episodes?: number;
    is_rewatching?: boolean;
    priority?: number;
    updated_at?: string;
  };
}

interface MalAnimeListResponse {
  data: MalAnimeNode[];
  paging?: {
    next?: string;
  };
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

function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
  window.dispatchEvent(new Event('mal-auth-changed'));
}

async function exchangeToken(fields: Record<string, string>): Promise<MalAuth> {
  const response = await fetch(`${API_URL}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, ...fields }),
  });
  if (!response.ok) {
    throw new Error(`MyAnimeList authorization failed (${response.status}).`);
  }
  const result = await response.json() as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };
  if (!result.access_token || !result.refresh_token || !result.expires_in) {
    throw new Error('MyAnimeList did not return a valid token response.');
  }
  const auth: MalAuth = {
    accessToken: result.access_token,
    refreshToken: result.refresh_token,
    expiresAt: Date.now() + result.expires_in * 1000,
  };
  saveAuth(auth);
  return auth;
}

async function getValidAuth(): Promise<MalAuth> {
  const auth = readAuth();
  if (!auth) throw new Error('Connect your MyAnimeList account to sync your library.');
  if (auth.expiresAt > Date.now() + 60_000) return auth;
  try {
    return await exchangeToken({
      grant_type: 'refresh_token',
      refresh_token: auth.refreshToken,
    });
  } catch (error) {
    clearAuth();
    throw error;
  }
}

async function malRequest<T>(path: string): Promise<T> {
  const auth = await getValidAuth();
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      Accept: 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`MyAnimeList request failed (${response.status}).`);
  }
  return response.json() as Promise<T>;
}

export const malAPI = {
  isConfigured: Boolean(CLIENT_ID),
  isConnected: () => Boolean(readAuth()),

  async connect() {
    if (!CLIENT_ID) throw new Error('Set VITE_MAL_CLIENT_ID before connecting MyAnimeList.');
    const verifier = randomString(64);
    const pending: PendingAuth = {
      verifier,
      state: randomString(32),
      redirectUri: getRedirectUri(),
    };
    sessionStorage.setItem(PENDING_AUTH_KEY, JSON.stringify(pending));
    const url = new URL(AUTHORIZE_URL);
    url.search = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: pending.redirectUri,
      response_type: 'code',
      state: pending.state,
      code_challenge: verifier,
      code_challenge_method: 'plain',
    }).toString();
    window.location.assign(url.toString());
  },

  async completeConnection(code: string, state: string) {
    const raw = sessionStorage.getItem(PENDING_AUTH_KEY);
    sessionStorage.removeItem(PENDING_AUTH_KEY);
    if (!raw) throw new Error('MyAnimeList sign-in expired. Start the connection again.');
    const pending = JSON.parse(raw) as PendingAuth;
    if (!state || state !== pending.state) throw new Error('MyAnimeList sign-in state did not match. Start again.');
    await exchangeToken({
      grant_type: 'authorization_code',
      code,
      redirect_uri: pending.redirectUri,
      code_verifier: pending.verifier,
    });
  },

  disconnect() {
    clearAuth();
  },

  async getAnimeList(): Promise<{ watchlist: AnimeTitle[]; watched: AnimeWatchHistoryItem[] }> {
    const watchlist: AnimeTitle[] = [];
    const watched: AnimeWatchHistoryItem[] = [];
    let url: string | null = '/users/@me/animelist?fields=id,title,main_picture,start_date,end_date,mean,popularity,num_episodes,media_type,status,genres,studios,synopsis,list_status&limit=1000';
    while (url) {
      const response: MalAnimeListResponse = await malRequest<MalAnimeListResponse>(url);
      for (const entry of response.data) {
        const anime = entry.node as MalAnimeNode['node'];
        const status = entry.list_status.status as string;
        const item: AnimeTitle = {
          id: String(anime.id),
          malId: anime.id,
          title: anime.title,
          overview: anime.synopsis ?? '',
          poster: anime.main_picture?.large ?? '',
          backdrop: anime.main_picture?.medium ?? '',
          score: anime.mean ? anime.mean / 10 : 0,
          year: anime.start_date ? Number(anime.start_date.slice(0, 4)) || 0 : 0,
          episodes: anime.num_episodes ?? 0,
          status: mapMalStatus(status),
          genres: (anime.genres ?? []).map((g: { name: string }) => g.name),
          studios: (anime.studios ?? []).map((s: { name: string }) => s.name),
          source: undefined,
          duration: undefined,
          rating: undefined,
          season: undefined,
          type: anime.media_type ?? undefined,
          alternative: undefined,
          native: undefined,
          slug: undefined,
          isSub: undefined,
          isDub: undefined,
          aniId: undefined,
          sId: undefined,
        };
        if (status === 'watching' || status === 'completed' || status === 'on_hold' || status === 'dropped') {
          watched.push({
            item,
            watchedAt: entry.list_status.updated_at
              ? Date.parse(entry.list_status.updated_at)
              : Date.now(),
          });
        }
        if (status === 'plan_to_watch' || status === 'watching') {
          watchlist.push(item);
        }
      }
      url = response.paging?.next ? new URL(response.paging.next).pathname + new URL(response.paging.next).search : null;
    }
    return { watchlist, watched };
  },

};

function mapMalStatus(status: string): string {
  switch (status) {
    case 'watching': return 'Currently Airing';
    case 'completed': return 'Finished Airing';
    case 'on_hold': return 'On Hold';
    case 'dropped': return 'Dropped';
    case 'plan_to_watch': return 'Plan to Watch';
    default: return status;
  }
}
