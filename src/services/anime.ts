import type { AnimeTitle } from '../types';

const KITSU_API_URL = 'https://kitsu.io/api/edge';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export const animeGenres = [
  { id: 'action', name: 'Action' },
  { id: 'adventure', name: 'Adventure' },
  { id: 'comedy', name: 'Comedy' },
  { id: 'drama', name: 'Drama' },
  { id: 'ecchi', name: 'Ecchi' },
  { id: 'fantasy', name: 'Fantasy' },
  { id: 'horror', name: 'Horror' },
  { id: 'mystery', name: 'Mystery' },
  { id: 'romance', name: 'Romance' },
  { id: 'science-fiction', name: 'Sci-Fi' },
  { id: 'slice-of-life', name: 'Slice of Life' },
  { id: 'sports', name: 'Sports' },
  { id: 'supernatural', name: 'Supernatural' },
  { id: 'thriller', name: 'Thriller' },
  { id: 'psychological', name: 'Psychological' },
  { id: 'mecha', name: 'Mecha' },
  { id: 'music', name: 'Music' },
];

export const animeAgeRatings = [
  { value: '', label: 'All ages' },
  { value: 'G', label: 'G - All ages' },
  { value: 'PG', label: 'PG - Children' },
  { value: 'R', label: 'R - 17+ (violence & profanity)' },
];

export interface AnimeSearchFilters {
  genreIds: string[];
  ageRating: string;
  sortBy: 'popular' | 'top_rated';
  year: number | null;
  format: string | null;
}

export interface AnimeTitlesResult {
  items: AnimeTitle[];
  page: number;
  hasMore: boolean;
  warning: string | null;
}

export interface AnimeDetailsResult {
  item: AnimeTitle;
  warning: string | null;
}

interface KitsuImageAttributes {
  tiny?: string;
  small?: string;
  medium?: string;
  large?: string;
  original?: string;
}

interface KitsuAnimeAttributes {
  slug: string;
  titles: { en?: string; en_jp?: string; ja_jp?: string } | null;
  canonicalTitle: string;
  synopsis: string | null;
  coverImage: KitsuImageAttributes | null;
  posterImage: KitsuImageAttributes | null;
  averageRating: string | null;
  ageRating: string | null;
  ageRatingGuide: string | null;
  subtype: string | null;
  status: string | null;
  episodeCount: number | null;
  startDate: string | null;
  nsfw: boolean;
  popularityRank: number | null;
  ratingRank: number | null;
  youtubeVideoId: string | null;
}

interface KitsuMappingAttributes {
  externalSite: string;
  externalId: string;
}

interface KitsuCategoryAttributes {
  title: string;
  slug: string;
}

interface KitsuIncludedResource {
  id: string;
  type: string;
  attributes?: KitsuMappingAttributes | KitsuCategoryAttributes;
}

interface KitsuAnimeResource {
  id: string;
  type: 'anime';
  attributes: KitsuAnimeAttributes;
  relationships?: {
    mappings?: { data: { id: string; type: 'mappings' }[] };
    categories?: { data: { id: string; type: 'categories' }[] };
  };
}

interface KitsuCollectionResponse {
  data: KitsuAnimeResource[];
  meta?: { count: number };
  included?: KitsuIncludedResource[];
}

interface KitsuSingleResponse {
  data: KitsuAnimeResource;
  included?: KitsuIncludedResource[];
}

function buildKitsuUrl(endpoint: string, params: Record<string, string | string[] | undefined> = {}): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => searchParams.append(key, v));
    } else {
      searchParams.append(key, String(value));
    }
  }
  return `${KITSU_API_URL}${endpoint}?${searchParams.toString()}`;
}

async function kitsuRequest<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as { errors?: { detail?: string; title?: string }[] };
      if (body.errors && body.errors.length > 0) {
        detail = body.errors.map((e) => e.detail ?? e.title).join('; ');
      }
    } catch {
      // ignore body parse errors
    }
    throw new Error(`Kitsu API error ${response.status}: ${detail}`);
  }
  return response.json() as Promise<T>;
}

