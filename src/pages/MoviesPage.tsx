import { GenreBrowser } from '../components/features/GenreBrowser';

export function MoviesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-900 dark:text-white mb-2">Movies</h1>
        <p className="text-dark-500 dark:text-dark-400">Discover and watch your favorite movies</p>
      </div>

      <GenreBrowser type="movie" />
    </div>
  );
}