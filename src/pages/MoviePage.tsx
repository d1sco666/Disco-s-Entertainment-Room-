import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PlaybackDialog } from '../components/features/PlaybackDialog';
import { TrailerPlayer } from '../components/features/TrailerPlayer';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Image } from '../components/ui/Image';
import { Badge } from '../components/ui/Badge';
import { useMediaTrailer, useMovieDetails } from '../hooks/useMedia';
import { useMediaLibrary } from '../hooks/useMediaLibrary';
import { formatYear, formatRuntime, formatDate } from '../utils/helpers';
import { getVimeusMovieEmbedUrl } from '../utils/vimeus';

export function MoviePage() {
  const { id } = useParams<{ id: string }>();
  const { movie, loading, error } = useMovieDetails(id!);
  const trailer = useMediaTrailer('movie', movie?.tmdbId);
  const { addToContinueWatching, toggleWatchlist, isInWatchlist, isWatched, markWatched, removeFromWatched } = useMediaLibrary();

  const [showPlayer, setShowPlayer] = useState(false);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card><CardContent className="aspect-video" /></Card>
            <Card><CardContent className="space-y-4"><div className="h-6 w-3/4" /><div className="h-4 w-1/2" /><div className="h-4 w-1/3" /></CardContent></Card>
          </div>
          <Card><CardContent className="aspect-[2/3]" /></Card>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 text-center">
        <svg className="mx-auto h-16 w-16 text-dark-300 dark:text-dark-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h1 className="text-2xl font-bold text-dark-900 dark:text-white mb-2">Movie Not Found</h1>
        <p className="text-dark-500 dark:text-dark-400 mb-6">{error || 'The movie you\'re looking for doesn\'t exist.'}</p>
        <Link to="/movies"><Button>Browse Movies</Button></Link>
      </div>
    );
  }

  const cinesrcEmbedUrl = movie.tmdbId
    ? `https://cinesrc.st/embed/movie/${encodeURIComponent(String(movie.tmdbId))}`
    : null;
  const isSaved = isInWatchlist('movie', movie.id);
  const hasWatched = isWatched('movie', movie.id);
  const ageRating = movie.ageRating || movie.contentRating || movie.certification || 'N/A';

  return (
    <div className="min-h-screen">
      <PlaybackDialog
        isOpen={showPlayer}
        itemKey={`movie:${movie.id}`}
        title={movie.title}
        providers={[
          {
            id: 'vimeus',
            name: 'Vimeus',
            getSrc: () => getVimeusMovieEmbedUrl(movie.tmdbId),
            unavailableReason: !movie.tmdbId ? 'A TMDB ID is required' : undefined,
          },
          {
            id: 'cinesrc',
            name: 'CineSrc',
            getSrc: () => {
              if (!cinesrcEmbedUrl) throw new Error('A TMDB ID is required to open this movie in CineSrc.');
              return cinesrcEmbedUrl;
            },
            unavailableReason: !cinesrcEmbedUrl ? 'A TMDB ID is required' : undefined,
          },
        ]}
        onClose={() => setShowPlayer(false)}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-dark-500 dark:text-dark-400">
            <li><Link to="/" className="hover:text-primary-600 dark:hover:text-primary-400">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link to="/movies" className="hover:text-primary-600 dark:hover:text-primary-400">Movies</Link></li>
            <li aria-hidden="true">/</li>
            <li className="text-dark-900 dark:text-white truncate max-w-xs" aria-current="page">{movie.title}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="relative aspect-[2/3] w-full sm:w-72 flex-shrink-0 rounded-xl overflow-hidden">
                <Image
                  src={movie.poster}
                  alt={`${movie.title} poster`}
                  fallback="/placeholder-poster.svg"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <Badge variant="primary" size="lg"><span aria-hidden="true">★</span> {movie.rating.toFixed(1)}</Badge>
                </div>
                <div className="absolute top-3 right-3">
                  <Badge variant="default" className="bg-black/70 text-white" aria-label={`Age rating ${ageRating}`}>{ageRating}</Badge>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="primary" size="lg">{movie.rating.toFixed(1)}</Badge>
                  <span className="text-dark-500 dark:text-dark-400">({movie.voteCount || 'N/A'} votes)</span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-dark-900 dark:text-white">{movie.title}</h1>
                <p className="text-dark-500 dark:text-dark-400">{formatDate(movie.releaseDate)}</p>

                <div className="flex flex-wrap items-center gap-4 text-sm text-dark-500 dark:text-dark-400">
                  <span>{formatYear(movie.releaseDate)}</span>
                  <span aria-hidden="true">•</span>
                  <span>{formatRuntime(movie.runtime)}</span>
                  <span aria-hidden="true">•</span>
                  <span>{movie.genres.join(', ')}</span>
                </div>

                <div className="flex flex-wrap gap-3 pt-4">
                  <Button size="lg" leftIcon={
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  } onClick={() => {
                    addToContinueWatching({ type: 'movie', item: movie });
                    setShowPlayer(true);
                  }} disabled={!movie.tmdbId}>
                    {movie.tmdbId ? 'Play Now' : 'Unavailable'}
                  </Button>
                  {!movie.tmdbId && (
                    <p className="basis-full text-sm text-dark-500 dark:text-dark-400">
                      A TMDB ID is required to open this title.
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="lg"
                    aria-pressed={isSaved}
                    onClick={() => toggleWatchlist({ type: 'movie', item: movie })}
                  >
                    {isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    aria-pressed={hasWatched}
                    onClick={() => hasWatched
                      ? removeFromWatched('movie', movie.id)
                      : markWatched({ type: 'movie', item: movie })}
                  >
                    {hasWatched ? 'Watched' : 'Mark as Watched'}
                  </Button>
                  <Button variant="ghost" size="lg" aria-label="Share">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                  </Button>
                </div>
              </div>
            </div>

            <TrailerPlayer
              title={movie.title}
              videoKey={trailer.trailerKey}
              loading={trailer.loading}
              error={trailer.error}
            />

            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-dark-600 dark:text-dark-300 leading-relaxed whitespace-pre-line">{movie.overview}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Genres</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((genre) => (
                    <Badge key={genre} variant="outline">{genre}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-dark-500 dark:text-dark-400">Release Date</dt>
                    <dd className="font-medium text-dark-900 dark:text-white">{formatDate(movie.releaseDate)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-dark-500 dark:text-dark-400">Runtime</dt>
                    <dd className="font-medium text-dark-900 dark:text-white">{formatRuntime(movie.runtime)}</dd>
                  </div>
                  {movie.imdbId && (
                    <div className="flex justify-between">
                      <dt className="text-dark-500 dark:text-dark-400">IMDb</dt>
                      <dd className="font-medium text-dark-900 dark:text-white">
                        <a href={`https://imdb.com/title/${movie.imdbId}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 dark:hover:text-primary-400">{movie.imdbId}</a>
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}