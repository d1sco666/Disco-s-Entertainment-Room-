import type { AnimeTitle } from '../types';

const ANILIST_API_URL = 'https://graphql.anilist.co';

export const animeGenres = [
  { id: 'Action', name: 'Action' },
  { id: 'Adventure', name: 'Adventure' },
  { id: 'Avant Garde', name: 'Avant Garde' },
  { id: 'Award Winning', name: 'Award Winning' },
  { id: 'Boys Love', name: 'Boys Love' },
  { id: 'Comedy', name: 'Comedy' },
  { id: 'Drama', name: 'Drama' },
  { id: 'Ecchi', name: 'Ecchi' },
  { id: 'Fantasy', name: 'Fantasy' },
  { id: 'Girls Love', name: 'Girls Love' },
  { id: 'Gourmet', name: 'Gourmet' },
  { id: 'Horror', name: 'Horror' },
  { id: 'Mystery', name: 'Mystery' },
  { id: 'Romance', name: 'Romance' },
  { id: 'Sci-Fi', name: 'Sci-Fi' },
  { id: 'Slice of Life', name: 'Slice of Life' },
  { id: 'Sports', name: 'Sports' },
  { id: 'Supernatural', name: 'Supernatural' },
  { id: 'Suspense', name: 'Suspense' },
];

export const animeAgeRatings = [
  { value: 'g', label: 'G - All Ages' },
  { value: 'pg', label: 'PG - Children' },
  { value: 'pg13', label: 'PG-13 - Teens 13 or older' },
  { value: 'r17', label: 'R - 17+ (violence & profanity)' },
  { value: 'r', label: 'R+ - Mild nudity' },
];

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
  status: string | null;
  format: string | null;
  isAdult: boolean;
  siteUrl: string;
}

interface AniListPageInfo {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
}

interface AniListResponse {
  data?: { Page?: { pageInfo?: AniListPageInfo; media?: AniListMedia[] }; Media?: AniListMedia };
  errors?: { message?: string }[];
}

