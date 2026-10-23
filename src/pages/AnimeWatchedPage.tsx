import { Link } from 'react-router-dom';
import { AnimeCard } from '../components/features/AnimeCard';
import { useAnimeLibrary } from '../hooks/useAnimeLibrary';
import { HorizontalCarousel } from '../components/features/HorizontalCarousel';

export function AnimeWatchedPage() {
  const animeLibrary = useAnimeLibrary();

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary-400">Your anime history</p>
          <h1 className="text-3xl font-bold text-white">Watched Anime</h1>
        </div>
        <Link to="/anime/watchlist" className="text-sm font-medium text-primary-400 hover:underline">Go to Anime Watchlist</Link>
      </div>

      {animeLibrary.watched.length === 0 ? (
        <p className="border border-dark-800 bg-black px-6 py-12 text-center text-dark-400">
          Nothing marked watched yet. Mark anime as watched from their detail pages.
        </p>
      ) : null}

      {animeLibrary.watched.length > 0 && (
        <section className="mb-10" aria-labelledby="anime-watched-title">
          <h2 id="anime-watched-title" className="mb-5 text-2xl font-bold text-white">Watched Anime</h2>
          <HorizontalCarousel label="Watched Anime">
            {animeLibrary.watched.map(({ item }) => (
              <div className="w-28 flex-none snap-start sm:w-32 lg:w-36" key={`anime-watched-${item.id}`}>
                <AnimeCard
                  item={item}
                  onRemove={() => animeLibrary.removeFromWatched(item.id)}
                  removeLabel="Remove from watched anime"
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
