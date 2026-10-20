const ANIKOTO_API_URL = 'https://anikotoapi.site';

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
      headers: { Accept: 'application/json' },
    });

    const body = await response.text();
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
