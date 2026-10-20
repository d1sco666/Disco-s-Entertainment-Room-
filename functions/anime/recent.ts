const ANIKOTO_API_URL = 'https://anikotoapi.site';

export const onRequestGet = async ({ request }) => {
  const url = new URL(request.url);
  const page = url.searchParams.get('page') ?? '1';
  const perPage = url.searchParams.get('per_page') ?? '20';

  try {
    const response = await fetch(`${ANIKOTO_API_URL}/recent-anime?page=${page}&per_page=${perPage}`, {
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
