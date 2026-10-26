import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ContinueWatchingItem, CineSrcTVShow, SavedMedia, WatchedItem } from '../types';

const WATCHLIST_KEY = 'entertainment-room-watchlist';
const CONTINUE_WATCHING_KEY = 'entertainment-room-continue-watching';
const WATCHED_KEY = 'entertainment-room-watched';

interface MediaLibraryContextValue {
  watchlist: SavedMedia[];
  continueWatching: ContinueWatchingItem[];
  watched: WatchedItem[];
  storageError: string | null;
  toggleWatchlist: (media: SavedMedia) => void;
  addToContinueWatching: (media: SavedMedia, episode?: ContinueWatchingItem['episode']) => void;
  removeFromWatchlist: (type: SavedMedia['type'], id: string) => void;
  removeFromContinueWatching: (type: SavedMedia['type'], id: string) => void;
  isInWatchlist: (type: SavedMedia['type'], id: string) => boolean;
  markWatched: (media: SavedMedia, episode?: WatchedItem['episode']) => void;
  removeFromWatched: (type: SavedMedia['type'], id: string, episode?: WatchedItem['episode']) => void;
  isWatched: (type: SavedMedia['type'], id: string, episode?: WatchedItem['episode']) => boolean;
  replaceWatchlist: (items: SavedMedia[]) => void;
  replaceWatched: (items: WatchedItem[]) => void;
}

const MediaLibraryContext = createContext<MediaLibraryContextValue | null>(null);

function isSavedMedia(value: unknown): value is SavedMedia {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  if (record.type !== 'movie' && record.type !== 'tv') return false;
  if (!record.item || typeof record.item !== 'object') return false;

  const item = record.item as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    typeof item.poster === 'string' &&
    typeof item.rating === 'number' &&
    Array.isArray(item.genres) &&
    item.genres.every((genre) => typeof genre === 'string') &&
    (record.type === 'movie' ? typeof item.title === 'string' : typeof item.name === 'string')
  );
}

function isContinueWatchingItem(value: unknown): value is ContinueWatchingItem {
  if (!isSavedMedia(value)) return false;
  const record = value as unknown as Record<string, unknown>;
  if (typeof record.lastWatchedAt !== 'number') return false;
  if (record.episode === undefined) return true;
  if (!record.episode || typeof record.episode !== 'object') return false;

  const episode = record.episode as Record<string, unknown>;
  return (
    typeof episode.seasonNumber === 'number' &&
    typeof episode.episodeNumber === 'number' &&
    typeof episode.name === 'string'
  );
}

function isWatchedItem(value: unknown): value is WatchedItem {
  if (!isSavedMedia(value)) return false;
  const record = value as unknown as Record<string, unknown>;
  if (typeof record.watchedAt !== 'number') return false;
  if (record.episode === undefined) return true;
  if (!record.episode || typeof record.episode !== 'object') return false;
  const episode = record.episode as Record<string, unknown>;
  return typeof episode.seasonNumber === 'number'
    && typeof episode.episodeNumber === 'number'
    && typeof episode.name === 'string';
}

function episodeKey(episode?: WatchedItem['episode']) {
  return episode ? `${episode.seasonNumber}.${episode.episodeNumber}` : 'complete';
}

function watchedMediaKey(type: SavedMedia['type'], id: string, episode?: WatchedItem['episode']) {
  return `${type}:${id}:${episodeKey(episode)}`;
}

function readStorage<T>(
  key: string,
  isValid: (value: unknown) => value is T
): { items: T[]; error: string | null } {
  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) return { items: [], error: null };
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed) || !parsed.every(isValid)) {
      return { items: [], error: 'Saved media data is invalid and could not be loaded.' };
    }
    return { items: parsed, error: null };
  } catch {
    return { items: [], error: 'Saved media could not be read from this browser.' };
  }
}

