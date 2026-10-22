const ANILIST_TOKEN_URL = 'https://anilist.co/api/v2/oauth/token';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
};

export const onRequestPost = async ({ request, env }) => {
  const clientId = env.ANILIST_CLIENT_ID ?? '54461';
  const clientSecret = env.ANILIST_CLIENT_SECRET;

  if (!clientSecret) {
    return new Response(
      JSON.stringify({ error: 'AniList OAuth is not configured on the server.' }),
      { status: 500, headers: { 'content-type': 'application/json', ...corsHeaders } },
    );
  }

  let body: { code?: string; redirect_uri?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request body.' }),
      { status: 400, headers: { 'content-type': 'application/json', ...corsHeaders } },
    );
  }

  const { code, redirect_uri } = body;
  if (!code || !redirect_uri) {
    return new Response(
      JSON.stringify({ error: 'Missing code or redirect_uri.' }),
      { status: 400, headers: { 'content-type': 'application/json', ...corsHeaders } },
    );
  }

  try {
    const response = await fetch(ANILIST_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri,
      }),
    });

    const responseBody = await response.text();
    if (!response.ok) {
      return new Response(responseBody, {
        status: response.status,
        headers: { 'content-type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(responseBody, {
      status: 200,
      headers: { 'content-type': 'application/json', ...corsHeaders },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: 'AniList token exchange failed.' }),
      { status: 502, headers: { 'content-type': 'application/json', ...corsHeaders } },
    );
  }
};
