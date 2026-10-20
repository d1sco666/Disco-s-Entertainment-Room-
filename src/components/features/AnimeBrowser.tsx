import { useCallback, useMemo, useState } from 'react';
import { useAnimeDiscovery } from '../../hooks/useAnime';
import type { AnimeFilters } from '../../services/anime';
import { AnimeCard } from './AnimeCard';
import { SkeletonCard } from '../ui/Skeleton';

const animeTypes = ['TV', 'Movie', 'OVA', 'ONA', 'Special', 'Music'];
const animeStatuses = ['Currently Airing', 'Finished Airing', 'Not yet aired', 'TBA'];
const animeRatings = ['G', 'PG', 'PG-13', 'R', 'R+', 'None'];

export function AnimeBrowser() {
  const [page] = useState(1);
  const [perPage] = useState(20);
  const [filters, setFilters] = useState<AnimeFilters>({});

  const { items, loading, loadingMore, error, page: resultPage, totalPages, total, hasMore, loadMore } =
    useAnimeDiscovery(true, page, perPage, filters);

  const allGenres = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      for (const genre of item.genres) set.add(genre);
    }
    return Array.from(set).sort();
  }, [items]);

  const toggleGenre = useCallback((genre: string) => {
    setFilters((prev) => {
      const selected = new Set(prev.genre ? [prev.genre] : []);
      if (selected.has(genre)) {
        selected.delete(genre);
      } else {
        selected.add(genre);
      }
      const next = Array.from(selected);
      return next.length ? { ...prev, genre: next[0] } : { ...prev, genre: undefined };
    });
  }, []);

  return (
    <section aria-labelledby="anime-browser-title" className="mb-8">
      <div className="mb-5">
        <h2 id="anime-browser-title" className="text-2xl font-bold text-dark-100">Browse Anime</h2>
        <p className="mt-1 text-sm text-dark-400">Filter and browse the Anikoto catalog.</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div className="col-span-full">
          <label className="text-sm font-medium text-dark-300 mb-2 block">Genre</label>
          <div className="flex flex-wrap gap-2">
            {allGenres.map((genre) => (
              <button
                key={genre}
                type="button"
                onClick={() => toggleGenre(genre)}
                aria-pressed={filters.genre === genre}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                  filters.genre === genre
                    ? 'border-primary-500 bg-primary-900/20 text-primary-300'
                    : 'border-dark-600 bg-dark-800 text-dark-300 hover:bg-dark-700'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
          {filters.genre && (
            <p className="mt-1 text-xs text-dark-500">Filtered by {filters.genre}</p>
          )}
        </div>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-dark-300">
          Type
          <select
            value={filters.type ?? ''}
            onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value || undefined }))}
            className="w-full border border-dark-600 bg-dark-800 px-3 py-2.5 text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Any type</option>
            {animeTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-dark-300">
          Status
          <select
            value={filters.status ?? ''}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value || undefined }))}
            className="w-full border border-dark-600 bg-dark-800 px-3 py-2.5 text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Any status</option>
            {animeStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-dark-300">
          Rating
          <select
            value={filters.rating ?? ''}
            onChange={(event) => setFilters((prev) => ({ ...prev, rating: event.target.value || undefined }))}
            className="w-full border border-dark-600 bg-dark-800 px-3 py-2.5 text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Any rating</option>
            {animeRatings.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-dark-300">
          Release year
          <select
            value={String(filters.year ?? '')}
            onChange={(event) => {
              const v = event.target.value;
              setFilters((prev) => ({ ...prev, year: v ? Number(v) : undefined }));
            }}
            className="w-full border border-dark-600 bg-dark-800 px-3 py-2.5 text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Any year</option>
            {Array.from({ length: new Date().getFullYear() - 1989 }, (_, i) => new Date().getFullYear() - i).map(
              (y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ),
            )}
          </select>
        </label>
      </div>

      {Object.values(filters).some(Boolean) && (
        <button
          type="button"
          onClick={() => setFilters({})}
          className="text-sm text-primary-400 hover:underline mb-4"
        >
          Clear filters
        </button>
      )}

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
