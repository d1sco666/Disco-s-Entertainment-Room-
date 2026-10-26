import { MediaCard } from './MediaCard';
import { SkeletonCard } from '../ui/Skeleton';
import type { CineSrcMovie, CineSrcTVShow } from '@/types';

interface MediaGridProps {
  items: (CineSrcMovie | CineSrcTVShow)[];
  type: 'movie' | 'tv';
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  loadMore?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
}

export function MediaGrid({
  items,
  type,
  loading = false,
  error,
  emptyMessage = 'No content found',
  loadMore,
  hasMore,
  loadingMore,
}: MediaGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/20" role="alert">
        <h3 className="mb-1 text-lg font-medium text-red-800 dark:text-red-300">Could not load titles</h3>
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <svg className="mx-auto h-16 w-16 text-dark-300 dark:text-dark-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-lg font-medium text-dark-900 dark:text-white mb-1">{emptyMessage}</h3>
        <p className="text-dark-500 dark:text-dark-400">Try adjusting your search or browse other categories.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2">
        {items.map((item) => (
          <MediaCard key={item.id} item={item} type={type} />
        ))}
      </div>

      {hasMore && loadMore && (
        <div className="text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-dark-700 dark:text-dark-300 bg-dark-100 dark:bg-dark-800 border border-dark-300 dark:border-dark-600 rounded-lg hover:bg-dark-200 dark:hover:bg-dark-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loadingMore ? (
              'Loading more...'
            ) : (
              'Load More'
            )}
          </button>
        </div>
      )}
    </div>
  );
}