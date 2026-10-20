// anikotoapi.site blocks Cloudflare Worker IPs, so proxy through
// api.allorigins.win, which forwards the request and adds CORS headers.
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
const ANIKOTO_API_URL = 'https://anikotoapi.site';

export const onRequestGet = async ({ params }) => {
  const { id } = params as { id?: string };
  if (!id) {
    return new Response(JSON.stringify({ ok: false, error: 'Missing anime id' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const target = encodeURIComponent(`${ANIKOTO_API_URL}/series/${encodeURIComponent(id)}`);

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