function safeNumber(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapKitsuStatus(status: string | null): string {
  switch (status) {
    case 'current': return 'Ongoing';
    case 'finished': return 'Completed';
    case 'upcoming': return 'Not yet aired';
    case 'tba': return 'TBA';
    default: return status ?? 'Unknown';
  }
}

function imageUrl(image: KitsuImageAttributes | null, sizes: Array<keyof KitsuImageAttributes>): string {
  if (!image) return '';
  for (const size of sizes) {
    if (image[size]) return image[size];
  }
  return '';
}

function extractExternalIds(anime: KitsuAnimeResource, included: KitsuIncludedResource[] = []): { malId?: number; aniListId?: number } {
  // Join per item through relationships.mappings.data -> included map.
  // NEVER scan `included` globally: that would give every anime the same MAL id.
  const mappingIds = new Set((anime.relationships?.mappings?.data ?? []).map((ref) => ref.id));
  let malId: number | undefined;
  let aniListId: number | undefined;
  for (const resource of included) {
    if (resource.type !== 'mappings') continue;
    if (!mappingIds.has(resource.id)) continue;
    if (resource.attributes === undefined || !('externalId' in resource.attributes)) continue;
    const parsed = Number(resource.attributes.externalId);
    if (!Number.isSafeInteger(parsed) || parsed <= 0) continue;
    if (resource.attributes.externalSite === 'myanimelist/anime' && !malId) malId = parsed;
    if (resource.attributes.externalSite === 'anilist' && !aniListId) aniListId = parsed;
  }
  return { malId, aniListId };
}

function extractGenres(anime: KitsuAnimeResource, included: KitsuIncludedResource[] = []): { id: string; name: string }[] {
  // Join per item through relationships.categories.data -> included map.
  const categoryIds = new Set((anime.relationships?.categories?.data ?? []).map((ref) => ref.id));
  const genres = new Map<string, string>();
  for (const resource of included) {
    if (resource.type !== 'categories') continue;
    if (!categoryIds.has(resource.id)) continue;
    if (resource.attributes === undefined || !('slug' in resource.attributes)) continue;
    const existing = genres.get(resource.attributes.slug);
    if (!existing) {
      genres.set(resource.attributes.slug, resource.attributes.title);
    }
  }
  return Array.from(genres.entries()).map(([id, name]) => ({ id, name }));
}

function formatToKitsuSubtype(format: string): string {
  switch (format.toUpperCase()) {
    case 'TV': return 'TV';
    case 'MOVIE': return 'movie';
    case 'OVA': return 'OVA';
    case 'ONA': return 'ONA';
    case 'SPECIAL': return 'special';
    case 'MUSIC': return 'music';
    default: return format;
  }
}

async function discoverAnimeCore(filters: AnimeSearchFilters, page: number, signal?: AbortSignal): Promise<AnimeTitlesResult> {
  const params: Record<string, string | string[] | undefined> = {
    'page[limit]': String(24),
    'page[offset]': String((page - 1) * 24),
    'include': 'mappings,categories',
    'fields[anime]': 'slug,titles,canonicalTitle,posterImage,coverImage,averageRating,ageRating,ageRatingGuide,status,subtype,episodeCount,startDate,synopsis,nsfw,popularityRank,ratingRank,youtubeVideoId,mappings,categories',
    'fields[mappings]': 'externalSite,externalId',
    'fields[categories]': 'title,slug',
  };

  if (filters.genreIds.length > 0) {
    params['filter[categories]'] = filters.genreIds.join(',');
  }
  if (filters.ageRating) {
    params['filter[ageRating]'] = filters.ageRating.toUpperCase();
  }
  if (filters.year) {
    params['filter[year]'] = String(filters.year);
  }
  if (filters.format) {
    params['filter[subtype]'] = formatToKitsuSubtype(filters.format);
  }
  if (filters.sortBy === 'popular') {
    params.sort = 'popularityRank';
  } else if (filters.sortBy === 'top_rated') {
    params.sort = '-averageRating';
  }

  const url = buildKitsuUrl('/anime', params);
  const warnings: string[] = [];
  let result: KitsuCollectionResponse;
  try {
    result = await kitsuRequest<KitsuCollectionResponse>(url, signal);
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error(error instanceof Error ? error.message : 'Anime discovery failed.');
  }

  const included = result.included ?? [];
  const items = result.data.map((anime) => mapKitsuAnime(anime, included));
  const malIds = items.map((item) => item.malId).filter((id): id is number => typeof id === 'number' && id > 0);

  let availability = new Map<number, boolean>();
  try {
    availability = await getAniPmAvailability(malIds, signal);
  } catch (error) {
    if (signal?.aborted) throw error;
    warnings.push(error instanceof Error ? error.message : 'Ani.pm availability could not be checked.');
  }

  const total = result.meta?.count ?? 0;
  const hasMore = page * 24 < total;
  return {
    items: items.map((item) => ({ ...item, aniPmAvailable: item.malId === undefined ? undefined : availability.get(item.malId) })),
    page,
    hasMore,
    warning: warnings.length > 0 ? warnings.join(' ') : null,
  };
}

export async function discoverAnime(filters: AnimeSearchFilters, page: number, signal?: AbortSignal): Promise<AnimeTitlesResult> {
  return discoverAnimeCore(filters, page, signal);
}

export async function searchAnime(query: string, signal?: AbortSignal): Promise<AnimeTitlesResult> {
  const url = buildKitsuUrl('/anime', {
    'page[limit]': String(24),
    'filter[text]': query,
    'include': 'mappings,categories',
    'fields[anime]': 'slug,titles,canonicalTitle,posterImage,coverImage,averageRating,ageRating,ageRatingGuide,status,subtype,episodeCount,startDate,synopsis,nsfw,popularityRank,ratingRank,youtubeVideoId,mappings,categories',
    'fields[mappings]': 'externalSite,externalId',
    'fields[categories]': 'title,slug',
  });

  const warnings: string[] = [];
  let result: KitsuCollectionResponse;
  try {
    result = await kitsuRequest<KitsuCollectionResponse>(url, signal);
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error(error instanceof Error ? error.message : 'Anime search failed.');
  }

  const included = result.included ?? [];
  const items = result.data.map((anime) => mapKitsuAnime(anime, included));
  const malIds = items.map((item) => item.malId).filter((id): id is number => typeof id === 'number' && id > 0);

  let availability = new Map<number, boolean>();
  try {
    availability = await getAniPmAvailability(malIds, signal);
  } catch (error) {
    if (signal?.aborted) throw error;
    warnings.push(error instanceof Error ? error.message : 'Ani.pm availability could not be checked.');
  }

  return {
    items: items.map((item) => ({ ...item, aniPmAvailable: item.malId === undefined ? undefined : availability.get(item.malId) })),
    page: 1,
    hasMore: false,
    warning: warnings.length > 0 ? warnings.join(' ') : null,
  };
}

export async function getAnimeDetails(kitsuId: string, signal?: AbortSignal): Promise<AnimeDetailsResult> {
  const url = buildKitsuUrl('/anime/{id}', {
    'include': 'mappings,categories',
    'fields[anime]': 'slug,titles,canonicalTitle,posterImage,coverImage,averageRating,ageRating,ageRatingGuide,status,subtype,episodeCount,startDate,synopsis,nsfw,popularityRank,ratingRank,youtubeVideoId,mappings,categories',
    'fields[mappings]': 'externalSite,externalId',
    'fields[categories]': 'title,slug',
  }).replace('{id}', kitsuId);

  const warnings: string[] = [];
  let result: KitsuSingleResponse;
  try {
    result = await kitsuRequest<KitsuSingleResponse>(url, signal);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch anime details from Kitsu.');
  }

  const item = mapKitsuAnime(result.data, result.included ?? []);
  const malId = item.malId;

  // ani.pm is the only place MAL/AniList ids are consumed (by design).
  let aniPmAvailable: boolean | undefined;
  let aniPmEpisodes: { total: number; sub: number; dub: number } | undefined;
  let aniPmAniListId: number | undefined;

  if (malId) {
    try {
      const lookup = await getAniPmLookup([malId], signal);
      const entry = lookup.get(malId);
      if (entry) {
        aniPmAvailable = entry.available;
        aniPmEpisodes = entry.episodes;
        aniPmAniListId = entry.anilistId;
      }
    } catch (error) {
      warnings.push(error instanceof Error ? error.message : 'Ani.pm availability could not be checked.');
    }
  }

  return {
    item: { ...item, aniPmAvailable, aniPmEpisodes, aniPmAniListId },
    warning: warnings.length > 0 ? warnings.join(' ') : null,
  };
}

export function getAniPmEmbedUrl(item: AnimeTitle, episode: number, language: 'sub' | 'dub'): string {
  if (!Number.isSafeInteger(episode) || episode < 1) {
    throw new Error('Choose a valid anime episode to play.');
  }
  const source = item.aniPmAniListId ?? item.aniListId ?? item.malId;
  if (!source) {
    throw new Error('No MAL/AniList id available for this anime.');
  }
  return `https://ani.pm/embed/ani/${source}/${episode}/${language}`;
}

interface AniPmLookupEntry {
  query?: { mal?: string };
  available?: boolean;
  anilistId?: number;
  malId?: number;
  episodes?: { total: number; sub: number; dub: number };
}

interface AniPmLookupResponse {
  data?: AniPmLookupEntry[];
}

function fetchAniPm(malIds: number[], signal?: AbortSignal): Promise<Response> {
  return fetch(buildAniPmUrl(malIds), {
    signal,
    headers: {
      'Accept': 'application/json',
      'User-Agent': USER_AGENT,
      'Referer': 'https://ani.pm/',
    },
  });
}

async function parseAniPm(response: Response): Promise<AniPmLookupResponse> {
  if (!response.ok) {
    throw new Error(`Ani.pm returned HTTP ${response.status}`);
  }
  return response.json() as Promise<AniPmLookupResponse>;
}

function buildAniPmUrl(malIds: number[]): string {
  return `https://ani.pm/api/partner/v1/lookup?mal=${malIds.join(',')}`;
}

export async function getAniPmAvailability(malIds: number[], signal?: AbortSignal): Promise<Map<number, boolean>> {
  if (malIds.length === 0) return new Map();
  const entries = await parseAniPm(await fetchAniPm(malIds, signal));
  const availability = new Map<number, boolean>();
  for (const entry of entries.data ?? []) {
    availability.set(entry.malId ?? entry.anilistId ?? 0, entry.available ?? false);
  }
  return availability;
}

export async function getAniPmLookup(malIds: number[], signal?: AbortSignal): Promise<Map<number, { available: boolean; anilistId?: number; malId?: number; episodes?: { total: number; sub: number; dub: number } }>> {
  if (malIds.length === 0) return new Map();
  const entries = await parseAniPm(await fetchAniPm(malIds, signal));
  const lookup = new Map<number, { available: boolean; anilistId?: number; malId?: number; episodes?: { total: number; sub: number; dub: number } }>();
  for (const entry of entries.data ?? []) {
    lookup.set(entry.malId ?? entry.anilistId ?? 0, { available: entry.available ?? false, anilistId: entry.anilistId, malId: entry.malId, episodes: entry.episodes });
  }
  return lookup;
}

function mapKitsuAnime(anime: KitsuAnimeResource, included: KitsuIncludedResource[] = []): AnimeTitle {
  const { malId, aniListId } = extractExternalIds(anime, included);
  const ageRating = anime.attributes.ageRating ?? '';
  const year = safeNumber(anime.attributes.startDate)?.toString().slice(0, 4) ?? 0;
  const score = anime.attributes.averageRating ? Number(anime.attributes.averageRating) / 10 : 0;

  return {
    id: anime.id,
    malId,
    aniListId,
    title: anime.attributes.canonicalTitle,
    titleJapanese: anime.attributes.titles?.ja_jp ?? anime.attributes.titles?.en_jp ?? '',
    year: Number(year),
    overview: anime.attributes.synopsis ?? '',
    poster: imageUrl(anime.attributes.posterImage, ['medium', 'small', 'large', 'original']),
    banner: imageUrl(anime.attributes.coverImage, ['large', 'medium', 'small', 'original']),
    score,
    ageRating,
    ageRatingGuide: anime.attributes.ageRatingGuide ?? '',
    genres: extractGenres(anime, included).map((g) => g.name),
    format: anime.attributes.subtype ?? null,
    episodes: anime.attributes.episodeCount ?? 0,
    status: mapKitsuStatus(anime.attributes.status),
    malUrl: malId ? `https://myanimelist.net/anime/${malId}` : '',
    aniListUrl: aniListId ? `https://anilist.co/anime/${aniListId}` : '',
    aniPmAvailable: undefined,
  };
}
