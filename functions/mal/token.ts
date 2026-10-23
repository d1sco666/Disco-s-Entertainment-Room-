const MAL_TOKEN_URL = 'https://api.myanimelist.net/v2/oauth2/token';

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
  const clientId = env.MAL_CLIENT_ID ?? '8d96d1c3e67e9cbeb6acb455a254ebcd';
  const clientSecret = env.MAL_CLIENT_SECRET;

  if (!clientSecret) {
    return new Response(
      JSON.stringify({ error: 'MyAnimeList OAuth is not configured on the server.' }),
      { status: 500, headers: { 'content-type': 'application/json', ...corsHeaders } },
    );
  }

  let body: { code?: string; redirect_uri?: string; refresh_token?: string; grant_type?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request body.' }),
      { status: 400, headers: { 'content-type': 'application/json', ...corsHeaders } },
    );
  }

  const { code, redirect_uri, refresh_token, grant_type } = body;
  if (!grant_type || (!code && !refresh_token)) {
    return new Response(
      JSON.stringify({ error: 'Missing grant_type and code/refresh_token.' }),
      { status: 400, headers: { 'content-type': 'application/json', ...corsHeaders } },
    );
  }

  try {
    const response = await fetch(MAL_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type,
        client_id: clientId,
        client_secret: clientSecret,
        ...(code ? { code, redirect_uri } : { refresh_token }),
      }).toString(),
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
      JSON.stringify({ error: 'MyAnimeList token exchange failed.' }),
      { status: 502, headers: { 'content-type': 'application/json', ...corsHeaders } },
    );
  }
};
