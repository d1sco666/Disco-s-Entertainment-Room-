import { useState, useEffect, useCallback, useRef } from 'react';
import { tmdbAPI } from '../services/tmdb';
import type { CineSrcMovie, CineSrcTVShow, CineSrcSeason, CineSrcSearchResult } from '../types';

export function usePopularMovies() {
  const [movies, setMovies] = useState<CineSrcMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMovies = useCallback(async (pageNum: number, isLoadMore = false) => {
    try {
      setError(null);
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      const data = await tmdbAPI.getPopularMovies(pageNum);
      setMovies((currentMovies) => pageNum === 1 ? data.movies : [...currentMovies, ...data.movies]);
      setTotalPages(data.totalPages);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch movies');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchMovies(1);
  }, [fetchMovies]);

  const loadMore = useCallback(() => {
    if (page < totalPages && !loading && !loadingMore) {
      fetchMovies(page + 1, true);
    }
  }, [page, totalPages, loading, loadingMore, fetchMovies]);

  return { movies, loading, loadingMore, error, loadMore, hasMore: page < totalPages };
}

export function usePopularTVShows() {
  const [shows, setShows] = useState<CineSrcTVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchShows = useCallback(async (pageNum: number, isLoadMore = false) => {
    try {
      setError(null);
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      const data = await tmdbAPI.getPopularTVShows(pageNum);
      setShows((currentShows) => pageNum === 1 ? data.tvShows : [...currentShows, ...data.tvShows]);
      setTotalPages(data.totalPages);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch TV shows');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchShows(1);
  }, [fetchShows]);

  const loadMore = useCallback(() => {
    if (page < totalPages && !loading && !loadingMore) {
      fetchShows(page + 1, true);
    }
  }, [page, totalPages, loading, loadingMore, fetchShows]);

  return { shows, loading, loadingMore, error, loadMore, hasMore: page < totalPages };
}

export function useTrendingMovies() {
  const [movies, setMovies] = useState<CineSrcMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    tmdbAPI.getTrendingMovies(1)
      .then(data => {
        setMovies(data.movies);
        setTotalPages(data.totalPages);
        setPage(1);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to fetch trending movies'))
      .finally(() => setLoading(false));
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    setError(null);
    try {
      const data = await tmdbAPI.getTrendingMovies(page + 1);
      setMovies((current) => [...current, ...data.movies]);
      setPage(page + 1);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch more trending movies');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, page, totalPages]);

  return { movies, loading, loadingMore, error, loadMore, hasMore: page < totalPages };
}

export function usePopularHorrorMovies() {
  const [movies, setMovies] = useState<CineSrcMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    tmdbAPI.getPopularHorrorMovies(1)
      .then((data) => setMovies(data.movies))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to fetch popular horror movies'))
      .finally(() => setLoading(false));
  }, []);

  return { movies, loading, error };
}

export function useMediaTrailer(type: 'movie' | 'tv', mediaId?: number) {
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setTrailerKey(null);
    setError(null);

    if (!mediaId) {
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    const request = type === 'movie'
      ? tmdbAPI.getMovieTrailer(mediaId)
      : tmdbAPI.getTVShowTrailer(mediaId);
    request
      .then((key) => {
        if (active) setTrailerKey(key);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Could not load the trailer.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [type, mediaId]);

  return { trailerKey, loading, error };
}

export function useGenreTitles(
  type: 'movie' | 'tv',
  genreId: number | null,
  ageRating: string,
  sortBy: 'popular' | 'top_rated',
  year: number | null,
  providerId: number | null,
  countryCode: string | null,
) {
  const [items, setItems] = useState<(CineSrcMovie | CineSrcTVShow)[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const requestVersion = useRef(0);

  useEffect(() => {
    const version = ++requestVersion.current;
    let active = true;
    setLoading(true);
    setLoadingMore(false);
    setItems([]);
    setPage(1);
    setTotalPages(1);
    setError(null);
    tmdbAPI.discoverTitles(type, { genreId, ageRating, sortBy, year, providerId, countryCode })
      .then((data) => {
        if (!active || version !== requestVersion.current) return;
        setItems(data.items);
        setPage(1);
        setTotalPages(data.totalPages);
      })
      .catch((err: unknown) => {
        if (active && version === requestVersion.current) {
          setError(err instanceof Error ? err.message : `Failed to discover ${type} titles`);
        }
      })
      .finally(() => {
        if (active && version === requestVersion.current) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [type, genreId, ageRating, sortBy, year, providerId, countryCode]);

  const loadMore = useCallback(async () => {
    if (loadingMore || page >= totalPages) return;
    const version = requestVersion.current;
    setLoadingMore(true);
    setError(null);
    try {
      const data = await tmdbAPI.discoverTitles(type, { genreId, ageRating, sortBy, year, providerId, countryCode }, page + 1);
      if (version !== requestVersion.current) return;
      setItems((current) => [...current, ...data.items]);
      setPage(page + 1);
      setTotalPages(data.totalPages);
    } catch (err) {
      if (version === requestVersion.current) {
        setError(err instanceof Error ? err.message : `Failed to load more ${type} titles`);
      }
    } finally {
      if (version === requestVersion.current) setLoadingMore(false);
    }
  }, [type, genreId, ageRating, sortBy, year, providerId, countryCode, loadingMore, page, totalPages]);

  return { items, loading, loadingMore, error, loadMore, hasMore: page < totalPages };
}

export function useTrendingTVShows() {
  const [shows, setShows] = useState<CineSrcTVShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    tmdbAPI.getTrendingTVShows(1)
      .then(data => {
        setShows(data.tvShows);
        setTotalPages(data.totalPages);
        setPage(1);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to fetch trending TV shows'))
      .finally(() => setLoading(false));
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    setError(null);
    try {
      const data = await tmdbAPI.getTrendingTVShows(page + 1);
      setShows((current) => [...current, ...data.tvShows]);
      setPage(page + 1);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch more trending TV shows');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, page, totalPages]);

  return { shows, loading, loadingMore, error, loadMore, hasMore: page < totalPages };
}

export function useSearch(query: string, enabled = true) {
  const [results, setResults] = useState<CineSrcSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const normalizedQuery = query.trim();

  useEffect(() => {
    if (!enabled || !normalizedQuery) {
      setResults(null);
      setLoading(false);
      setError(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);
    const search = async () => {
      try {
        const data = await tmdbAPI.search(normalizedQuery);
        if (active) setResults(data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        if (active) setLoading(false);
      }
    };

    const debounceTimer = setTimeout(search, 300);
    return () => {
      active = false;
      clearTimeout(debounceTimer);
    };
  }, [normalizedQuery, enabled]);

  return { results, loading, error };
}

export function useMovieDetails(movieId: string) {
  const [movie, setMovie] = useState<CineSrcMovie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!movieId) {
      setMovie(null);
      setLoading(false);
      setError(null);
      return;
    }
    let active = true;
    setMovie(null);
    setLoading(true);
    setError(null);
    tmdbAPI.getMovieDetails(movieId)
      .then((result) => {
        if (active) setMovie(result);
      })
      .catch(err => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to fetch movie details');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [movieId]);

  return { movie, loading, error };
}

export function useTVShowDetails(tvId: string) {
  const [show, setShow] = useState<CineSrcTVShow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tvId) {
      setShow(null);
      setLoading(false);
      setError(null);
      return;
    }
    let active = true;
    setShow(null);
    setLoading(true);
    setError(null);
    tmdbAPI.getTVShowDetails(tvId)
      .then((result) => {
        if (active) setShow(result);
      })
      .catch(err => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to fetch TV show details');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tvId]);

  return { show, loading, error };
}

export function useSeasonDetails(tvId: string, seasonNumber: number) {
  const [season, setSeason] = useState<CineSrcSeason | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tvId || !seasonNumber) {
      setSeason(null);
      setLoading(false);
      setError(null);
      return;
    }
    let active = true;
    setSeason(null);
    setLoading(true);
    setError(null);
    tmdbAPI.getSeasonDetails(tvId, seasonNumber)
      .then((result) => {
        if (active) setSeason(result);
      })
      .catch(err => {
        if (active) setError(err instanceof Error ? err.message : 'Failed to fetch season details');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tvId, seasonNumber]);

  return { season, loading, error };
}
