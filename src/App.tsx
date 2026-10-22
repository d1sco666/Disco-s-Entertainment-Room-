import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';

const Home = lazy(() => import('./pages/Home').then(({ Home }) => ({ default: Home })));
const MoviesPage = lazy(() => import('./pages/MoviesPage').then(({ MoviesPage }) => ({ default: MoviesPage })));
const TVShowsPage = lazy(() => import('./pages/TVShowsPage').then(({ TVShowsPage }) => ({ default: TVShowsPage })));
const AnimePage = lazy(() => import('./pages/AnimePage').then(({ AnimePage }) => ({ default: AnimePage })));
const TrendingPage = lazy(() => import('./pages/TrendingPage').then(({ TrendingPage }) => ({ default: TrendingPage })));
const SearchPage = lazy(() => import('./pages/SearchPage').then(({ SearchPage }) => ({ default: SearchPage })));
const MoviePage = lazy(() => import('./pages/MoviePage').then(({ MoviePage }) => ({ default: MoviePage })));
const TVShowPage = lazy(() => import('./pages/TVShowPage').then(({ TVShowPage }) => ({ default: TVShowPage })));
const WatchlistPage = lazy(() => import('./pages/WatchlistPage').then(({ WatchlistPage }) => ({ default: WatchlistPage })));
const WatchedPage = lazy(() => import('./pages/WatchedPage').then(({ WatchedPage }) => ({ default: WatchedPage })));
const SimklCallbackPage = lazy(() => import('./pages/SimklCallbackPage').then(({ SimklCallbackPage }) => ({ default: SimklCallbackPage })));
const AniListCallbackPage = lazy(() => import('./pages/AniListCallbackPage').then(({ AniListCallbackPage }) => ({ default: AniListCallbackPage })));
const NotFound = lazy(() => import('./pages/NotFound').then(({ NotFound }) => ({ default: NotFound })));

function App() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark-950 flex items-center justify-center" role="status">
        <span className="text-dark-300">Loading page...</span>
      </div>
    }>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="movies" element={<MoviesPage />} />
          <Route path="tv-shows" element={<TVShowsPage />} />
          <Route path="anime" element={<AnimePage />} />
          <Route path="anime/:id" element={<AnimePage />} />
          <Route path="watchlist" element={<WatchlistPage />} />
          <Route path="watched" element={<WatchedPage />} />
          <Route path="simkl/callback" element={<SimklCallbackPage />} />
          <Route path="anilist/callback" element={<AniListCallbackPage />} />
          <Route path="trending" element={<TrendingPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="movie/:id" element={<MoviePage />} />
          <Route path="tv/:id" element={<TVShowPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;