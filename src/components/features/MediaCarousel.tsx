import { memo, useRef } from 'react';
import { MediaCard } from './MediaCard';
import { SkeletonCard } from '../ui/Skeleton';
import type { CineSrcMovie, CineSrcTVShow } from '@/types';

interface MediaCarouselProps {
  items: (CineSrcMovie | CineSrcTVShow)[];
  type: 'movie' | 'tv';
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  glossyCards?: boolean;
}

function MediaCarouselComponent({
  items,
  type,
  loading = false,
  error,
  emptyMessage = 'No titles available',
  glossyCards = false,
}: MediaCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const move = (direction: -1 | 1) => {
    if (trackRef.current) {
      trackRef.current.scrollBy({
        left: direction * trackRef.current.clientWidth * 0.8,
        behavior: 'smooth',
      });
    }
  };

  if (error && items.length === 0) {
    return (
      <p className="border border-red-900/50 bg-red-950/20 p-6 text-red-400" role="alert">
        {error}
      </p>
    );
  }

  if (!loading && items.length === 0) {
    return <p className="py-6 text-center text-dark-400">{emptyMessage}</p>;
  }

  return (
    <div className="relative px-8 sm:px-10">
      {error && (
        <p className="mb-3 border border-red-900/50 bg-red-950/20 p-4 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      <button
        type="button"
        aria-label="Scroll titles left"
        onClick={() => move(-1)}
        className="absolute left-1 top-1/2 z-10 -translate-y-1/2 bg-black p-2 text-white"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div
        ref={trackRef}
        className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth py-1"
        aria-label={type === 'movie' ? 'Movies' : 'TV shows'}
      >
        {loading && items.length === 0
          ? Array.from({ length: 8 }, (_, index) => (
            <div className="w-28 flex-none snap-start sm:w-32 lg:w-36" key={index}>
              <SkeletonCard />
            </div>
          ))
          : items.map((item) => (
            <div className="w-28 flex-none snap-start sm:w-32 lg:w-36" key={item.id}>
              <MediaCard item={item} type={type} glossySurface={glossyCards} />
            </div>
          ))}
      </div>
      <button
        type="button"
        aria-label="Scroll titles right"
        onClick={() => move(1)}
        className="absolute right-1 top-1/2 z-10 -translate-y-1/2 bg-black p-2 text-white"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

export const MediaCarousel = memo(MediaCarouselComponent);
