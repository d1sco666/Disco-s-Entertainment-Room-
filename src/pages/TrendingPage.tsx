import { MediaGrid } from '../components/features/MediaGrid';
import { useTrendingMovies, useTrendingTVShows } from '../hooks/useMedia';

export function TrendingPage() {
  const { movies, loading: moviesLoading, error: moviesError } = useTrendingMovies();
  const { shows, loading: showsLoading, error: showsError } = useTrendingTVShows();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-900 dark:text-white mb-2">Trending Now</h1>
        <p className="text-dark-500 dark:text-dark-400">What's popular right now</p>
      </div>

      <section aria-labelledby="trending-movies-title" className="mb-12">
        <h2 id="trending-movies-title" className="text-2xl font-bold text-dark-900 dark:text-white mb-6">Trending Movies</h2>
        <MediaGrid
          items={movies}
          type="movie"
          loading={moviesLoading}
          error={moviesError}
          emptyMessage="No trending movies available"
        />
      </section>

      <section aria-labelledby="trending-shows-title">
        <h2 id="trending-shows-title" className="text-2xl font-bold text-dark-900 dark:text-white mb-6">Trending TV Shows</h2>
        <MediaGrid
          items={shows}
          type="tv"
          loading={showsLoading}
          error={showsError}
          emptyMessage="No trending TV shows available"
        />
      </section>
    </div>
  );
}