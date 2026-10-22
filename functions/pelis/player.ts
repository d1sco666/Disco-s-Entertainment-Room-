const PELISMASTER_BASE = 'https://pelismaster.com';
const EMBED_BASE = 'https://api-encrypted.moviemaster.lat';

export const onRequestGet = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const tmdbId = url.searchParams.get('tmdbId');
  const type = url.searchParams.get('type') ?? 'movie';
  const season = url.searchParams.get('season');
  const episode = url.searchParams.get('episode');
  const lang = (url.searchParams.get('lang') ?? 'LAT') as 'ESP' | 'LAT' | 'SUB';
  const slug = url.searchParams.get('slug');

  if (!tmdbId) {
    return new Response(JSON.stringify({ ok: false, error: 'tmdbId is required' }), {
      status: 400,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
      },
    });
  }

  // PelisMaster's embed requires a signed pass token from /api/player-pass.
  // We fetch the PelisMaster page server-side to extract the data-pass token,
  // then exchange it for a JWT pass via /api/player-pass.
  let passUrl: string | null = null;
  let embedPath: string;

  if (type === 'tv' && season && episode) {
    embedPath = `/embed/tv/${tmdbId}/${season}/${episode}`;
  } else {
    embedPath = `/embed/movie/${tmdbId}`;
  }

  if (slug) {
    try {
      const pageUrl = `${PELISMASTER_BASE}/${type}/${slug}`;
      const pageRes = await fetch(pageUrl, { headers: { Accept: 'text/html' } });
      if (pageRes.ok) {
        const html = await pageRes.text();
        // data-pass is HTML-encoded: data-pass=&quot;/api/player-pass?t=...&quot;
        const m = html.match(/data-pass=&quot;([^&]*?)&quot;/);
        if (m?.[1]) {
          passUrl = `${PELISMASTER_BASE}${m[1]}`;
        }
      }
    } catch {
      // pass resolution failed, fall through
    }
  }

  let passToken: string | null = null;
  if (passUrl) {
    try {
      const passRes = await fetch(passUrl, { headers: { Accept: 'application/json' } });
      if (passRes.ok) {
        const data = await passRes.json();
        if (data.ok && data.pass) {
          passToken = data.pass;
        }
      }
    } catch {
      // pass exchange failed, fall through
    }
  }

  const embedUrl = new URL(`${EMBED_BASE}${embedPath}?lang=${lang}`);
  if (passToken) embedUrl.searchParams.set('pass', passToken);

  return new Response(JSON.stringify({ ok: true, embedUrl: embedUrl.toString() }), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET',
    },
  });
};