export function MediaLibraryProvider({ children }: { children: ReactNode }) {
  const [initialState] = useState(() => {
    const watchlist = readStorage(WATCHLIST_KEY, isSavedMedia);
    const continueWatching = readStorage(CONTINUE_WATCHING_KEY, isContinueWatchingItem);
    const watched = readStorage(WATCHED_KEY, isWatchedItem);
    return {
      watchlist: watchlist.items,
      continueWatching: continueWatching.items,
      watched: watched.items,
      storageError: watchlist.error || continueWatching.error || watched.error,
    };
  });
  const [watchlist, setWatchlist] = useState(initialState.watchlist);
  const [continueWatching, setContinueWatching] = useState(initialState.continueWatching);
  const [watched, setWatched] = useState(initialState.watched);
  const [storageError, setStorageError] = useState<string | null>(initialState.storageError);

  useEffect(() => {
    try {
      window.localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
    } catch {
      setStorageError('Your watchlist could not be saved in this browser.');
    }
  }, [watchlist]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CONTINUE_WATCHING_KEY, JSON.stringify(continueWatching));
    } catch {
      setStorageError('Continue Watching could not be saved in this browser.');
    }
  }, [continueWatching]);

  useEffect(() => {
    try {
      window.localStorage.setItem(WATCHED_KEY, JSON.stringify(watched));
    } catch {
      setStorageError('Your watched history could not be saved in this browser.');
    }
  }, [watched]);

  const isInWatchlist = useCallback(
    (type: SavedMedia['type'], id: string) => watchlist.some((entry) => entry.type === type && entry.item.id === id),
    [watchlist]
  );

  const toggleWatchlist = useCallback((media: SavedMedia) => {
    setWatchlist((current) => {
      const exists = current.some((entry) => entry.type === media.type && entry.item.id === media.item.id);
      return exists
        ? current.filter((entry) => entry.type !== media.type || entry.item.id !== media.item.id)
        : [media, ...current];
    });
  }, []);

  const addToContinueWatching = useCallback((media: SavedMedia, episode?: ContinueWatchingItem['episode']) => {
    setContinueWatching((current) => [
      { ...media, episode, lastWatchedAt: Date.now() },
      ...current.filter((entry) => entry.type !== media.type || entry.item.id !== media.item.id),
    ]);
  }, []);

  const removeFromWatchlist = useCallback((type: SavedMedia['type'], id: string) => {
    setWatchlist((current) => current.filter((entry) => entry.type !== type || entry.item.id !== id));
  }, []);

  const removeFromContinueWatching = useCallback((type: SavedMedia['type'], id: string) => {
    setContinueWatching((current) => current.filter((entry) => entry.type !== type || entry.item.id !== id));
  }, []);

  const markWatched = useCallback((media: SavedMedia, episode?: WatchedItem['episode']) => {
    const entry: WatchedItem = { ...media, episode, watchedAt: Date.now() };
    const key = watchedMediaKey(media.type, media.item.id, episode);
    setWatched((current) => [entry, ...current.filter((item) => watchedMediaKey(item.type, item.item.id, item.episode) !== key)]);
  }, []);

  const markSeasonWatched = useCallback((id: string, seasonNumber: number) => {
    setWatched((current) => {
      // Find the TV show entry with numberOfSeasons property
      const showEntry = current.find(
        (item) => item.type === 'tv' && item.item?.numberOfSeasons != null
      );
      if (!showEntry) return current;

      const tvShow = showEntry.item as CineSrcTVShow;
      const totalEpisodes = tvShow.numberOfEpisodes || 0;
      const episodesPerSeason = totalEpisodes / Math.max(tvShow.numberOfSeasons || 1, 1);

      // Create watched entries for each episode in this season
      const newEntries: WatchedItem[] = [];
      for (let ep = 1; ep <= episodesPerSeason; ep++) {
        const episodeKey = watchedMediaKey('tv', id, { seasonNumber, episodeNumber: ep, name: `Episode ${ep}` });
        // Remove existing entry for this episode if it exists
        current = current.filter(
          (item) => watchedMediaKey(item.type, item.item.id, item.episode) !== episodeKey
        );
        // Add new watched entry
        newEntries.push({
          type: 'tv',
          item: tvShow,
          watchedAt: Date.now(),
          episode: { seasonNumber, episodeNumber: ep, name: `Episode ${ep}` },
        });
      }

      // Replace watched list with existing non-TV entries plus new season entries
      return [...current.filter((item) => item.type !== 'tv' || item.item.id !== id), ...newEntries];
    });
  }, []);

  const removeFromWatched = useCallback((type: SavedMedia['type'], id: string, episode?: WatchedItem['episode']) => {
    const key = watchedMediaKey(type, id, episode);
    setWatched((current) => current.filter((item) => watchedMediaKey(item.type, item.item.id, item.episode) !== key));
  }, []);
  const isWatched = useCallback((type: SavedMedia['type'], id: string, episode?: WatchedItem['episode']) => {
    const key = watchedMediaKey(type, id, episode);
    return watched.some((item) => watchedMediaKey(item.type, item.item.id, item.episode) === key);
  }, [watched]);
  const replaceWatchlist = useCallback((items: SavedMedia[]) => setWatchlist(items), []);
  const replaceWatched = useCallback((items: WatchedItem[]) => setWatched(items), []);

  const value = useMemo(
    () => ({
      watchlist,
      continueWatching,
      watched,
      storageError,
      toggleWatchlist,
      addToContinueWatching,
      removeFromWatchlist,
      removeFromContinueWatching,
      isInWatchlist,
      markWatched,
      markSeasonWatched,
      removeFromWatched,
      isWatched,
      replaceWatchlist,
      replaceWatched,
    }),
    [watchlist, continueWatching, watched, storageError, toggleWatchlist, addToContinueWatching, removeFromWatchlist, removeFromContinueWatching, isInWatchlist, markWatched, removeFromWatched, isWatched, replaceWatchlist, replaceWatched]
  );

  return <MediaLibraryContext.Provider value={value}>{children}</MediaLibraryContext.Provider>;
}

export function useMediaLibrary() {
  const context = useContext(MediaLibraryContext);
  if (!context) throw new Error('useMediaLibrary must be used within a MediaLibraryProvider');
  return context;
}
