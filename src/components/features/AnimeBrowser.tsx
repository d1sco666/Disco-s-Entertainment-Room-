import { useMemo, useState } from 'react';
import { animeAgeRatings, animeGenres } from '../../services/anime';
import { useAnimeDiscovery } from '../../hooks/useAnime';
import { AnimeCard } from './AnimeCard';
import { SkeletonCard } from '../ui/Skeleton';

export function AnimeBrowser() {
  const [genreId, setGenreId] = useState('');
  const [ageRating, setAgeRating] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'top_rated'>('popular');
  const [year, setYear] = useState('');
  const [providerId, setProviderId] = useState('');
  const filters = useMemo(() => ({
    genreId: genreId ? Number(genreId) : null,
    ageRating,
    sortBy,
    year: year ? Number(year) : null,
  }), [ageRating, genreId, sortBy, year]);
  const { items, loading, loadingMore, error, aniListWarning, hasMore, loadMore } = useAnimeDiscovery(filters);
  const visibleItems = providerId === 'ani.pm'
    ? items.filter((item) => item.aniPmAvailable !== false)
    : items;
  const currentYear = new Date().getFullYear();

  return (
    <section aria-labelledby="anime-browser-title" className="mb-8">
      <div className="mb-5">
        <h2 id="anime-browser-title" className="text-2xl font-bold text-dark-100">Browse Anime</h2>
        <p className="mt-1 text-sm text-dark-400">Filter MAL’s anime catalog by genre, rating, Ani.pm availability, year, and score.</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-dark-300">
          Genre
          <select
            value={genreId}
            onChange={(event) => setGenreId(event.target.value)}
            className="w-full border border-dark-600 bg-dark-800 px-3 py-2.5 text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All genres</option>
            {animeGenres.map((genre) => <option key={genre.id} value={genre.id}>{genre.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-dark-300">
          Age rating
          <select
            value={ageRating}
            onChange={(event) => setAgeRating(event.target.value)}
            className="w-full border border-dark-600 bg-dark-800 px-3 py-2.5 text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Any age rating</option>
            {animeAgeRatings.map((rating) => <option key={rating.value} value={rating.value}>{rating.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-dark-300">
          Sort by
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value === 'top_rated' ? 'top_rated' : 'popular')}
            className="w-full border border-dark-600 bg-dark-800 px-3 py-2.5 text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="popular">Popular</option>
            <option value="top_rated">Top Rated</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-dark-300">
          Streaming provider
          <select
            value={providerId}
            onChange={(event) => setProviderId(event.target.value)}
            className="w-full border border-dark-600 bg-dark-800 px-3 py-2.5 text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Any provider</option>
            <option value="ani.pm">Ani.pm</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-dark-300">
          Release year
          <select
            value={year}
            onChange={(event) => setYear(event.target.value)}
            className="w-full border border-dark-600 bg-dark-800 px-3 py-2.5 text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Any year</option>
            {Array.from({ length: currentYear - 1949 }, (_, index) => currentYear - index).map((releaseYear) => (
              <option key={releaseYear} value={releaseYear}>{releaseYear}</option>
            ))}
          </select>
        </label>
      </div>

      {aniListWarning && (
        <p className="mb-4 rounded-lg border border-amber-800 bg-amber-950/40 p-3 text-sm text-amber-200" role="status">
          Some AniList or Ani.pm metadata could not be loaded. MAL IDs remain available for playback. {aniListWarning}
        </p>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8">
          {Array.from({ length: 12 }, (_, index) => <SkeletonCard key={index} />)}
        </div>
      ) : error && visibleItems.length === 0 ? (
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6 text-center" role="alert">
          <h3 className="mb-1 text-lg font-medium text-red-300">Could not load anime</h3>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      ) : visibleItems.length === 0 ? (
        <p className="py-16 text-center text-dark-400">No anime matches these filters.</p>
      ) : (
        <div className="space-y-6">
          {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8">
            {visibleItems.map((item) => <AnimeCard key={item.malId} item={item} />)}
          </div>
          {hasMore && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loadingMore}
                className="rounded-lg border border-dark-600 bg-dark-800 px-6 py-3 text-sm font-medium text-dark-200 transition-colors hover:bg-dark-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingMore ? 'Loading more…' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
