export const onRequestGet = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const tmdbId = url.searchParams.get('tmdbId');
  const lang = (url.searchParams.get('lang') ?? 'LAT') as 'ESP' | 'LAT' | 'SUB';

  if (!tmdbId) {
    return new Response(JSON.stringify({ ok: false, error: 'tmdbId is required' }), {
      status: 400,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
      },
    });
  }

  // PelisMaster exposes the embed on a separate host; the internal embed id
  // matches the TMDB id for movies (verified against pelismaster.com).
  const embedUrl = `https://api-encrypted.moviemaster.lat/embed/movie/${tmdbId}?lang=${lang}`;

  return new Response(JSON.stringify({ ok: true, embedUrl }), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET',
    },
  });
};