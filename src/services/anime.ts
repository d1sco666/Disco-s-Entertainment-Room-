import type { AnimeTitle } from '../types';

const JIKAN_API_URL = 'https://api.jikan.moe/v4';
const ANILIST_API_URL = 'https://graphql.anilist.co';

export const animeGenres = [
  { id: 1, name: 'Action' },
  { id: 2, name: 'Adventure' },
  { id: 5, name: 'Avant Garde' },
  { id: 46, name: 'Award Winning' },
  { id: 28, name: 'Boys Love' },
  { id: 4, name: 'Comedy' },
  { id: 8, name: 'Drama' },
  { id: 9, name: 'Ecchi' },
  { id: 10, name: 'Fantasy' },
  { id: 26, name: 'Girls Love' },
  { id: 47, name: 'Gourmet' },
  { id: 14, name: 'Horror' },
  { id: 7, name: 'Mystery' },
  { id: 22, name: 'Romance' },
  { id: 24, name: 'Sci-Fi' },
  { id: 36, name: 'Slice of Life' },
  { id: 30, name: 'Sports' },
  { id: 37, name: 'Supernatural' },
  { id: 41, name: 'Suspense' },
  { id: 49, name: 'Erotica' },
  { id: 12, name: 'Hentai' },
];

export const animeAgeRatings = [
  { value: 'g', label: 'G - All Ages' },
  { value: 'pg', label: 'PG - Children' },
  { value: 'pg13', label: 'PG-13 - Teens 13 or older' },
  { value: 'r17', label: 'R - 17+ (violence & profanity)' },
  { value: 'r', label: 'R+ - Mild nudity' },
  { value: 'rx', label: 'Rx - Hentai' },
];

interface JikanAnime {
  mal_id: number;
  url: string;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  synopsis: string | null;
  year: number | null;
  aired: { from: string | null } | null;
  images: { webp?: { large_image_url?: string; image_url?: string }; jpg?: { large_image_url?: string; image_url?: string } };
  score: number | null;
  rating: string | null;
  episodes: number | null;
  status: string | null;
  genres: { mal_id: number; name: string }[];
  themes: { mal_id: number; name: string }[];
}

interface JikanResponse<T> {
  data: T;
  pagination?: { last_visible_page: number; has_next_page: boolean };
}

interface AniListMedia {
  id: number;
  idMal: number | null;
  title: { english: string | null; romaji: string; native: string | null };
  description: string | null;
  genres: string[];
  coverImage: { large: string; extraLarge: string };
  bannerImage: string | null;
  averageScore: number | null;
  episodes: number | null;
  startDate: { year: number | null };
}

interface AniListResponse {
  data?: { Page?: { media?: AniListMedia[] } };
  errors?: { message?: string }[];
}

export interface AnimeSearchFilters {
  genreId: number | null;
  ageRating: string;
  sortBy: 'popular' | 'top_rated';
  year: number | null;
}

export interface AnimePageResult {
  items: AnimeTitle[];
  page: number;
  totalPages: number;
  hasMore: boolean;
  aniListWarning: string | null;
}

export interface AnimeTitlesResult {
  items: AnimeTitle[];
  warning: string | null;
}

export interface AnimeDetailsResult {
  item: AnimeTitle;
  warning: string | null;
}

async function jikanRequest<T>(path: string): Promise<JikanResponse<T>> {
  const response = await fetch(`${JIKAN_API_URL}${path}`);
  if (!response.ok) {
    throw new Error(`MyAnimeList catalog request failed (${response.status}). Please try again shortly.`);
  }
  return response.json() as Promise<JikanResponse<T>>;
}

