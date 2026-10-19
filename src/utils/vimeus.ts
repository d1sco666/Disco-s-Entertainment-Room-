function createEmbedUrl(path: 'movie' | 'serie', params: Record<string, string>) {
  const viewKey = import.meta.env.VITE_VIMEUS_VIEW_KEY?.trim();
  if (!viewKey) {
    throw new Error('Configure VITE_VIMEUS_VIEW_KEY to enable Vimeus playback.');
  }

  const query = new URLSearchParams({ ...params, view_key: viewKey });
  return `https://vimeus.com/e/${path}?${query.toString()}`;
}

export function getVimeusMovieEmbedUrl(tmdbId?: number) {
  if (!tmdbId || !Number.isSafeInteger(tmdbId)) {
    throw new Error('A TMDB ID is required to open this movie in Vimeus.');
  }

  return createEmbedUrl('movie', { tmdb: String(tmdbId) });
}

export function getVimeusEpisodeEmbedUrl(tmdbId: number | undefined, season: number, episode: number) {
  if (!tmdbId || !Number.isSafeInteger(tmdbId) || !Number.isSafeInteger(season) || season < 1 || !Number.isSafeInteger(episode) || episode < 1) {
    throw new Error('Valid TMDB, season, and episode IDs are required to open this episode in Vimeus.');
  }

  return createEmbedUrl('serie', {
    tmdb: String(tmdbId),
    se: String(season),
    ep: String(episode),
  });
}
