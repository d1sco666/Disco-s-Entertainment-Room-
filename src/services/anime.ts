import type { AnimeTitle } from '../types';

const ANIKOTO_API_URL = '/anime';

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

function mapAnimeTitle(raw: unknown): AnimeTitle {
  const a = raw as Record<string, unknown>;
  const terms = a['terms_by_type'] as Record<string, string[]> | undefined;

  return {
    id: String(a['id'] ?? ''),
    title: String(a['title'] ?? ''),
    alternative: a['alternative'] ? String(a['alternative']) : undefined,
    native: a['native'] ? String(a['native']) : undefined,
    slug: a['slug'] ? String(a['slug']) : undefined,
    year: a['year'] ? Number(a['year']) || 0 : 0,
    overview: a['description'] ? String(a['description']) : '',
    poster: a['poster'] ? String(a['poster']) : '',
    backdrop: a['background_image'] ? String(a['background_image']) : undefined,
    score: a['score'] ? Number(a['score']) || 0 : 0,
    status: a['status'] ? String(a['status']) : 'Unknown',
    season: a['season'] ? String(a['season']) : undefined,
    source: a['source'] ? String(a['source']) : undefined,
    duration: a['duration'] ? String(a['duration']) : undefined,
    rating: a['rating'] ? String(a['rating']) : undefined,
    episodes: a['episodes'] ? Number(a['episodes']) || 0 : 0,
    genres: Array.isArray(terms?.genre) ? terms.genre : [],
    studios: Array.isArray(terms?.studios) ? terms.studios : [],
    isSub: a['is_sub'] === 3 || a['is_sub'] === 1 || a['is_sub'] === true,
    isDub: a['is_dub'] === 3 || a['is_dub'] === 1 || a['is_dub'] === true,
    malId: a['mal_id'] ? Number(a['mal_id']) : undefined,
    aniId: a['ani_id'] ? Number(a['ani_id']) : undefined,
    sId: a['s_id'] ? Number(a['s_id']) : undefined,
  };
}

function mapAnimeEpisode(raw: unknown): AnimeEpisode {
  const e = raw as Record<string, unknown>;
  const embedUrl = e['embed_url'] as Record<string, string> | undefined;
  return {
    id: e['id'] ? Number(e['id']) : 0,
    title: e['title'] ? String(e['title']) : 'Episode',
    jpTitle: e['jp_title'] ? String(e['jp_title']) : undefined,
    number: e['number'] ? Number(e['number']) : 0,
    episodeEmbedId: e['episode_embed_id'] ? Number(e['episode_embed_id']) : undefined,
    subUrl: embedUrl?.sub,
    dubUrl: embedUrl?.dub,
  };
}

async function anikotoGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${ANIKOTO_API_URL}${path}`, { signal });
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
    let detail = `HTTP ${response.status}`;
    const errors = (body as { errors?: { detail?: string }[] } | null)?.errors;
    if (errors && errors.length > 0) {
      detail = errors.map((e) => e.detail).join('; ');
    }
    throw new Error(`Anikoto API error ${response.status}: ${detail}`);
  }
  if (body === null) {
    throw new Error('Anikoto API returned an empty response.');
  }
  return body as T;
}

export async function fetchRecentAnime(
  page = 1,
  perPage = 20,
  signal?: AbortSignal
): Promise<AnimeListResult> {
  const body = await anikotoGet<{
    ok: boolean;
    data: unknown[];
    pagination: { page: number; per_page: number; total: number; total_pages: number };
  }>(`/recent?page=${page}&per_page=${perPage}`, signal);

  return {
    items: (body.data ?? []).map(mapAnimeTitle),
    page: body.pagination.page,
    perPage: body.pagination.per_page,
    total: body.pagination.total,
    totalPages: body.pagination.total_pages,
  };
}

export async function fetchAnimeSeries(id: string | number, signal?: AbortSignal): Promise<AnimeSeriesResult> {
  const body = await anikotoGet<{
    ok: boolean;
    data: { anime: unknown; episodes: unknown[] };
  }>(`/${id}`, signal);

  return {
    anime: mapAnimeTitle(body.data.anime),
    episodes: (body.data.episodes ?? []).map(mapAnimeEpisode),
  };
}

export function getEpisodeUrl(episode: AnimeEpisode, language: 'sub' | 'dub'): string {
  return language === 'dub' && episode.dubUrl ? episode.dubUrl : episode.subUrl ?? '';
}
