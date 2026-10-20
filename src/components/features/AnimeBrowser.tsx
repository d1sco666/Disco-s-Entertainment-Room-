import { useState } from 'react';
import { useAnimeDiscovery } from '../../hooks/useAnime';
import { AnimeCard } from './AnimeCard';
import { SkeletonCard } from '../ui/Skeleton';

export function AnimeBrowser() {
  const [page] = useState(1);
  const [perPage] = useState(20);

  const { items, loading, loadingMore, error, page: resultPage, totalPages, total, hasMore, loadMore } =
    useAnimeDiscovery(true, page, perPage);

  return (
    <section aria-labelledby="anime-browser-title" className="mb-8">
      <div className="mb-5">
        <h2 id="anime-browser-title" className="text-2xl font-bold text-dark-100">Browse Anime</h2>
        <p className="mt-1 text-sm text-dark-400">Recent anime from the Anikoto catalog.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6 text-center" role="alert">
          <h3 className="mb-1 text-lg font-medium text-red-300">Could not load anime</h3>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8">
          {Array.from({ length: 12 }, (_, index) => <SkeletonCard key={index} />)}
        </div>
      ) : items.length === 0 ? (
        <p className="py-16 text-center text-dark-400">No anime found.</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8">
            {items.map((item) => <AnimeCard key={item.id} item={item} />)}
          </div>
          {hasMore && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loadingMore}
                className="rounded-lg border border-dark-600 bg-dark-800 px-6 py-3 text-sm font-medium text-dark-200 transition-colors hover:bg-dark-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingMore ? 'Loading more…' : `Load More (page ${resultPage + 1} of ${totalPages})`}
              </button>
              <p className="mt-2 text-xs text-dark-500">
                Showing {items.length} of {total} anime
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
