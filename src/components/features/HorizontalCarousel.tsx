import { memo, useRef } from 'react';
import type { ReactNode } from 'react';

interface HorizontalCarouselProps {
  children: ReactNode;
  label: string;
}

function HorizontalCarouselComponent({ children, label }: HorizontalCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const move = (direction: -1 | 1) => {
    if (trackRef.current) {
      trackRef.current.scrollBy({
        left: direction * trackRef.current.clientWidth * 0.8,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative px-8 sm:px-10">
      <button
        type="button"
        aria-label="Scroll titles left"
        onClick={() => move(-1)}
        className="absolute left-1 top-1/2 z-10 -translate-y-1/2 bg-black p-2 text-white hover:bg-primary-600 transition-colors"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div
        ref={trackRef}
        className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth py-1"
        aria-label={label}
      >
        {children}
      </div>
      <button
        type="button"
        aria-label="Scroll titles right"
        onClick={() => move(1)}
        className="absolute right-1 top-1/2 z-10 -translate-y-1/2 bg-black p-2 text-white hover:bg-primary-600 transition-colors"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

export const HorizontalCarousel = memo(HorizontalCarouselComponent);
