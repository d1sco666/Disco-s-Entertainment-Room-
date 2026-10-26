import { Link } from 'react-router-dom';
import { MediaCarousel } from '../components/features/MediaCarousel';
import { useTrendingMovies, useTrendingTVShows, usePopularMovies, usePopularTVShows } from '../hooks/useMedia';
import { useMediaLibrary } from '../hooks/useMediaLibrary';
import type { CineSrcMovie, CineSrcTVShow } from '../types';



function HomeRow({
  title,
  items,
  type,
  loading,
  error,
  emptyMessage,
}: {
  title: string;
  items: (CineSrcMovie | CineSrcTVShow)[];
  type: 'movie' | 'tv';
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
}) {

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="netflix-row-title text-xl font-bold text-white">{title}</h2>
        <Link to={type === 'movie' ? '/movies' : '/tv-shows'} className="text-sm font-medium text-primary-400 hover:text-primary-300">
          Browse All →
        </Link>
      </div>
      <MediaCarousel
        items={items}
        type={type}
        loading={loading}
        error={error}
        emptyMessage={emptyMessage}
        glossyCards
      />
    </section>
  );
}

export function Home() {
  const { continueWatching, watched, watchlist, storageError } = useMediaLibrary();
  const { movies: trendingMovies, loading: trendingMoviesLoading, error: trendingMoviesError } = useTrendingMovies();
  const { shows: trendingShows, loading: trendingShowsLoading, error: trendingShowsError } = useTrendingTVShows();
  const { movies: popularMovies, loading: popularMoviesLoading, error: popularMoviesError } = usePopularMovies();
  const { shows: popularShows, loading: popularShowsLoading, error: popularShowsError } = usePopularTVShows();

  return (
    <div className="relative isolate bg-netflix-dark min-h-screen">
      {/* Decorative background blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none">
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] bg-primary-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] bg-primary-600/10 rounded-full blur-[120px]" />
      </div>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <HomeRow
          title="Continue Watching"
          items={continueWatching.map((e) => e.item)}
          type="movie"
          loading={false}
          emptyMessage=""
        />

        <MediaCarousel
          items={trendingMovies}
          type="movie"
          loading={trendingMoviesLoading}
          error={trendingMoviesError}
          emptyMessage="No trending movies available"
          glossyCards
        />

        <MediaCarousel
          items={trendingShows}
          type="tv"
          loading={trendingShowsLoading}
          error={trendingShowsError}
          emptyMessage="No trending TV shows available"
          glossyCards
        />

        <MediaCarousel
          items={popularMovies}
          type="movie"
          loading={popularMoviesLoading}
          error={popularMoviesError}
          emptyMessage="No popular movies available"
          glossyCards
        />

        <MediaCarousel
          items={popularShows}
          type="tv"
          loading={popularShowsLoading}
          error={popularShowsError}
          emptyMessage="No popular TV shows available"
          glossyCards
        />

        {storageError && <p className="mt-4 text-sm text-red-400" role="alert">{storageError}</p>}

        {watched.length > 0 && (
          <HomeRow
            title="Watched"
            items={watched.map((e) => e.item)}
            type={watched[0]?.type === 'movie' ? 'movie' : 'tv'}
            loading={false}
            emptyMessage=""
          />
        )}

        {watchlist.length > 0 && (
          <HomeRow
            title="Watchlist"
            items={watchlist.map((e) => e.item)}
            type={watchlist[0]?.type === 'movie' ? 'movie' : 'tv'}
            loading={false}
            emptyMessage=""
          />
        )}
      </section>
    </div>
  );
}
