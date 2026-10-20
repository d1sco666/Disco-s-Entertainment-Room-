// anikotoapi.site blocks Cloudflare Worker IPs, so proxy through
// api.allorigins.win, which forwards the request and adds CORS headers.
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const ANIKOTO_API_URL = 'https://anikotoapi.site';

export const onRequestGet = async ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') ?? '';
  const page = url.searchParams.get('page') ?? '1';
  const perPage = url.searchParams.get('per_page') ?? '100';

  const target = encodeURIComponent(
    `${ANIKOTO_API_URL}/recent-anime?page=${page}&per_page=${perPage}`,
  );

  try {
    const response = await fetch(`${CORS_PROXY}${target}`, {
      headers: { Accept: 'application/json' },
    });
    const body = await response.text();
    if (!response.ok) {
      return new Response(body, {
        status: response.status,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
      });
    }

    if (!body || body.trim().length === 0) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: `Anikoto API returned empty response (HTTP ${response.status})`,
        }),
        {
          status: 502,
          headers: {
            'content-type': 'application/json',
            'access-control-allow-origin': '*',
          },
        },
      );
    }

    const data = JSON.parse(body);
    const items = Array.isArray(data.data) ? data.data : [];
    const filtered = query
      ? items.filter((item) => String(item.title ?? '').toLowerCase().includes(query.toLowerCase()))
      : items;

    return new Response(
      JSON.stringify({ ok: true, data: filtered, pagination: data.pagination ?? {} }),
      {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET',
          'access-control-allow-headers': 'accept',
        },
      },
    );
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Proxy error' }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }
};
