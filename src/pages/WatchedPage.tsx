import { Link } from 'react-router-dom';
import { MediaCard } from '../components/features/MediaCard';
import { useMediaLibrary } from '../hooks/useMediaLibrary';
import { AnimeCard } from '../components/features/AnimeCard';
import { useAnimeLibrary } from '../hooks/useAnimeLibrary';

export function WatchedPage() {
  const { watched, removeFromWatched } = useMediaLibrary();
  const animeLibrary = useAnimeLibrary();

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary-400">Your history</p>
          <h1 className="text-3xl font-bold text-white">Watched</h1>
        </div>
        <Link to="/watchlist" className="text-sm font-medium text-primary-400 hover:underline">Sync with Simkl</Link>
      </div>
      {watched.length === 0 && animeLibrary.watched.length === 0 ? (
        <p className="border border-dark-800 bg-black px-6 py-12 text-center text-dark-400">
          Nothing marked watched yet. Mark movies, TV episodes, or anime from their detail pages.
        </p>
      ) : watched.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8">
          {watched.map((entry) => (
            <MediaCard
              key={`${entry.type}-${entry.item.id}-${entry.episode ? `${entry.episode.seasonNumber}-${entry.episode.episodeNumber}` : 'complete'}`}
              item={entry.item}
              type={entry.type}
              subtitle={entry.episode
                ? `S${entry.episode.seasonNumber.toString().padStart(2, '0')}E${entry.episode.episodeNumber.toString().padStart(2, '0')} · ${entry.episode.name}`
                : 'Watched'}
              onRemove={() => removeFromWatched(entry.type, entry.item.id, entry.episode)}
              removeLabel="Remove from watched history"
            />
          ))}
        </div>
      ) : null}
      {animeLibrary.watched.length > 0 && (
        <section className="mt-10" aria-labelledby="anime-watched-title">
          <h2 id="anime-watched-title" className="mb-5 text-2xl font-bold text-white">Watched Anime</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8">
            {animeLibrary.watched.map(({ item }) => (
              <AnimeCard
                key={item.malId}
                item={item}
                onRemove={() => animeLibrary.removeFromWatched(item.malId)}
                removeLabel="Remove from watched anime"
              />
            ))}
          </div>
        </section>
      )}
      {animeLibrary.storageError && <p className="mt-4 text-sm text-red-400" role="alert">{animeLibrary.storageError}</p>}
    </div>
  );
}
