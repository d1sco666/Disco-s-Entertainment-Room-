const ANIKOTO_API_URL = 'https://anikotoapi.site';

const UPSTREAM_HEADERS: HeadersInit = {
  Accept: 'application/json',
  'User-Agent':
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
};

export const onRequestGet = async ({ params }) => {
  const { id } = params as { id?: string };
  if (!id) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing anime id' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const response = await fetch(`${ANIKOTO_API_URL}/series/${encodeURIComponent(id)}`, {
      headers: UPSTREAM_HEADERS,
    });

    const body = await response.text();

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

    return new Response(body, {
      status: response.status,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET',
        'access-control-allow-headers': 'accept',
      },
    });
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Proxy error' }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }
};
