import { Link } from 'react-router-dom';
import { MediaCarousel } from '../components/features/MediaCarousel';
import { useTrendingMovies, useTrendingTVShows, usePopularMovies, usePopularTVShows } from '../hooks/useMedia';
import { useMediaLibrary } from '../hooks/useMediaLibrary';
import { Button } from '../components/ui/Button';
import { Image } from '../components/ui/Image';
import { Badge } from '../components/ui/Badge';
import { formatRuntime, formatYear } from '../utils/helpers';
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
  const { continueWatching, storageError } = useMediaLibrary();
  const { movies: trendingMovies, loading: trendingMoviesLoading, error: trendingMoviesError } = useTrendingMovies();
  const { shows: trendingShows, loading: trendingShowsLoading, error: trendingShowsError } = useTrendingTVShows();
  const { movies: popularMovies, loading: popularMoviesLoading, error: popularMoviesError } = usePopularMovies();
  const { shows: popularShows, loading: popularShowsLoading, error: popularShowsError } = usePopularTVShows();

  const featured = trendingMovies[0];

  return (
    <div className="relative isolate bg-netflix-dark min-h-screen">
      {/* Decorative background blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none">
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] bg-primary-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] bg-primary-600/10 rounded-full blur-[120px]" />
      </div>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero section */}
        {featured ? (
          <div className="relative mb-8 rounded-xl overflow-hidden shadow-2xl group cursor-pointer" onClick={() => {}}>
            <div className="absolute inset-0">
              <Image
                src={featured.backdrop || featured.poster}
                alt={`${featured.title} backdrop`}
                fallback="/placeholder-backdrop.svg"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-transparent to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-netflix-black/40 to-netflix-black" />
            </div>
            <div className="absolute inset-0 flex items-end p-8 group-hover:bg-black/30 transition-backdrop">
              <div className="mb-4 flex items-center gap-3">
                <Badge variant="primary" size="lg">
                  <span aria-hidden="true">★</span> {featured.rating.toFixed(1)}
                </Badge>
                {featured.ageRating && <span className="text-xs font-medium text-white">{featured.ageRating}</span>}
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 group-hover:text-primary-400 transition-colors">
                {isMovieTitle(featured) ? featured.title : (featured as CineSrcTVShow).name}
              </h1>
              <p className="text-dark-300 dark:text-dark-200 text-lg mb-6 line-clamp-2 max-w-2xl">
                {featured.overview}
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="netflix-button-red px-8 py-3 rounded-lg text-lg font-semibold hover:netflix-button-red-hover transition-colors flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <span className="flex items-center gap-2">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    Play
                  </span>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 py-3 rounded-lg text-lg font-semibold border-white text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  More Info
                </Button>
              </div>
              <div className="mt-4 flex items-center gap-4 text-dark-300 text-sm">
                <span>{isMovieTitle(featured) ? formatRuntime(featured.runtime) : `${(featured as CineSrcTVShow).numberOfSeasons} Seasons`}</span>
                <span aria-hidden="true">•</span>
                <span>{isMovieTitle(featured) ? formatYear(featured.releaseDate) : formatYear((featured as CineSrcTVShow).firstAirDate)}</span>
              </div>
            </div>
            <Link to={isMovieTitle(featured) ? `/movie/${(featured as CineSrcMovie).id}` : `/tv/${(featured as CineSrcTVShow).id}`} className="absolute inset-0 z-20" />
          </div>
        ) : (
          <div className="mb-8 rounded-xl bg-netflix-black border border-netflix-gray p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Featured</h2>
            <p className="text-dark-400">No featured title available right now.</p>
          </div>
        )}

        {continueWatching.length > 0 && (
          <HomeRow
            title="Continue Watching"
            items={continueWatching.map((e) => e.item)}
            type="movie"
            loading={false}
            emptyMessage=""
          />
        )}

        <HomeRow
          title="Trending Movies"
          items={trendingMovies}
          type="movie"
          loading={trendingMoviesLoading}
          error={trendingMoviesError}
          emptyMessage="No trending movies available"
        />

        <HomeRow
          title="Trending TV Shows"
          items={trendingShows}
          type="tv"
          loading={trendingShowsLoading}
          error={trendingShowsError}
          emptyMessage="No trending TV shows available"
        />

        <HomeRow
          title="Popular Movies"
          items={popularMovies}
          type="movie"
          loading={popularMoviesLoading}
          error={popularMoviesError}
          emptyMessage="No popular movies available"
        />

        <HomeRow
          title="Popular TV Shows"
          items={popularShows}
          type="tv"
          loading={popularShowsLoading}
          error={popularShowsError}
          emptyMessage="No popular TV shows available"
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

function isMovieTitle(item: CineSrcMovie | CineSrcTVShow): item is CineSrcMovie {
  return (item as CineSrcMovie).title !== undefined;
}
