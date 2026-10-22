import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { anilistAPI } from '../services/anilist';

export function AniListCallbackPage() {
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    try {
      anilistAPI.completeConnection();
      window.location.replace('/watchlist?anilist=connected');
    } catch (callbackError: unknown) {
      setError(callbackError instanceof Error ? callbackError.message : 'Could not finish AniList sign-in.');
    }
  }, []);

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
