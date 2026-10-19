import { GenreBrowser } from '../components/features/GenreBrowser';

export function TVShowsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-dark-900 dark:text-white mb-2">TV Shows</h1>
        <p className="text-dark-500 dark:text-dark-400">Discover and watch your favorite TV series</p>
      </div>

      <GenreBrowser type="tv" />
    </div>
  );
}