async function getAniListMatches(malIds: number[], signal?: AbortSignal): Promise<Map<number, AniListMedia>> {
  if (malIds.length === 0) return new Map();

  const response = await fetch(ANILIST_API_URL, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      query: `
        query ($malIds: [Int]) {
          Page(page: 1, perPage: 50) {
            media(idMal_in: $malIds, type: ANIME) {
              id
              idMal
              title { english romaji native }
              description(asHtml: false)
              genres
              coverImage { large extraLarge }
              bannerImage
              averageScore
              episodes
              startDate { year }
            }
          }
        }
      `,
      variables: { malIds },
    }),
  });

  if (!response.ok) {
    throw new Error(`AniList ID lookup failed (${response.status}).`);
  }

  const result = await response.json() as AniListResponse;
  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message || 'AniList lookup failed.').join(' '));
  }

  return new Map((result.data?.Page?.media ?? [])
    .filter((media): media is AniListMedia & { idMal: number } => typeof media.idMal === 'number')
    .map((media) => [media.idMal, media]));
}

function mapAnime(anime: JikanAnime, aniList?: AniListMedia): AnimeTitle {
  const malId = anime.mal_id;
  const year = anime.year
    ?? (anime.aired?.from ? Number(anime.aired.from.slice(0, 4)) : null)
    ?? aniList?.startDate.year
    ?? 0;
  const poster = anime.images.webp?.large_image_url
    || anime.images.webp?.image_url
    || anime.images.jpg?.large_image_url
    || anime.images.jpg?.image_url
    || '';

  return {
    id: String(malId),
    malId,
    aniListId: aniList?.id,
    title: anime.title_english || aniList?.title.english || anime.title,
    titleJapanese: anime.title_japanese || aniList?.title.native || '',
    year,
    overview: anime.synopsis || aniList?.description?.replace(/<[^>]+>/g, ' ') || '',
    poster: poster || aniList?.coverImage.extraLarge || aniList?.coverImage.large || '',
    banner: aniList?.bannerImage || '',
    score: anime.score ?? (aniList?.averageScore ? aniList.averageScore / 10 : 0),
    ageRating: anime.rating || 'Not rated',
    genres: [...new Set([...anime.genres.map(({ name }) => name), ...anime.themes.map(({ name }) => name), ...(aniList?.genres ?? [])])],
    episodes: anime.episodes ?? aniList?.episodes ?? 0,
    status: anime.status || 'Unknown',
    malUrl: anime.url,
    aniListUrl: aniList ? `https://anilist.co/anime/${aniList.id}` : undefined,
  };
}

export async function discoverAnime(
  filters: AnimeSearchFilters,
  page: number,
  signal?: AbortSignal,
): Promise<AnimePageResult> {
  const params = new URLSearchParams({
    page: String(page),
    limit: '24',
    order_by: filters.sortBy === 'top_rated' ? 'score' : 'popularity',
    sort: 'desc',
    sfw: filters.ageRating === 'rx' || filters.genreId === 12 || filters.genreId === 49 ? 'false' : 'true',
  });
  if (filters.genreId) params.set('genres', String(filters.genreId));
  if (filters.ageRating) params.set('rating', filters.ageRating);
  if (filters.year) {
    params.set('start_date', `${filters.year}-01-01`);
    params.set('end_date', `${filters.year}-12-31`);
  }

  const response = await fetch(`${JIKAN_API_URL}/anime?${params}`, { signal });
  if (!response.ok) {
    throw new Error(`MyAnimeList catalog request failed (${response.status}). Please try again shortly.`);
  }
  const result = await response.json() as JikanResponse<JikanAnime[]>;
  const malIds = result.data.map(({ mal_id }) => mal_id);

  let aniListMatches = new Map<number, AniListMedia>();
  const warnings: string[] = [];
  try {
    aniListMatches = await getAniListMatches(malIds);
  } catch (error) {
    if (signal?.aborted) throw error;
    warnings.push(error instanceof Error ? error.message : 'AniList IDs could not be loaded.');
  }

  let availability = new Map<number, boolean>();
  try {
    availability = await getAniPmAvailability(malIds, signal);
  } catch (error) {
    if (signal?.aborted) throw error;
    warnings.push(error instanceof Error ? error.message : 'Ani.pm availability could not be checked.');
  }

  return {
    items: result.data.map((anime) => ({
      ...mapAnime(anime, aniListMatches.get(anime.mal_id)),
      aniPmAvailable: availability.get(anime.mal_id),
    })),
    page,
    totalPages: result.pagination?.last_visible_page ?? page,
    hasMore: result.pagination?.has_next_page ?? false,
    aniListWarning: warnings.length ? warnings.join(' ') : null,
  };
}

