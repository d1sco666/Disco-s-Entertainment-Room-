import type { AnimeTitle } from '../types';

const ANILIST_API_URL = 'https://graphql.anilist.co';

export interface AnimeSeriesResult {
  anime: AnimeTitle;
  episodes: AnimeEpisode[];
}

export interface AnimeEpisode {
  id: number;
  title: string;
  jpTitle?: string;
  number: number;
  episodeEmbedId?: number;
  subUrl?: string;
  dubUrl?: string;
}

export interface AnimeListResult {
  items: AnimeTitle[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface SearchAnimeResult {
  items: AnimeTitle[];
  total: number;
}

function mapAnimeTitle(raw: unknown): AnimeTitle {
  const a = raw as Record<string, unknown>;
  const title = a['title'] as Record<string, unknown> | undefined;
  const coverImage = a['coverImage'] as Record<string, unknown> | undefined;
  const studios = a['studios'] as Record<string, unknown> | undefined;

  return {
    id: String(a['id'] ?? ''),
    aniId: typeof a['id'] === 'number' ? a['id'] : undefined,
    malId: typeof a['idMal'] === 'number' ? a['idMal'] : undefined,
    title: (title?.english ?? title?.romaji ?? title?.native ?? '') as string,
    alternative: title?.romaji ? String(title.romaji) : undefined,
    native: title?.native ? String(title.native) : undefined,
    slug: undefined,
    year: typeof a['seasonYear'] === 'number' ? a['seasonYear'] : 0,
    overview: a['description'] ? String(a['description']) : '',
    poster: coverImage?.large ? String(coverImage.large) : '',
    backdrop: a['bannerImage'] ? String(a['bannerImage']) : undefined,
    score: typeof a['averageScore'] === 'number' ? a['averageScore'] / 10 : 0,
    status: mapAnilistStatus(a['status']),
    season: a['season'] ? String(a['season']) : undefined,
    type: a['format'] ? String(a['format']) : undefined,
    source: a['source'] ? String(a['source']) : undefined,
    duration: a['duration'] ? String(a['duration']) : undefined,
    rating: undefined,
    episodes: typeof a['episodes'] === 'number' ? a['episodes'] : 0,
    genres: Array.isArray(a['genres']) ? (a['genres'] as string[]) : [],
    studios: studios && Array.isArray((studios as Record<string, unknown>).nodes)
      ? ((studios as Record<string, unknown>).nodes as Record<string, unknown>[]).map((s) => String(s['name'] ?? ''))
      : [],
    isSub: undefined,
    isDub: undefined,
    sId: undefined,
  };
}

function mapAnilistStatus(status: unknown): string {
  switch (status) {
    case 'FINISHED': return 'Finished Airing';
    case 'RELEASING': return 'Currently Airing';
    case 'NOT_YET_RELEASED': return 'Not yet aired';
    case 'CANCELLED': return 'Cancelled';
    default: return 'Unknown';
  }
}



async function graphqlAnilist<T>(
  query: string,
  variables: Record<string, unknown>,
  signal?: AbortSignal
): Promise<T> {
  const response = await fetch(ANILIST_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query, variables }),
    signal,
  });

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    throw new Error(`AniList API error ${response.status}`);
  }

  const data = body as { data?: unknown; errors?: { message: string }[] } | null;
  if (data?.errors && data.errors.length > 0) {
    throw new Error(`AniList API error: ${data.errors.map((e) => e.message).join('; ')}`);
  }
  if (!data || data.data === null) {
    throw new Error('AniList API returned an empty response.');
  }
  return data.data as T;
}

export interface AnimeFilters {
  genre?: string;
  format?: string;
  year?: number | null;
  status?: string;
}

const MEDIA_PAGE_QUERY = `
  query ($page: Int, $perPage: Int, $genre: String, $format: MediaFormat, $status: MediaStatus, $seasonYear: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total perPage currentPage lastPage hasNextPage }
      media(
        type: ANIME
        isAdult: false
        genre: $genre
        format: $format
        status: $status
        seasonYear: $seasonYear
        sort: POPULARITY_DESC
      ) {
        id idMal title { romaji english native } coverImage { large } bannerImage description averageScore status season seasonYear format duration episodes genres source studios { nodes { name } }
      }
    }
  }
`;

