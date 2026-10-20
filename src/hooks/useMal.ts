import { useCallback, useEffect, useState } from 'react';
import { malAPI } from '../services/mal';
import type { AnimeTitle, AnimeWatchHistoryItem } from '../types';

export function useMal() {
  const [connected, setConnected] = useState(malAPI.isConnected());
  const [error, setError] = useState<string | null>(null);
  const [animeList, setAnimeList] = useState<{ watchlist: AnimeTitle[]; watched: AnimeWatchHistoryItem[] }>({
    watchlist: [],
    watched: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const update = () => setConnected(malAPI.isConnected());
    window.addEventListener('mal-auth-changed', update);
    return () => window.removeEventListener('mal-auth-changed', update);
  }, []);

  const login = useCallback(async () => {
    setError(null);
    try {
      await malAPI.connect();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Could not connect to MyAnimeList.');
    }
  }, []);

  const logout = useCallback(() => {
    malAPI.disconnect();
    setConnected(false);
    setError(null);
    setAnimeList({ watchlist: [], watched: [] });
  }, []);

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await malAPI.getAnimeList();
      setAnimeList(list);
      return list;
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Could not load MyAnimeList list.';
      setError(message);
      throw fetchError;
    } finally {
      setLoading(false);
    }
  }, []);

  return { connected, error, loading, animeList, login, logout, fetchList };
}
