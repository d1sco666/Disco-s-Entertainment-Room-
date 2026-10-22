export type DubLanguage = 'en' | 'es' | 'ESP' | 'LAT' | 'SUB';

const PELISMASTER_FUNCTION = '/api/pelis/player';

export function slugify(title: string, year?: number): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')    // non-alphanum → hyphen
    .replace(/^-+|-+$/g, '');       // trim leading/trailing hyphens
  return year ? `${base}-${year}` : base;
}

async function fetchPelisMasterEmbed(params: {
  tmdbId: number;
  type: 'movie' | 'tv';
  season?: number;
  episode?: number;
  lang: DubLanguage;
  slug?: string;
}): Promise<string> {
  const qs = new URLSearchParams({
    tmdbId: String(params.tmdbId),
    type: params.type,
    lang: params.lang,
    ...(params.slug ? { slug: params.slug } : {}),
    ...(params.type === 'tv' && params.season && params.episode
      ? { season: String(params.season), episode: String(params.episode) }
      : {}),
  });
  const res = await fetch(`${PELISMASTER_FUNCTION}?${qs.toString()}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`PelisMaster function error (HTTP ${res.status})`);
  const data = await res.json();
  if (!data.ok || !data.embedUrl) {
    throw new Error(data.error || 'PelisMaster could not resolve embed URL');
  }
  return data.embedUrl;
}

export function getPelisMasterMovieEmbedUrl(tmdbId?: number, lang: DubLanguage = 'LAT', slug?: string) {
  if (!tmdbId || !Number.isSafeInteger(tmdbId) || tmdbId < 1) {
    throw new Error('A valid TMDB ID is required to open this title.');
  }
  return fetchPelisMasterEmbed({ tmdbId, type: 'movie', lang, slug });
}

export function getPelisMasterEpisodeEmbedUrl(tmdbId?: number, season?: number, episode?: number, lang: DubLanguage = 'LAT', slug?: string) {
  if (!tmdbId || !Number.isSafeInteger(tmdbId) || tmdbId < 1) {
    throw new Error('A valid TMDB ID is required to open this title.');
  }
  if (!season || !Number.isSafeInteger(season) || season < 1) {
    throw new Error('Valid season and episode numbers are required to open this episode.');
  }
  if (!episode || !Number.isSafeInteger(episode) || episode < 1) {
    throw new Error('Valid season and episode numbers are required to open this episode.');
  }
  return fetchPelisMasterEmbed({ tmdbId, type: 'tv', season, episode, lang, slug });
}

function validateMediaIds(tmdbId: number | undefined, season?: number, episode?: number) {
  if (!tmdbId || !Number.isSafeInteger(tmdbId) || tmdbId < 1) {
    throw new Error('A valid TMDB ID is required to open this title.');
  }

  if (
    (season !== undefined && (!Number.isSafeInteger(season) || season < 1)) ||
    (episode !== undefined && (!Number.isSafeInteger(episode) || episode < 1))
  ) {
    throw new Error('Valid season and episode numbers are required to open this episode.');
  }
}

export function getVidstuckMovieEmbedUrl(tmdbId?: number) {
  validateMediaIds(tmdbId);
  return `https://vidstuck.cc/embed/movie/${tmdbId}`;
}

export function getVidstuckEpisodeEmbedUrl(tmdbId: number | undefined, season: number, episode: number) {
  validateMediaIds(tmdbId, season, episode);
  return `https://vidstuck.cc/embed/tv/${tmdbId}/${season}/${episode}`;
}

export function getZxcstreamMoviePlayerUrl(tmdbId: number | undefined, dubLanguage: DubLanguage) {
  validateMediaIds(tmdbId);
  const url = new URL(`https://zxcstream.cc/player/movie/${tmdbId}`);
  url.searchParams.set('dubLang', dubLanguage);
  return url.toString();
}

export function getZxcstreamEpisodePlayerUrl(
  tmdbId: number | undefined,
  season: number,
  episode: number,
  dubLanguage: DubLanguage
) {
  validateMediaIds(tmdbId, season, episode);
  const url = new URL(`https://zxcstream.cc/player/tv/${tmdbId}/${season}/${episode}`);
  url.searchParams.set('dubLang', dubLanguage);
  return url.toString();
}
