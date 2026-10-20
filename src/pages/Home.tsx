import { Link } from 'react-router-dom';
import { MediaCarousel } from '../components/features/MediaCarousel';
import { MediaCard } from '../components/features/MediaCard';
import { useTrendingMovies, useTrendingTVShows, usePopularMovies, usePopularTVShows } from '../hooks/useMedia';
import { useMediaLibrary } from '../hooks/useMediaLibrary';
import type { ContinueWatchingItem, SavedMedia } from '../types';
import { AnimeCard } from '../components/features/AnimeCard';
import { useAnimeLibrary } from '../hooks/useAnimeLibrary';

type LibraryEntry = SavedMedia | ContinueWatchingItem;

function LibraryGrid({
  items,
  emptyMessage,
  removeLabel,
  removeIconOnly = false,
  onRemove,
}: {
  items: LibraryEntry[];
  emptyMessage: string;
  removeLabel: string;
  removeIconOnly?: boolean;
  onRemove: (type: SavedMedia['type'], id: string) => void;
}) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-dark-500 dark:text-dark-400">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8">
      {items.map((entry) => (
        <MediaCard
          key={`${entry.type}-${entry.item.id}`}
          item={entry.item}
          type={entry.type}
          glossySurface
          subtitle={'episode' in entry && entry.episode
            ? `S${entry.episode.seasonNumber.toString().padStart(2, '0')}E${entry.episode.episodeNumber.toString().padStart(2, '0')} · ${entry.episode.name}`
            : undefined}
          onRemove={() => onRemove(entry.type, entry.item.id)}
          removeLabel={removeLabel}
          removeIconOnly={removeIconOnly}
        />
      ))}
    </div>
  );
}

export function Home() {
  const { continueWatching, removeFromContinueWatching } = useMediaLibrary();
  const animeLibrary = useAnimeLibrary();
  const { movies: trendingMovies, loading: trendingMoviesLoading, error: trendingMoviesError } = useTrendingMovies();
  const { shows: trendingShows, loading: trendingShowsLoading, error: trendingShowsError } = useTrendingTVShows();
  const { movies: popularMovies, loading: popularMoviesLoading, error: popularMoviesError } = usePopularMovies();
  const { shows: popularShows, loading: popularShowsLoading, error: popularShowsError } = usePopularTVShows();

  return (
    <div className="relative isolate space-y-12 overflow-hidden bg-app-background pb-16">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none">
        <svg className="absolute right-[8%] top-24 h-12 w-8 text-dark-500/30" viewBox="0 0 32 64" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="16" cy="8" r="6" />
          <path d="M16 14v22m-9-14 9 5 9-5M7 22l-4 11m22-11 4 11M16 36l-8 12m8-12 8 12M8 48l-3 12m3-12 6 2m10-2 3 12m-3-12-6 2" />
          <path d="M13 7h.1M19 7h.1M13 11h6" />
        </svg>
        <svg className="absolute left-[5%] top-[42%] h-10 w-7 text-dark-500/25" viewBox="0 0 32 64" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="16" cy="8" r="6" />
          <path d="M16 14v22m-9-14 9 5 9-5M7 22l-4 11m22-11 4 11M16 36l-8 12m8-12 8 12M8 48l-3 12m3-12 6 2m10-2 3 12m-3-12-6 2" />
          <path d="M13 7h.1M19 7h.1M13 11h6" />
        </svg>
        <svg className="absolute bottom-16 right-[14%] h-14 w-9 text-dark-500/25" viewBox="0 0 32 64" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="16" cy="8" r="6" />
          <path d="M16 14v22m-9-14 9 5 9-5M7 22l-4 11m22-11 4 11M16 36l-8 12m8-12 8 12M8 48l-3 12m3-12 6 2m10-2 3 12m-3-12-6 2" />
          <path d="M13 7h.1M19 7h.1M13 11h6" />
        </svg>
      </div>
      <section aria-labelledby="continue-watching-title" className="deferred-home-section relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-2 flex items-center justify-between">
          <h2 id="continue-watching-title" className="text-2xl font-bold text-dark-900 dark:text-white">Continue Watching</h2>
        </div>
        <p className="mb-5 text-sm text-dark-500 dark:text-dark-400">
          Your recently started titles. Playback progress is not available from the embedded player, so continuing opens the title page.
        </p>
        <LibraryGrid
          items={continueWatching}
          emptyMessage="Start a movie or TV episode and it will appear here."
          removeLabel="Remove from Continue Watching"
          removeIconOnly
          onRemove={removeFromContinueWatching}
        />
        {animeLibrary.continueWatching.length > 0 && (
          <div className="mt-8">
            <h3 className="mb-4 text-lg font-semibold text-dark-900 dark:text-white">Continue Watching Anime</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8">
              {animeLibrary.continueWatching.map((entry) => (
                <AnimeCard
                  key={entry.item.id}
                  item={entry.item}
                  subtitle={`Episode ${entry.episode}`}
                  onRemove={() => animeLibrary.removeFromContinueWatching(entry.item.id)}
                  removeLabel="Remove from Continue Watching"
                />
              ))}
            </div>
          </div>
        )}
        {animeLibrary.storageError && <p className="mt-4 text-sm text-red-400" role="alert">{animeLibrary.storageError}</p>}
      </section>

      <section aria-labelledby="trending-movies-title" className="deferred-home-section relative z-10 mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 id="trending-movies-title" className="text-2xl font-bold text-dark-900 dark:text-white">Trending Movies</h2>
          <Link to="/movies" className="text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium">View All</Link>
        </div>
        <MediaCarousel
          items={trendingMovies}
          type="movie"
          glossyCards
          loading={trendingMoviesLoading}
          error={trendingMoviesError}
          emptyMessage="No trending movies available"
        />
      </section>

      <section aria-labelledby="trending-shows-title" className="deferred-home-section relative z-10 mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 id="trending-shows-title" className="text-2xl font-bold text-dark-900 dark:text-white">Trending TV Shows</h2>
          <Link to="/tv-shows" className="text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium">View All</Link>
        </div>
        <MediaCarousel
          items={trendingShows}
          type="tv"
          glossyCards
          loading={trendingShowsLoading}
          error={trendingShowsError}
          emptyMessage="No trending TV shows available"
        />
      </section>

      <section aria-labelledby="popular-movies-title" className="deferred-home-section relative z-10 mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 id="popular-movies-title" className="text-2xl font-bold text-dark-900 dark:text-white">Popular Movies</h2>
          <Link to="/movies" className="text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium">View All</Link>
        </div>
        <MediaCarousel
          items={popularMovies}
          type="movie"
          glossyCards
          loading={popularMoviesLoading}
          error={popularMoviesError}
          emptyMessage="No popular movies available"
        />
      </section>

      <section aria-labelledby="popular-shows-title" className="deferred-home-section relative z-10 mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 id="popular-shows-title" className="text-2xl font-bold text-dark-900 dark:text-white">Popular TV Shows</h2>
          <Link to="/tv-shows" className="text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium">View All</Link>
        </div>
        <MediaCarousel
          items={popularShows}
          type="tv"
          glossyCards
          loading={popularShowsLoading}
          error={popularShowsError}
          emptyMessage="No popular TV shows available"
        />
      </section>
    </div>
  );
}