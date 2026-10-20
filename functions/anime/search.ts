const ANILIST_API_URL = 'https://graphql.anilist.co';

const SEARCH_QUERY = `
  query ($page: Int, $perPage: Int, $search: String) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { total perPage currentPage lastPage hasNextPage }
      media(type: ANIME, isAdult: false, search: $search, sort: POPULARITY_DESC) {
        id idMal title { romaji english native } coverImage { large } bannerImage description averageScore status season seasonYear format duration episodes genres source studios { nodes { name } }
      }
    }
  }
`;

export const onRequestGet = async ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') ?? '';
  const page = url.searchParams.get('page') ?? '1';
  const perPage = url.searchParams.get('per_page') ?? '100';

  try {
    const response = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query: SEARCH_QUERY,
        variables: { page: Number(page), perPage: Number(perPage), search: query || undefined },
      }),
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

    const data = JSON.parse(body);
    const media = data?.data?.Page?.media ?? [];

    return new Response(
      JSON.stringify({
        ok: true,
        data: media,
        pagination: data.data.Page.pageInfo ?? {},
      }),
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
    return new Response(JSON.stringify({ ok: false, error: 'Search proxy error' }), {
      status: 502,
      headers: { 'content-type': 'application/json' },
    });
  }
};
