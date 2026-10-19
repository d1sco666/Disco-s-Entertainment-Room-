import { Link } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { Image } from '../ui/Image';
import type { AnimeTitle } from '../../types';

interface AnimeCardProps {
  item: AnimeTitle;
  onRemove?: () => void;
  removeLabel?: string;
  subtitle?: string;
}

export function AnimeCard({ item, onRemove, removeLabel = 'Remove from anime list', subtitle }: AnimeCardProps) {
  return (
    <Card
      variant="default"
      hover
      padding="none"
      className="relative flex h-full flex-col border border-dark-700 bg-black shadow-[0_4px_18px_rgba(0,0,0,0.45)]"
    >
      <Link to={`/anime/${item.malId}`} className="group block flex-1">
        <div className="relative aspect-[2/3] overflow-hidden border-b border-dark-700 bg-dark-900">
          <Image
            src={item.poster}
            alt={`${item.title} poster`}
            fallback="/placeholder-poster.svg"
            className="h-full w-full object-cover"
          />
          <div className="absolute left-2 top-2">
            <Badge variant="primary" size="sm">
              <span aria-hidden="true">★</span>{' '}
              {item.score ? item.score.toFixed(2) : '—'}
            </Badge>
          </div>
          <div className="absolute right-2 top-2">
            <Badge
              variant="default"
              size="sm"
              className="bg-black/70 text-white"
              aria-label={`Age rating ${item.ageRating}`}
            >
              {item.ageRating}
            </Badge>
          </div>
          {item.aniPmAvailable === false && (
            <span className="absolute bottom-2 left-2 rounded bg-black/80 px-2 py-1 text-xs text-dark-300">
              Not on Ani.pm
            </span>
          )}
        </div>
        <CardContent className="flex flex-1 flex-col p-4">
          <h3 className="line-clamp-2 font-semibold text-white transition-colors group-hover:text-primary-400">
            {item.title}
          </h3>
          <div className="mt-1.5 flex items-center gap-2 text-sm text-dark-400">
            <span>{item.year || 'Year unknown'}</span>
            <span aria-hidden="true">•</span>
            <span>{item.episodes ? `${item.episodes} eps` : item.status}</span>
          </div>
          {subtitle && <p className="mt-1 line-clamp-2 text-sm text-primary-400">{subtitle}</p>}
          <div className="mt-2 flex flex-wrap gap-1">
            {item.genres.slice(0, 2).map((genre) => (
              <Badge key={genre} variant="default" size="sm">{genre}</Badge>
            ))}
          </div>
        </CardContent>
      </Link>
      {onRemove && (
        <div className="mt-auto px-4 pb-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={onRemove}
            aria-label={`${removeLabel}: ${item.title}`}
          >
            {removeLabel}
          </Button>
        </div>
      )}
    </Card>
  );
}
