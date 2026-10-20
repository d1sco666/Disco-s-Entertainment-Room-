import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { malAPI } from '../services/mal';

export function MalCallbackPage() {
  const [searchParams] = useSearchParams();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const authError = searchParams.get('error');
    if (authError) {
      window.location.replace(`/watchlist?mal=error&reason=${encodeURIComponent(authError)}`);
      return;
    }
    if (!code || !state) {
      window.location.replace('/watchlist?mal=error&reason=missing_code_or_state');
      return;
    }
    malAPI.completeConnection(code, state)
      .then(() => window.location.replace('/watchlist?mal=connected'))
      .catch(() => window.location.replace('/watchlist?mal=error&reason=token_exchange_failed'));
  }, [searchParams]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <p className="text-dark-300" role="status">Finishing MyAnimeList connection…</p>
    </main>
  );
}
