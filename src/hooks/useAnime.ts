import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchRecentAnime,
  fetchAnimeSeries,
  searchAnime,
  type AnimeListResult,
  type AnimeSeriesResult,
  type AnimeFilters,
  type SearchAnimeResult,
} from '../services/anime';
import type { AnimeTitle } from '../types';

export function useAnimeDiscovery(enabled: boolean, page: number, perPage: number, filters: AnimeFilters) {
  const [items, setItems] = useState<AnimeTitle[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultPage, setResultPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const requestVersion = useRef(0);
  const hasMore = resultPage < totalPages;

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setLoading(false);
      setError(null);
      setResultPage(1);
      setTotalPages(1);
      setTotal(0);
      return;
    }

    const version = ++requestVersion.current;
    const controller = new AbortController();
    setItems([]);
    setLoading(true);
    setLoadingMore(false);
    setError(null);

    const timer = window.setTimeout(() => {
      fetchRecentAnime(page, perPage, filters, controller.signal)
        .then((result: AnimeListResult) => {
          if (version !== requestVersion.current) return;
          setItems(result.items);
          setResultPage(result.page);
          setTotalPages(result.totalPages);
          setTotal(result.total);
        })
        .catch((requestError: unknown) => {
          if (version !== requestVersion.current || controller.signal.aborted) return;
          setError(requestError instanceof Error ? requestError.message : 'Could not load anime.');
        })
        .finally(() => {
          if (version === requestVersion.current) setLoading(false);
        });
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [enabled, page, perPage, filters]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    const nextPage = resultPage + 1;
    const version = ++requestVersion.current;
    const controller = new AbortController();
    setLoadingMore(true);
    setError(null);
    try {
      const result = await fetchRecentAnime(nextPage, perPage, filters, controller.signal);
      if (version !== requestVersion.current) return;
      setItems((current) => [...current, ...result.items]);
      setResultPage(result.page);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (requestError) {
      if (version === requestVersion.current) {
        setError(requestError instanceof Error ? requestError.message : 'Could not load more anime.');
      }
    } finally {
      if (version === requestVersion.current) setLoadingMore(false);
    }
  }, [loading, loadingMore, hasMore, resultPage, perPage, filters]);

  return { items, loading, loadingMore, error, page: resultPage, totalPages, total, hasMore, loadMore };
}

export function useAnimeSearch(query: string, enabled: boolean) {
  const [items, setItems] = useState<AnimeTitle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (!enabled || !normalizedQuery) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const timer = window.setTimeout(() => {
      searchAnime(normalizedQuery, 1, 100, controller.signal)
        .then((result: SearchAnimeResult) => {
          setItems(result.items);
        })
        .catch((searchError: unknown) => {
          if (!controller.signal.aborted) {
            setError(searchError instanceof Error ? searchError.message : 'Anime search failed.');
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, enabled]);

  return { items, loading, error };
}

export function useAnimeDetails(id: string | null) {
  const [item, setItem] = useState<AnimeTitle | null>(null);
  const [episodes, setEpisodes] = useState<AnimeSeriesResult['episodes']>([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    if (!id) {
      setItem(null);
      setEpisodes([]);
      setLoading(false);
      setError(id === null ? null : 'Invalid anime ID.');
      controller.abort();
      return () => {
        active = false;
      };
    }

    setItem(null);
    setEpisodes([]);
    setLoading(true);
    setError(null);
    fetchAnimeSeries(id, controller.signal)
      .then((result: AnimeSeriesResult) => {
        if (active) {
          setItem(result.anime);
          setEpisodes(result.episodes);
        }
      })
      .catch((requestError: unknown) => {
        if (active && !controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : 'Could not load anime details.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [id]);

  return { item, episodes, loading, error };
}
