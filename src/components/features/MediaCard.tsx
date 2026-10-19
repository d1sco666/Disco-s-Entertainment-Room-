import { memo, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../ui/Card';
import { Image } from '../ui/Image';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { formatYear, formatRuntime } from '@/utils/helpers';
import { tmdbAPI } from '@/services/tmdb';
import { useMediaLibrary } from '@/hooks/useMediaLibrary';
import type { CineSrcMovie, CineSrcTVShow } from '@/types';

interface MediaCardProps {
  item: CineSrcMovie | CineSrcTVShow;
  type: 'movie' | 'tv';
  subtitle?: string;
  onRemove?: () => void;
  removeLabel?: string;
  removeIconOnly?: boolean;
  glossySurface?: boolean;
}

function MediaCardComponent({
  item,
  type,
  subtitle,
  onRemove,
  removeLabel = 'Remove from list',
  removeIconOnly = false,
  glossySurface = false,
}: MediaCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { watched: watchedItems } = useMediaLibrary();
  const isMovie = type === 'movie';
  const mediaId = item.id;
  const itemRuntime = isMovie ? (item as CineSrcMovie).runtime : 0;
  const itemSeasonCount = isMovie ? 0 : (item as CineSrcTVShow).numberOfSeasons;
  const itemAgeRating = item.ageRating || item.contentRating || item.certification;
  const [details, setDetails] = useState<CineSrcMovie | CineSrcTVShow | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const movie = isMovie ? (details as CineSrcMovie | null) ?? item as CineSrcMovie : null;
  const show = !isMovie ? (details as CineSrcTVShow | null) ?? item as CineSrcTVShow : null;
  const title = isMovie ? movie!.title : show!.name;
  const year = isMovie
    ? formatYear(movie!.releaseDate)
    : formatYear(show!.firstAirDate);
  const rating = details?.rating ?? item.rating;
  const poster = item.poster;
  const genres = item.genres.slice(0, 2);
  const ageRating = details?.ageRating || details?.contentRating || details?.certification
    || item.ageRating || item.contentRating || item.certification;
  const isWatched = watchedItems.some((entry) => entry.type === type && entry.item.id === item.id);

  useEffect(() => {
    setDetails(null);
    setRuntimeError(null);
    if (itemAgeRating && ((isMovie && itemRuntime > 0) || (!isMovie && itemSeasonCount > 0))) {
      setDetailsLoading(false);
      return;
    }

    let active = true;
    setDetailsLoading(true);
    const loadDetails = () => {
      const request = isMovie
        ? tmdbAPI.getMovieDetails(mediaId)
        : tmdbAPI.getTVShowDetails(mediaId);
      request
        .then((mediaDetails) => {
          if (active) setDetails(mediaDetails);
        })
        .catch((error: unknown) => {
          if (active) setRuntimeError(error instanceof Error ? error.message : 'Could not load title details');
        })
        .finally(() => {
          if (active) setDetailsLoading(false);
        });
    };

    if (!('IntersectionObserver' in window)) {
      loadDetails();
      return () => {
        active = false;
      };
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        observer.disconnect();
        loadDetails();
      }
    }, { rootMargin: '200px' });
    const cardElement = cardRef.current;
    if (cardElement) observer.observe(cardElement);

    return () => {
      active = false;
      observer.disconnect();
    };
  }, [isMovie, mediaId, itemAgeRating, itemRuntime, itemSeasonCount]);

  const runtime = movie?.runtime ?? 0;
  const numberOfSeasons = show?.numberOfSeasons ?? 0;

  return (
    <Card
      ref={cardRef}
      variant="default"
      hover
      padding="none"
      className={`relative h-full flex flex-col border border-dark-700 shadow-[0_4px_18px_rgba(0,0,0,0.45)] ${
        glossySurface ? 'bg-dark-800' : 'bg-black'
      }`}
    >
      <Link
        to={isMovie ? `/movie/${item.id}` : `/tv/${item.id}`}
        className={glossySurface ? 'group flex flex-1 flex-col' : 'block group'}
      >
        <div className="relative aspect-[2/3] overflow-hidden border-b border-dark-700 bg-dark-900">
          <Image
            src={poster}
            alt={`${title} poster`}
            fallback="/placeholder-poster.svg"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="absolute top-2 left-2">
            <Badge variant="primary" size="sm" aria-label={`Rating ${rating.toFixed(1)} out of 10`}>
              <span aria-hidden="true">★</span>
              {rating.toFixed(1)}
            </Badge>
          </div>
          <div className="absolute top-2 right-2">
            <Badge
              variant="default"
              size="sm"
              className="bg-black/70 text-white"
              aria-label={ageRating ? `Age rating ${ageRating}` : 'Age rating unavailable'}
              title={ageRating ? `Age rating: ${ageRating}` : runtimeError || 'Age rating unavailable'}
            >
              {ageRating || (detailsLoading ? '…' : '—')}
            </Badge>
          </div>
          {isWatched && (
            <span
              className="absolute bottom-2 right-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow"
              role="img"
              aria-label="Watched"
              title="Watched"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="m5 12 4 4L19 6" />
              </svg>
            </span>
          )}

          <div className="absolute bottom-2 left-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100">
            {genres.map((genre) => (
              <Badge key={genre} variant="default" size="sm" className="bg-black/50 text-white border-white/20">
                {genre}
              </Badge>
            ))}
          </div>
        </div>

        <CardContent className={`flex-1 flex flex-col p-4 ${glossySurface ? 'poster-card-gloss' : ''}`}>
          <h3 className="font-semibold text-dark-900 dark:text-white line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {title}
          </h3>
          <div className="mt-1.5 flex items-center gap-2 text-sm text-dark-500 dark:text-dark-400">
            <span>{year}</span>
            <span aria-hidden="true">•</span>
            <span title={runtimeError || undefined}>
              {isMovie
                ? runtime > 0
                  ? formatRuntime(runtime)
                  : runtimeError
                    ? 'Runtime failed to load'
                    : 'Loading runtime…'
                : numberOfSeasons > 0
                  ? `${numberOfSeasons} seasons`
                  : runtimeError
                    ? 'Season count unavailable'
                    : 'Loading seasons…'}
            </span>
          </div>
          {subtitle && <p className="mt-1 text-sm text-primary-600 dark:text-primary-400 line-clamp-2">{subtitle}</p>}
        </CardContent>
      </Link>
      {item.simklHref && (
        <a
          href={item.simklHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mx-4 mb-3 inline-flex w-fit items-center gap-1.5 text-xs font-medium text-dark-400 hover:text-primary-400"
          aria-label={`View ${title} on Simkl`}
        >
          <img
            src="https://us.simkl.in/img_favicon/v2/favicon-192x192.png"
            alt="Simkl"
            className="h-4 w-4 rounded-sm"
          />
          View on Simkl
        </a>
      )}
      {onRemove && (
        removeIconOnly ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 z-10 rounded-full bg-black/75 text-white hover:bg-black"
            onClick={onRemove}
            aria-label={`${removeLabel}: ${title}`}
            title={removeLabel}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        ) : (
          <div className="mt-auto px-4 pb-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={onRemove}
              aria-label={`${removeLabel}: ${title}`}
            >
              {removeLabel}
            </Button>
          </div>
        )
      )}
    </Card>
  );
}

export const MediaCard = memo(MediaCardComponent);