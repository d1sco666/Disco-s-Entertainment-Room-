import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { AnimeCard } from '../components/features/AnimeCard';
import { useAnimeLibrary } from '../hooks/useAnimeLibrary';
import { HorizontalCarousel } from '../components/features/HorizontalCarousel';
import { simklAPI } from '../services/simkl';

export function AnimeWatchlistPage() {
  const animeLibrary = useAnimeLibrary();
  const [connected, setConnected] = useState(simklAPI.isConnected());
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const connect = async () => {
    setError(null);
    try {
      await simklAPI.connect();
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : 'Could not connect to Simkl.');
    }
  };

  const sync = async () => {
    setSyncing(true);
    setError(null);
    setSyncMessage(null);
    try {
      const result = await simklAPI.syncAnimeLibrary(animeLibrary.watchlist, animeLibrary.watched);
      animeLibrary.replaceWatchlist(result.watchlist);
      animeLibrary.replaceWatched(result.watched);
      setSyncMessage(
        `Anime sync complete: ${result.imported} imported, ${result.addedToSimkl} added to Simkl, `
        + `${result.removedLocally} removed here, ${result.removedFromSimkl} removed from Simkl.`
        + (result.skipped ? ` ${result.skipped} anime item(s) could not be matched to MAL metadata.` : '')
      );
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : 'Simkl anime sync failed.');
      setConnected(simklAPI.isConnected());
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary-400">Your anime collection</p>
          <h1 className="text-3xl font-bold text-white">Anime Watchlist</h1>
        </div>
        <Link to="/anime/watched" className="text-sm font-medium text-primary-400 hover:underline">Go to Watched Anime</Link>
      </div>

      <section className="mb-10 border border-dark-700 bg-dark-950 p-5" aria-labelledby="simkl-anime-title">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="simkl-anime-title" className="flex items-center gap-2 text-lg font-semibold text-white">
              <a href="https://simkl.com" target="_blank" rel="noopener noreferrer" aria-label="Visit Simkl">
                <img
                  src="https://us.simkl.in/img_favicon/v2/favicon-192x192.png"
                  alt="Simkl"
                  className="h-5 w-5 rounded-sm"
                />
                <span>Simkl Sync (Anime)</span>
              </a>
            </h2>
            <p className="mt-1 text-sm text-dark-400">
              {connected
                ? 'Connected. Sync your anime watchlist and watched history with Simkl using MyAnimeList IDs.'
                : 'Connect Simkl to sync your anime watchlist and watched history.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {connected ? (
              <>
                <Button onClick={sync} disabled={syncing}>
                  {syncing ? 'Syncing…' : 'Sync now'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    simklAPI.disconnect();
                    setConnected(false);
                    setSyncMessage(null);
                  }}
                >
                  Disconnect
                </Button>
              </>
            ) : (
              <Button onClick={connect}>Connect Simkl</Button>
            )}
          </div>
        </div>
        <p className="mt-3 text-xs text-dark-500">
          Anime uses MyAnimeList IDs when syncing its watchlist and watched history with Simkl.
        </p>
        {error && <p className="mt-4 text-sm text-red-400" role="alert">{error}</p>}
        {syncMessage && <p className="mt-4 text-sm text-emerald-400" role="status">{syncMessage}</p>}
      </section>

      {animeLibrary.watchlist.length === 0 ? (
        <p className="border border-dark-800 bg-black px-6 py-12 text-center text-dark-400">
          Your anime watchlist is empty. Add anime from their detail pages.
        </p>
      ) : null}

      {animeLibrary.watchlist.length > 0 && (
        <section className="mb-10" aria-labelledby="anime-watchlist-title">
          <h2 id="anime-watchlist-title" className="mb-5 text-2xl font-bold text-white">Anime Watchlist</h2>
          <HorizontalCarousel label="Anime Watchlist">
            {animeLibrary.watchlist.map((item) => (
              <div className="w-28 flex-none snap-start sm:w-32 lg:w-36" key={`anime-watchlist-${item.id}`}>
                <AnimeCard
                  item={item}
                  onRemove={() => animeLibrary.removeFromWatchlist(item.id)}
                  removeLabel="Remove from Anime Watchlist"
                />
              </div>
            ))}
          </HorizontalCarousel>
        </section>
      )}
      {animeLibrary.storageError && <p className="mt-4 text-sm text-red-400" role="alert">{animeLibrary.storageError}</p>}
    </div>
  );
}
