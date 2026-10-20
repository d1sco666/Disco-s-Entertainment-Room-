import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { MediaCard } from '../components/features/MediaCard';
import { useMediaLibrary } from '../hooks/useMediaLibrary';
import { AnimeCard } from '../components/features/AnimeCard';
import { useAnimeLibrary } from '../hooks/useAnimeLibrary';
import { simklAPI } from '../services/simkl';
import { malAPI } from '../services/mal';

export function WatchlistPage() {
  const { watchlist, watched, removeFromWatchlist, replaceWatchlist, replaceWatched } = useMediaLibrary();
  const animeLibrary = useAnimeLibrary();
  const [connected, setConnected] = useState(simklAPI.isConnected());
  const [malConnected, setMalConnected] = useState(malAPI.isConnected());
  const [syncing, setSyncing] = useState(false);
  const [malSyncing, setMalSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const simklRedirectUri = `${window.location.origin}/simkl/callback`;
  const malRedirectUri = `${window.location.origin}/mal/callback`;

  useEffect(() => {
    const updateMalStatus = () => setMalConnected(malAPI.isConnected());
    window.addEventListener('mal-auth-changed', updateMalStatus);
    return () => window.removeEventListener('mal-auth-changed', updateMalStatus);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mal = params.get('mal');
    if (mal === 'connected') {
      setMalConnected(true);
      setSyncMessage('MyAnimeList connected successfully.');
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (mal === 'error') {
      setError(params.get('reason') || 'MyAnimeList connection failed.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const connect = async () => {
    setError(null);
    try {
      await simklAPI.connect();
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : 'Could not connect to Simkl.');
    }
  };

  const connectMal = async () => {
    setError(null);
    try {
      await malAPI.connect();
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : 'Could not connect to MyAnimeList.');
    }
  };

  const sync = async () => {
    setSyncing(true);
    setError(null);
    setSyncMessage(null);
    try {
      const result = await simklAPI.syncLibrary(watchlist, watched);
      replaceWatchlist(result.watchlist);
      replaceWatched(result.watched);
      const animeResult = await simklAPI.syncAnimeLibrary(animeLibrary.watchlist, animeLibrary.watched);
      animeLibrary.replaceWatchlist(animeResult.watchlist);
      animeLibrary.replaceWatched(animeResult.watched);
      setSyncMessage(
        `Sync complete: ${result.imported} imported, ${result.addedToSimkl} added to Simkl, `
        + `${result.removedLocally} removed here, ${result.removedFromSimkl} removed from Simkl.`
        + ` Anime: ${animeResult.imported} imported, ${animeResult.addedToSimkl} added, `
        + `${animeResult.removedLocally} removed here, ${animeResult.removedFromSimkl} removed from Simkl.`
        + (result.skipped ? ` ${result.skipped} movie/TV item(s) could not be matched to TMDB.` : '')
        + (animeResult.skipped ? ` ${animeResult.skipped} anime item(s) could not be matched to MAL metadata.` : '')
      );
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : 'Simkl sync failed.');
      setConnected(simklAPI.isConnected());
    } finally {
      setSyncing(false);
    }
  };

  const syncMal = async () => {
    setMalSyncing(true);
    setError(null);
    setSyncMessage(null);
    try {
      const list = await malAPI.getAnimeList();
      animeLibrary.replaceWatchlist(list.watchlist);
      animeLibrary.replaceWatched(list.watched);
      setSyncMessage(
        `MyAnimeList import complete: ${list.watchlist.length} watchlist, ${list.watched.length} watched.`
      );
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : 'MyAnimeList sync failed.');
      setMalConnected(malAPI.isConnected());
    } finally {
      setMalSyncing(false);
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary-400">Your collection</p>
          <h1 className="text-3xl font-bold text-white">My Watchlist</h1>
        </div>
        <Link to="/" className="text-sm font-medium text-primary-400 hover:underline">
          Back to Home
        </Link>
      </div>
      <section className="mb-10 border border-dark-700 bg-dark-950 p-5" aria-labelledby="simkl-title">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="simkl-title" className="flex items-center gap-2 text-lg font-semibold text-white">
              <a href="https://simkl.com" target="_blank" rel="noopener noreferrer" aria-label="Visit Simkl">
                <img
                  src="https://us.simkl.in/img_favicon/v2/favicon-192x192.png"
                  alt="Simkl"
                  className="h-5 w-5 rounded-sm"
                />
              </a>
              <span>Simkl Sync</span>
            </h2>
            <p className="mt-1 text-sm text-dark-400">
              {connected
                ? 'Connected. Sync your movie, TV, and anime watchlists and watched histories with Simkl.'
                : 'Connect Simkl to sync your movie, TV, and anime watchlists and watched histories.'}
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
          First sync merges libraries. Later syncs mirror removals. Register this exact URI in your Simkl app settings:
          {' '}<code className="break-all text-dark-300">{simklRedirectUri}</code>
        </p>
        <p className="mt-2 text-xs text-dark-500">
          Removing a whole title also removes its Simkl history and rating; removing one watched episode only clears that episode.
        </p>
        <p className="mt-2 text-xs text-dark-500">
          Anime uses MyAnimeList IDs when syncing its watchlist and watched history with Simkl.
        </p>
        {error && <p className="mt-4 text-sm text-red-400" role="alert">{error}</p>}
        {syncMessage && <p className="mt-4 text-sm text-emerald-400" role="status">{syncMessage}</p>}
      </section>
      <section className="mb-10 border border-dark-700 bg-dark-950 p-5 mt-6" aria-labelledby="mal-title">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 id="mal-title" className="flex items-center gap-2 text-lg font-semibold text-white">
              <a href="https://myanimelist.net" target="_blank" rel="noopener noreferrer" aria-label="Visit MyAnimeList">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.5-9c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5zm-7 0c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5zM12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z" />
                </svg>
                <span>MyAnimeList Sync</span>
              </a>
            </h2>
            <p className="mt-1 text-sm text-dark-400">
              {malConnected
                ? 'Connected. Import your MyAnimeList anime watchlist and watched history.'
                : 'Connect MyAnimeList to import your anime watchlist and watched history.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {malConnected ? (
              <>
                <Button onClick={syncMal} disabled={malSyncing}>
                  {malSyncing ? 'Syncing…' : 'Sync MAL list'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    malAPI.disconnect();
                    setMalConnected(false);
                  }}
                >
                  Disconnect
                </Button>
              </>
            ) : (
              <Button onClick={connectMal}>Connect MyAnimeList</Button>
            )}
          </div>
        </div>
        <p className="mt-3 text-xs text-dark-500">
          Register this exact URI in your MyAnimeList app settings: {' '}
          <code className="break-all text-dark-300">{malRedirectUri}</code>
        </p>
        <p className="mt-2 text-xs text-dark-500">
          Imported anime are matched to AniList metadata using their MyAnimeList IDs. Completed, watching, on hold, and
          dropped titles are added to watched; plan-to-watch and watching titles are added to the anime watchlist.
        </p>
        {error && <p className="mt-4 text-sm text-red-400" role="alert">{error}</p>}
      </section>
      {watchlist.length === 0 && animeLibrary.watchlist.length === 0 ? (
        <p className="border border-dark-800 bg-black px-6 py-12 text-center text-dark-400">
          Your watchlist is empty. Add movies, TV shows, or anime from their detail pages.
        </p>
      ) : watchlist.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8">
          {watchlist.map(({ type, item }) => (
            <MediaCard
              key={`${type}-${item.id}`}
              item={item}
              type={type}
              onRemove={() => removeFromWatchlist(type, item.id)}
              removeLabel="Remove from Watchlist"
            />
          ))}
        </div>
      ) : null}
      {animeLibrary.watchlist.length > 0 && (
        <section className="mt-10" aria-labelledby="anime-watchlist-title">
          <h2 id="anime-watchlist-title" className="mb-5 text-2xl font-bold text-white">Anime Watchlist</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8">
            {animeLibrary.watchlist.map((item) => (
              <AnimeCard
                key={item.id}
                item={item}
                onRemove={() => animeLibrary.removeFromWatchlist(item.id)}
                removeLabel="Remove from Anime Watchlist"
              />
            ))}
          </div>
        </section>
      )}
      {animeLibrary.storageError && <p className="mt-4 text-sm text-red-400" role="alert">{animeLibrary.storageError}</p>}
    </div>
  );
}
