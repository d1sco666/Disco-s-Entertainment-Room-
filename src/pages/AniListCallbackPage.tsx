import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { anilistAPI } from '../services/anilist';

export function AniListCallbackPage() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const authError = searchParams.get('error');
    if (authError) {
      setError(`AniList authorization was not granted: ${authError}`);
      return;
    }
    if (!code || !state) {
      setError('AniList did not return the authorization code and state.');
      return;
    }
    anilistAPI.completeConnection(code, state)
      .then(() => window.location.replace('/watchlist?anilist=connected'))
      .catch((callbackError: unknown) => {
        setError(callbackError instanceof Error ? callbackError.message : 'Could not finish AniList sign-in.');
      });
  }, [searchParams]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      {error ? (
        <>
          <h1 className="text-2xl font-bold text-white">Could not connect AniList</h1>
          <p className="mt-3 text-red-400" role="alert">{error}</p>
          <Link to="/watchlist" className="mt-6 text-primary-400 hover:underline">Return to Watchlist</Link>
        </>
      ) : (
        <p className="text-dark-300" role="status">Finishing AniList connection…</p>
      )}
    </main>
  );
}