const STATUS_MAP: Record<string, string> = {
  'Currently Airing': 'RELEASING',
  'Finished Airing': 'FINISHED',
  'Not yet aired': 'NOT_YET_RELEASED',
  Cancelled: 'CANCELLED',
};

export async function fetchRecentAnime(
  page = 1,
  perPage = 20,
  filters: AnimeFilters = {},
  signal?: AbortSignal
): Promise<AnimeListResult> {
  const variables: Record<string, unknown> = {
    page,
    perPage,
  };
  if (filters.genre) variables.genre = filters.genre;
  if (filters.format) variables.format = filters.format;
  if (filters.status) variables.status = STATUS_MAP[filters.status] ?? filters.status;
  if (filters.year) variables.seasonYear = filters.year;

  const body = await graphqlAnilist<{
    Page: {
      pageInfo: { total: number; perPage: number; currentPage: number; lastPage: number; hasNextPage: boolean };
      media: unknown[];
    };
  }>(MEDIA_PAGE_QUERY, variables, signal);

  const items = (body.Page.media ?? []).map(mapAnimeTitle);

  // Client-side filtering since AniList's seasonYear is combined with season,
  // and we want standalone year filtering independent of season.
  let filtered = items;
  if (filters.year) {
    filtered = filtered.filter((item) => item.year === filters.year);
  }

  return {
    items: filtered,
    page: body.Page.pageInfo.currentPage,
    perPage: body.Page.pageInfo.perPage,
    total: body.Page.pageInfo.total,
    totalPages: body.Page.pageInfo.lastPage,
  };
}

const SEARCH_QUERY = `
  query ($page: Int, $perPage: Int, $search: String) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total perPage currentPage lastPage hasNextPage }
      media(type: ANIME, isAdult: false, search: $search, sort: POPULARITY_DESC) {
        id idMal title { romaji english native } coverImage { large } bannerImage description averageScore status season seasonYear format duration episodes genres source studios { nodes { name } }
      }
    }
  }
`;

export async function searchAnime(
  query: string,
  page = 1,
  perPage = 20,
  signal?: AbortSignal
): Promise<SearchAnimeResult> {
  const body = await graphqlAnilist<{
    Page: {
      pageInfo: { total: number; perPage: number; currentPage: number; lastPage: number; hasNextPage: boolean };
      media: unknown[];
    };
  }>(SEARCH_QUERY, { page, perPage, search: query }, signal);

  return {
    items: (body.Page.media ?? []).map(mapAnimeTitle),
    total: body.Page.pageInfo.total,
  };
}

const MEDIA_BY_ID_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id idMal title { romaji english native } coverImage { large } bannerImage description averageScore status season seasonYear format duration episodes genres source studios { nodes { name } }
    }
  }
`;

export async function fetchAnimeSeries(id: string | number, signal?: AbortSignal): Promise<AnimeSeriesResult> {
  const body = await graphqlAnilist<{
    Media: Record<string, unknown> | null;
  }>(MEDIA_BY_ID_QUERY, { id: Number(id) }, signal);

  const media = body.Media;
  if (!media) {
    throw new Error('Anime not found.');
  }

  const totalEpisodes = typeof media['episodes'] === 'number' ? media['episodes'] : 0;
  const episodes: AnimeEpisode[] = Array.from({ length: totalEpisodes }, (_, i) => ({
    id: i + 1,
    title: `Episode ${i + 1}`,
    number: i + 1,
  }));

  return {
    anime: mapAnimeTitle(media),
    episodes,
  };
}

export function getEpisodeUrl(
  animeId: number | undefined,
  _episode: AnimeEpisode,
  language: 'sub' | 'dub'
): string {
  if (!animeId) return '';
  // Mikaza Kira server embed — AniList ID resolution with automatic failover across servers
  return `https://mikaza.buzz/embed/kira/ani/${animeId}/${_episode.number}/${language}`;
}
