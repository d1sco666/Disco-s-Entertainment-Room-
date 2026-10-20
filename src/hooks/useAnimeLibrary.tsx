import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AnimeContinueWatchingItem, AnimeTitle, AnimeWatchHistoryItem } from '../types';

const ANIME_WATCHLIST_KEY = 'entertainment-room-anime-watchlist';
const ANIME_WATCHED_KEY = 'entertainment-room-anime-watched';
const ANIME_CONTINUE_KEY = 'entertainment-room-anime-continue';

interface AnimeLibraryValue {
  watchlist: AnimeTitle[];
  watched: AnimeWatchHistoryItem[];
  continueWatching: AnimeContinueWatchingItem[];
  storageError: string | null;
  toggleWatchlist: (item: AnimeTitle) => void;
  removeFromWatchlist: (id: string) => void;
  markWatched: (item: AnimeTitle) => void;
  removeFromWatched: (id: string) => void;
  addToContinueWatching: (item: AnimeTitle, episode: number) => void;
  removeFromContinueWatching: (id: string) => void;
  replaceWatchlist: (items: AnimeTitle[]) => void;
  replaceWatched: (items: AnimeWatchHistoryItem[]) => void;
}

const AnimeLibraryContext = createContext<AnimeLibraryValue | null>(null);

function validAnimeTitle(value: unknown): value is AnimeTitle {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === 'string'
    && (typeof item.malId === 'number' || item.malId === undefined)
    && typeof item.title === 'string'
    && typeof item.titleJapanese === 'string'
    && typeof item.year === 'number'
    && typeof item.overview === 'string'
    && typeof item.poster === 'string'
    && typeof item.banner === 'string'
    && typeof item.score === 'number'
    && typeof item.ageRating === 'string'
    && Array.isArray(item.genres)
    && item.genres.every((genre) => typeof genre === 'string');
}

function readCollection<T>(key: string, valid: (value: unknown) => value is T): T[] {
  const stored = window.localStorage.getItem(key);
  if (!stored) return [];
  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed) || !parsed.every(valid)) {
    throw new Error('Saved anime data is invalid and could not be loaded.');
  }
  return parsed;
}

function isWatched(value: unknown): value is AnimeWatchHistoryItem {
  return Boolean(value && typeof value === 'object'
    && validAnimeTitle((value as AnimeWatchHistoryItem).item)
    && typeof (value as AnimeWatchHistoryItem).watchedAt === 'number');
}

function isContinueWatching(value: unknown): value is AnimeContinueWatchingItem {
  return Boolean(value && typeof value === 'object'
    && validAnimeTitle((value as AnimeContinueWatchingItem).item)
    && typeof (value as AnimeContinueWatchingItem).episode === 'number'
    && typeof (value as AnimeContinueWatchingItem).lastWatchedAt === 'number');
}

export function AnimeLibraryProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => {
    try {
      return {
        watchlist: readCollection(ANIME_WATCHLIST_KEY, validAnimeTitle),
        watched: readCollection(ANIME_WATCHED_KEY, isWatched),
        continueWatching: readCollection(ANIME_CONTINUE_KEY, isContinueWatching),
        error: null,
      };
    } catch (error) {
      return {
        watchlist: [] as AnimeTitle[],
        watched: [] as AnimeWatchHistoryItem[],
        continueWatching: [] as AnimeContinueWatchingItem[],
        error: error instanceof Error ? error.message : 'Saved anime could not be loaded.',
      };
    }
  });
  const [watchlist, setWatchlist] = useState(initial.watchlist);
  const [watched, setWatched] = useState(initial.watched);
  const [continueWatching, setContinueWatching] = useState(initial.continueWatching);
  const [storageError, setStorageError] = useState<string | null>(initial.error);

  useEffect(() => {
    try {
      window.localStorage.setItem(ANIME_WATCHLIST_KEY, JSON.stringify(watchlist));
    } catch {
      setStorageError('Your anime watchlist could not be saved in this browser.');
    }
  }, [watchlist]);

  useEffect(() => {
    try {
      window.localStorage.setItem(ANIME_WATCHED_KEY, JSON.stringify(watched));
    } catch {
      setStorageError('Your anime watched history could not be saved in this browser.');
    }
  }, [watched]);

  useEffect(() => {
    try {
      window.localStorage.setItem(ANIME_CONTINUE_KEY, JSON.stringify(continueWatching));
    } catch {
      setStorageError('Anime Continue Watching could not be saved in this browser.');
    }
  }, [continueWatching]);

  const toggleWatchlist = useCallback((item: AnimeTitle) => {
    setWatchlist((current) => current.some((entry) => entry.id === item.id)
      ? current.filter((entry) => entry.id !== item.id)
      : [item, ...current]);
  }, []);
  const removeFromWatchlist = useCallback((id: string) => {
    setWatchlist((current) => current.filter((item) => item.id !== id));
  }, []);
  const markWatched = useCallback((item: AnimeTitle) => {
    setWatched((current) => [{ item, watchedAt: Date.now() }, ...current.filter((entry) => entry.item.id !== item.id)]);
  }, []);
  const removeFromWatched = useCallback((id: string) => {
    setWatched((current) => current.filter((entry) => entry.item.id !== id));
  }, []);
  const addToContinueWatching = useCallback((item: AnimeTitle, episode: number) => {
    setContinueWatching((current) => [
      { item, episode, lastWatchedAt: Date.now() },
      ...current.filter((entry) => entry.item.id !== item.id),
    ]);
  }, []);
  const removeFromContinueWatching = useCallback((id: string) => {
    setContinueWatching((current) => current.filter((entry) => entry.item.id !== id));
  }, []);
  const replaceWatchlist = useCallback((items: AnimeTitle[]) => setWatchlist(items), []);
  const replaceWatched = useCallback((items: AnimeWatchHistoryItem[]) => setWatched(items), []);

  const value = useMemo(() => ({
    watchlist,
    watched,
    continueWatching,
    storageError,
    toggleWatchlist,
    removeFromWatchlist,
    markWatched,
    removeFromWatched,
    addToContinueWatching,
    removeFromContinueWatching,
    replaceWatchlist,
    replaceWatched,
  }), [
    watchlist,
    watched,
    continueWatching,
    storageError,
    toggleWatchlist,
    removeFromWatchlist,
    markWatched,
    removeFromWatched,
    addToContinueWatching,
    removeFromContinueWatching,
    replaceWatchlist,
    replaceWatched,
  ]);

  return <AnimeLibraryContext.Provider value={value}>{children}</AnimeLibraryContext.Provider>;
}

export function useAnimeLibrary() {
  const context = useContext(AnimeLibraryContext);
  if (!context) throw new Error('useAnimeLibrary must be used within AnimeLibraryProvider');
  return context;
}
