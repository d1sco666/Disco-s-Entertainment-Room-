import { useCallback, useEffect, useRef, useState } from 'react';
import {
  discoverAnime,
  getAnimeDetails,
  searchAnime,
  type AnimeSearchFilters,
} from '../services/anime';
import type { AnimeTitle } from '../types';

export function useAnimeDiscovery(filters: AnimeSearchFilters, enabled: boolean) {
  const [items, setItems] = useState<AnimeTitle[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kitsuWarning, setKitsuWarning] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const requestVersion = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setLoading(false);
      setError(null);
      setKitsuWarning(null);
      setPage(1);
      setHasMore(false);
      return;
    }

    const version = ++requestVersion.current;
    const controller = new AbortController();
    setItems([]);
    setLoading(true);
    setLoadingMore(false);
    setError(null);
    setKitsuWarning(null);
    setPage(1);
    setHasMore(false);

    const timer = window.setTimeout(() => {
      discoverAnime(filters, 1, controller.signal)
        .then((result) => {
          if (version !== requestVersion.current) return;
          setItems(result.items);
          setPage(result.page);
          setHasMore(result.hasMore);
          setKitsuWarning(result.warning);
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
  }, [filters, enabled]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    const version = requestVersion.current;
    const nextPage = page + 1;
    const controller = new AbortController();
    setLoadingMore(true);
    setError(null);
    try {
      const result = await discoverAnime(filters, nextPage, controller.signal);
      if (version !== requestVersion.current) return;
      setItems((current) => [...current, ...result.items]);
      setPage(result.page);
      setHasMore(result.hasMore);
      setKitsuWarning(result.warning);
    } catch (requestError) {
      if (version === requestVersion.current) {
        setError(requestError instanceof Error ? requestError.message : 'Could not load more anime.');
      }
    } finally {
      if (version === requestVersion.current) setLoadingMore(false);
    }
  }, [filters, hasMore, loading, loadingMore, page]);

  return { items, loading, loadingMore, error, kitsuWarning, hasMore, loadMore };
}

export function useAnimeSearch(query: string, enabled: boolean) {
  const [items, setItems] = useState<AnimeTitle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (!enabled || !normalizedQuery) {
      setItems([]);
      setLoading(false);
      setError(null);
      setWarning(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setWarning(null);
    const timer = window.setTimeout(() => {
      searchAnime(normalizedQuery, controller.signal)
        .then((result) => {
          setItems(result.items);
          setWarning(result.warning);
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

  return { items, loading, error, warning };
}

export function useAnimeDetails(id: string | null) {
  const [item, setItem] = useState<AnimeTitle | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    if (!id) {
      setItem(null);
      setLoading(false);
      setError(id === null ? null : 'Invalid anime ID.');
      setWarning(null);
      controller.abort();
      return () => {
        active = false;
      };
    }

    setItem(null);
    setLoading(true);
    setError(null);
    setWarning(null);
    getAnimeDetails(id, controller.signal)
      .then((result) => {
        if (active) {
          setItem(result.item);
          setWarning(result.warning);
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

  return { item, loading, error, warning };
}
