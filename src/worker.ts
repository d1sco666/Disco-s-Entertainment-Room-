const ANILIST_TOKEN_URL = 'https://anilist.co/api/v2/oauth/token';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

async function handleAnilistToken(request: Request, env: Env): Promise<Response> {
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
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri,
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
      JSON.stringify({ error: 'AniList token exchange failed.' }),
      { status: 502, headers: { 'content-type': 'application/json', ...corsHeaders } },
    );
  }
}

export interface Env {
  ANILIST_CLIENT_ID?: string;
  ANILIST_CLIENT_SECRET?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // AniList token exchange endpoint
    if (url.pathname === '/anilist/token' && request.method === 'POST') {
      return handleAnilistToken(request, env);
    }

    // Fall back to serving static assets (Pages SPA behavior)
    return env.ASSETS?.fetch(request) ?? new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