export interface AnimeSearchFilters {
  genreIds: string[];
  ageRating: string;
  sortBy: 'popular' | 'top_rated';
  year: number | null;
  format: string | null;
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

async function anilistRequest(query: string, variables: Record<string, unknown>, signal?: AbortSignal): Promise<AniListResponse> {
  const response = await fetch(ANILIST_API_URL, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) {
    throw new Error(`AniList request failed (${response.status}).`);
  }
  const result = await response.json() as AniListResponse;
  if (result.errors?.length) {
    throw new Error(result.errors.map((error) => error.message || 'AniList request failed.').join(' '));
  }
  return result;
}

function mapAnime(media: AniListMedia): AnimeTitle {
  const malId = media.idMal ?? media.id;
  const poster = media.coverImage?.extraLarge ?? media.coverImage?.large ?? '';

  return {
    id: String(malId),
    malId,
    aniListId: media.id,
    title: media.title.english || media.title.romaji || media.title.native || '',
    titleJapanese: media.title.native || media.title.romaji || '',
    year: media.startDate?.year ?? 0,
    overview: media.description?.replace(/<[^>]+>/g, ' ') || '',
    poster,
    banner: media.bannerImage ?? '',
    score: media.averageScore ? media.averageScore / 10 : 0,
    ageRating: media.isAdult ? 'R+' : 'Not rated',
    genres: media.genres ?? [],
    format: media.format ?? null,
    episodes: media.episodes ?? 0,
    status: media.status ?? 'Unknown',
    malUrl: malId ? `https://myanimelist.net/anime/${malId}` : '',
    aniListUrl: `https://anilist.co/anime/${media.id}`,
  };
}

const ANIME_PAGE_QUERY = `
  query ($page: Int, $perPage: Int, $genre: [String], $sort: [MediaSort], $format: MediaFormat, $startDate: FuzzyDateInt, $endDate: FuzzyDateInt, $adult: Boolean) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total perPage currentPage lastPage hasNextPage }
      media(type: ANIME, genre_in: $genre, sort: $sort, format: $format, startDate_greater: $startDate, endDate_lesser: $endDate, adult: $adult) {
        id
        idMal
        title { english romaji native }
        description
        genres
        coverImage { large extraLarge }
        bannerImage
        averageScore
        episodes
        startDate { year }
        status
        format
        isAdult
        siteUrl
      }
    }
  }
`;

const ANIME_MEDIA_QUERY = `
  query ($idMal: Int) {
    Media(idMal: $idMal, type: ANIME) {
      id
      idMal
      title { english romaji native }
      description
      genres
      coverImage { large extraLarge }
      bannerImage
      averageScore
      episodes
      startDate { year }
      status
      isAdult
      siteUrl
    }
  }
`;

const ANIME_SEARCH_QUERY = `
  query ($query: String, $perPage: Int) {
    Page(perPage: $perPage) {
      media(search: $query, type: ANIME) {
        id
        idMal
        title { english romaji native }
        description
        genres
        coverImage { large extraLarge }
        bannerImage
        averageScore
        episodes
        startDate { year }
        status
        isAdult
        siteUrl
      }
    }
  }
`;

export async function discoverAnime(
  filters: AnimeSearchFilters,
  page: number,
  signal?: AbortSignal,
): Promise<AnimePageResult> {
  const perPage = 24;
  const sort = filters.sortBy === 'top_rated' ? ['SCORE', 'POPULARITY'] : ['POPULARITY', 'SCORE'];
  const year = filters.year;
  const variables: Record<string, unknown> = {
    page,
    perPage,
    genre: filters.genreIds.length ? filters.genreIds : undefined,
    sort,
    format: filters.format ?? undefined,
    startDate: year ? `${year}0101` : undefined,
    endDate: year ? `${year}1231` : undefined,
    adult: filters.ageRating === 'r' ? true : filters.ageRating ? false : undefined,
  };

  const result = await anilistRequest(ANIME_PAGE_QUERY, variables, signal);
  const pageInfo = result.data?.Page?.pageInfo;
  const media = result.data?.Page?.media ?? [];

  const malIds = media.map(({ idMal }) => idMal).filter((id): id is number => typeof id === 'number');
  let availability = new Map<number, boolean>();
  const warnings: string[] = [];
  try {
    availability = await getAniPmAvailability(malIds, signal);
  } catch (error) {
    if (signal?.aborted) throw error;
    warnings.push(error instanceof Error ? error.message : 'Ani.pm availability could not be checked.');
  }

  return {
    items: media.map((anime) => {
      const item = mapAnime(anime);
      return { ...item, aniPmAvailable: availability.get(item.malId) };
    }),
    page: pageInfo?.currentPage ?? page,
    totalPages: pageInfo?.lastPage ?? page,
    hasMore: pageInfo?.hasNextPage ?? false,
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

export async function getAnimeDetails(malId: number): Promise<AnimeDetailsResult> {
  const result = await anilistRequest(ANIME_MEDIA_QUERY, { idMal: malId });
  const media = result.data?.Media;
  if (!media) {
    throw new Error('Anime not found.');
  }
  const warnings: string[] = [];
  let availability: Map<number, boolean>;
  try {
    availability = await getAniPmAvailability([malId]);
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : 'Ani.pm availability could not be checked.');
    availability = new Map();
  }
  return {
    item: { ...mapAnime(media), aniPmAvailable: availability.get(malId) },
    warning: warnings.length ? warnings.join(' ') : null,
  };
}

export async function searchAnime(query: string, signal?: AbortSignal): Promise<AnimeTitlesResult> {
  const result = await anilistRequest(ANIME_SEARCH_QUERY, { query, perPage: 24 }, signal);
  const media = result.data?.Page?.media ?? [];

  const malIds = media.map(({ idMal }) => idMal).filter((id): id is number => typeof id === 'number');
  let availability = new Map<number, boolean>();
  const warnings: string[] = [];
  try {
    availability = await getAniPmAvailability(malIds, signal);
  } catch (error) {
    if (signal?.aborted) throw error;
    warnings.push(error instanceof Error ? error.message : 'Ani.pm availability could not be checked.');
  }

  return {
    items: media.map((anime) => {
      const item = mapAnime(anime);
      return { ...item, aniPmAvailable: availability.get(item.malId) };
    }),
    warning: warnings.length ? warnings.join(' ') : null,
  };
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
