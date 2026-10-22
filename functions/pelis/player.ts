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

  let embedPath: string;
  if (type === 'tv' && season && episode) {
    embedPath = `/embed/tv/${tmdbId}/${season}/${episode}`;
  } else {
    embedPath = `/embed/movie/${tmdbId}`;
  }

  let embedUrl: string | null = null;

  if (slug) {
    try {
      const pageUrl = `${PELISMASTER_BASE}/${type}/${slug}`;
      const pageRes = await fetch(pageUrl, { headers: { Accept: 'text/html' } });
      if (pageRes.ok) {
        const html = await pageRes.text();
        // Extract data-embed attribute from .player div which contains the full iframe with pass token embedded
        const m = html.match(/class="player"[^>]*data-embed="([^"]*)"/);
        if (m?.[1]) {
          // Parse the iframe src from the data-embed HTML
          const embedMatch = m[1].match(/src="([^"]+)"/);
          if (embedMatch?.[1]) {
            embedUrl = embedMatch[1];
          }
        }
      }
    } catch {
      // page fetch failed, embedUrl stays null
    }
  }

  const finalUrl = new URL(`${EMBED_BASE}${embedPath}?lang=${lang}`);
  if (embedUrl) {
    // If we extracted a URL from data-embed, merge its parameters into the final URL
    const embedParams = new URLSearchParams(new URL(embedUrl).searchParams);
    finalUrl.searchParams.forEach((val, key) => embedParams.set(key, val));
    finalUrl.search = embedParams.toString();
  }

  return new Response(JSON.stringify({ ok: true, embedUrl: finalUrl.toString() }), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET',
    },
  });
};
