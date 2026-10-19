import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MediaCarousel } from '../components/features/MediaCarousel';
import { Image } from '../components/ui/Image';
import { Badge } from '../components/ui/Badge';
import { MediaCard } from '../components/features/MediaCard';
import { usePopularHorrorMovies, useMediaTrailer, useTrendingMovies, useTrendingTVShows, usePopularMovies, usePopularTVShows } from '../hooks/useMedia';
import { useMediaLibrary } from '../hooks/useMediaLibrary';
import type { ContinueWatchingItem, SavedMedia } from '../types';

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
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const { continueWatching, removeFromContinueWatching } = useMediaLibrary();
  const { movies: horrorMovies, loading: horrorMoviesLoading, error: horrorMoviesError } = usePopularHorrorMovies();
  const { movies: trendingMovies, loading: trendingMoviesLoading, error: trendingMoviesError } = useTrendingMovies();
  const { shows: trendingShows, loading: trendingShowsLoading, error: trendingShowsError } = useTrendingTVShows();
  const { movies: popularMovies, loading: popularMoviesLoading, error: popularMoviesError } = usePopularMovies();
  const { shows: popularShows, loading: popularShowsLoading, error: popularShowsError } = usePopularTVShows();

  const featuredMovie = horrorMovies[featuredIndex];
  const { trailerKey, loading: trailerLoading, error: trailerError } = useMediaTrailer('movie', featuredMovie?.tmdbId);
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
      <section aria-labelledby="featured-title" className="relative z-10 mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        {horrorMoviesLoading && (
          <div className="aspect-[21/8.5] min-h-72 bg-black" role="status">
            <span className="sr-only">Loading popular horror titles</span>
          </div>
        )}
        {horrorMoviesError && !featuredMovie && (
          <p className="border border-red-900/50 bg-red-950/20 p-6 text-red-400" role="alert">
            Could not load popular horror titles: {horrorMoviesError}
          </p>
        )}
        {!horrorMoviesLoading && !horrorMoviesError && !featuredMovie && (
          <p className="bg-dark-800 p-6 text-center text-dark-300">
            No popular horror titles are available right now.
          </p>
        )}
        {featuredMovie && (
          <div className="relative grid grid-cols-1 overflow-hidden bg-black" aria-roledescription="carousel" aria-label="Popular horror movies">
            <div className="group relative flex min-h-[24rem] items-center overflow-hidden sm:min-h-[28rem]">
              <Link
                to={`/movie/${featuredMovie.id}`}
                aria-label={`View ${featuredMovie.title}`}
                className="absolute inset-0"
                tabIndex={-1}
              >
                <Image
                  key={featuredMovie.id}
                  src={featuredMovie.backdrop || featuredMovie.backdropOriginal || featuredMovie.poster}
                  alt=""
                  fallback="/placeholder-backdrop.svg"
                  className="h-full w-full scale-[0.95]"
                  loading="eager"
                  fetchPriority="high"
                />
              </Link>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/10" />
              <div className="absolute inset-0 flex items-center p-6 sm:p-10 md:p-14">
                <div className="max-w-3xl">
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <Badge variant="danger">Horror Movie</Badge>
                    <Badge variant="primary" size="lg">
                      <span aria-hidden="true">★</span> {featuredMovie.rating.toFixed(1)}
                    </Badge>
                    <Badge variant="default" size="sm" className="bg-black/70 text-white">
                      {featuredMovie.ageRating || featuredMovie.contentRating || featuredMovie.certification || 'N/A'}
                    </Badge>
                    {featuredMovie.genres.slice(0, 3).map((genre) => (
                      <Badge key={genre} variant="outline" size="sm" className="bg-white/10 text-white border-white/20">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                  <h1 id="featured-title" className="mb-4 text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
                    {featuredMovie.title}
                  </h1>
                  <p className="mb-6 line-clamp-3 max-w-2xl text-base text-white/90 sm:text-lg">
                    {featuredMovie.overview}
                  </p>
                  <Link
                    to={`/movie/${featuredMovie.id}`}
                    className="pointer-events-auto inline-flex items-center rounded-lg bg-primary-600 px-5 py-3 text-base font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    More Info
                  </Link>
                </div>
              </div>
              {horrorMovies.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Previous featured horror movie"
                    onClick={() => setFeaturedIndex((index) => (index - 1 + horrorMovies.length) % horrorMovies.length)}
                    className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white transition-colors hover:bg-black/85 focus:outline-none focus:ring-2 focus:ring-white sm:left-5"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    aria-label="Next featured horror movie"
                    onClick={() => setFeaturedIndex((index) => (index + 1) % horrorMovies.length)}
                    className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/60 p-3 text-white transition-colors hover:bg-black/85 focus:outline-none focus:ring-2 focus:ring-white sm:right-5"
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <p className="absolute bottom-3 right-5 z-10 rounded-full bg-black/60 px-3 py-1 text-sm text-white" aria-live="polite">
                    {featuredIndex + 1} / {horrorMovies.length}
                  </p>
                </>
              )}
            </div>
            <div className="flex justify-center bg-black px-4 py-6 sm:py-8">
              <div className="relative flex aspect-video w-full max-w-2xl items-center justify-center overflow-hidden bg-black">
                {trailerKey ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(trailerKey)}?autoplay=0&controls=1&rel=0`}
                    title={`${featuredMovie.title} trailer`}
                    className="h-full w-full border-0"
                    loading="lazy"
                    allow="encrypted-media; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : (
                  <p className="p-6 text-center text-dark-300" role={trailerError ? 'alert' : 'status'}>
                    {trailerLoading ? 'Finding trailer…' : trailerError ? 'Trailer unavailable' : 'No trailer available'}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

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