async function getAniPmAvailability(malIds: number[], signal?: AbortSignal): Promise<Map<number, boolean>> {
  if (malIds.length === 0) return new Map();
  const response = await fetch(`https://ani.pm/api/partner/v1/lookup?mal=${malIds.join(',')}`, { signal });
  if (!response.ok) {
    throw new Error(`Ani.pm availability check failed (${response.status}).`);
  }
  const result = await response.json() as {
    data?: { query?: { mal?: string }; available?: boolean }[];
  };
  return new Map((result.data ?? [])
    .filter((entry): entry is { query: { mal: string }; available: boolean } => (
      typeof entry.query?.mal === 'string'
      && typeof entry.available === 'boolean'
    ))
    .map((entry) => [Number(entry.query.mal), entry.available]));
}

async function getJapaneseAnimeDetails(malId: number): Promise<AnimeDetailsResult> {
  const result = await jikanRequest<JikanAnime>(`/anime/${malId}/full`);
  const warnings: string[] = [];
  let aniList: AniListMedia | undefined;
  try {
    const aniListMatches = await getAniListMatches([malId]);
    aniList = aniListMatches.get(malId);
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : 'AniList ID could not be loaded.');
  }
  let availability: Map<number, boolean>;
  try {
    availability = await getAniPmAvailability([malId]);
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : 'Ani.pm availability could not be checked.');
    availability = new Map();
  }
  return {
    item: { ...mapAnime(result.data, aniList), aniPmAvailable: availability.get(malId) },
    warning: warnings.length ? warnings.join(' ') : null,
  };
}

export async function searchAnime(query: string, signal?: AbortSignal): Promise<AnimeTitlesResult> {
  const params = new URLSearchParams({ q: query, limit: '24', order_by: 'popularity', sort: 'desc', sfw: 'true' });
  const response = await fetch(`${JIKAN_API_URL}/anime?${params}`, { signal });
  if (!response.ok) {
    throw new Error(`MyAnimeList search failed (${response.status}). Please try again shortly.`);
  }
  const result = await response.json() as JikanResponse<JikanAnime[]>;
  const warnings: string[] = [];
  let aniListMatches = new Map<number, AniListMedia>();
  try {
    aniListMatches = await getAniListMatches(result.data.map(({ mal_id }) => mal_id), signal);
  } catch (error) {
    if (signal?.aborted) throw error;
    warnings.push(error instanceof Error ? error.message : 'AniList IDs could not be loaded.');
  }
  let availability = new Map<number, boolean>();
  try {
    availability = await getAniPmAvailability(result.data.map(({ mal_id }) => mal_id), signal);
  } catch (error) {
    if (signal?.aborted) throw error;
    warnings.push(error instanceof Error ? error.message : 'Ani.pm availability could not be checked.');
  }
  return {
    items: result.data.map((anime) => ({
      ...mapAnime(anime, aniListMatches.get(anime.mal_id)),
      aniPmAvailable: availability.get(anime.mal_id),
    })),
    warning: warnings.length ? warnings.join(' ') : null,
  };
}

export async function getAnimeDetails(malId: number): Promise<AnimeDetailsResult> {
  return getJapaneseAnimeDetails(malId);
}

export function getAniPmEmbedUrl(item: AnimeTitle, episode: number, language: 'sub' | 'dub') {
  if (!Number.isSafeInteger(episode) || episode < 1) {
    throw new Error('Choose a valid anime episode to play.');
  }
  const source = item.aniListId
    ? `ani/${item.aniListId}`
    : `mal/${item.malId}`;
  return `https://ani.pm/embed/${source}/${episode}/${language}`;
}
