import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimeBrowser } from '../components/features/AnimeBrowser';
import { VideoPlayer } from '../components/features/VideoPlayer';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Image } from '../components/ui/Image';
import { useAnimeDetails } from '../hooks/useAnime';
import { useAnimeLibrary } from '../hooks/useAnimeLibrary';
import { getAniPmEmbedUrl } from '../services/anime';

export function AnimePage() {
  const { malId: rawMalId } = useParams<{ malId: string }>();
  const parsedMalId = Number(rawMalId);
  const malId = Number.isSafeInteger(parsedMalId) && parsedMalId > 0 ? parsedMalId : null;

  if (rawMalId) return <AnimeDetailsPage key={rawMalId} malId={malId} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-white">Anime</h1>
        <p className="text-dark-400">Discover anime from MyAnimeList and AniList, and watch with Ani.pm.</p>
      </div>
      <AnimeBrowser />
    </div>
  );
}

function AnimeDetailsPage({ malId }: { malId: number | null }) {
  const { item, loading, error, warning } = useAnimeDetails(malId);
  const { watchlist, toggleWatchlist, markWatched, addToContinueWatching } = useAnimeLibrary();
  const [episode, setEpisode] = useState(1);
  const [language, setLanguage] = useState<'sub' | 'dub'>('sub');
  const [playerOpen, setPlayerOpen] = useState(false);

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-dark-300">Loading anime details…</div>;
  }
  if (error || !item) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1 className="mb-2 text-2xl font-bold text-white">Anime not found</h1>
        <p className="mb-6 text-dark-400">{error || 'This anime could not be found.'}</p>
        <Link to="/anime" className="text-primary-400 hover:underline">Browse anime</Link>
      </div>
    );
  }

  const isSaved = watchlist.some((saved) => saved.malId === item.malId);
  const playbackUnavailable = item.aniPmAvailable === false;
  const validEpisode = Number.isSafeInteger(episode)
    && episode >= 1
    && (!item.episodes || episode <= item.episodes);

  const play = () => {
    if (playbackUnavailable || !validEpisode) return;
    addToContinueWatching(item, episode);
    setPlayerOpen(true);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap gap-2 text-sm text-dark-400">
        <Link to="/anime" className="hover:text-primary-400">Anime</Link>
        <span aria-hidden="true">/</span>
        <span className="truncate text-white" aria-current="page">{item.title}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]">
        <section>
          <div className="flex flex-col gap-6 sm:flex-row">
            <Image
              src={item.poster}
              alt={`${item.title} poster`}
              fallback="/placeholder-poster.svg"
              className="aspect-[2/3] w-full rounded-xl object-cover sm:w-64"
            />
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="primary">★ {item.score ? item.score.toFixed(2) : '—'}</Badge>
                <Badge variant="default">{item.ageRating}</Badge>
                <Badge variant="default">{item.status}</Badge>
              </div>
              <h1 className="text-3xl font-bold text-white">{item.title}</h1>
              {item.titleJapanese && <p className="text-dark-400">{item.titleJapanese}</p>}
              <p className="text-sm text-dark-400">
                {item.year || 'Year unknown'} · {item.episodes ? `${item.episodes} episodes` : 'Episode count unknown'}
              </p>
              <div className="flex flex-wrap gap-2">
                {item.genres.map((genre) => <Badge key={genre} variant="default">{genre}</Badge>)}
              </div>
              <p className="whitespace-pre-line leading-relaxed text-dark-300">{item.overview || 'No synopsis available.'}</p>
              {warning && (
                <p className="rounded-lg border border-amber-800 bg-amber-950/40 p-3 text-sm text-amber-200" role="status">
                  Some AniList or Ani.pm data could not be loaded. Playback can still use the MyAnimeList ID. {warning}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <Button onClick={play} disabled={playbackUnavailable || !validEpisode}>
                  {playbackUnavailable ? 'Not available on Ani.pm' : 'Watch on Ani.pm'}
                </Button>
                <Button variant="outline" aria-pressed={isSaved} onClick={() => toggleWatchlist(item)}>
                  {isSaved ? 'Remove from Anime Watchlist' : 'Add to Anime Watchlist'}
                </Button>
                <Button variant="outline" onClick={() => markWatched(item)}>Mark as Watched</Button>
              </div>
              {item.aniListUrl && (
                <a href={item.aniListUrl} target="_blank" rel="noopener noreferrer" className="mr-4 text-sm text-primary-400 hover:underline">
                  View AniList entry
                </a>
              )}
              <a href={item.malUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-400 hover:underline">
                View MyAnimeList entry
              </a>
            </div>
          </div>
        </section>

        <aside className="space-y-4 rounded-xl border border-dark-700 bg-dark-900 p-5">
          <h2 className="text-lg font-semibold text-white">Ani.pm Player</h2>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-dark-300">
            Episode
            <input
              type="number"
              min={1}
              max={item.episodes || undefined}
              value={episode}
              onChange={(event) => setEpisode(Number(event.target.value))}
              className="border border-dark-600 bg-dark-800 px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-dark-300">
            Audio
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value === 'dub' ? 'dub' : 'sub')}
              className="border border-dark-600 bg-dark-800 px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="sub">Subbed</option>
              <option value="dub">Dubbed</option>
            </select>
          </label>
          <Button onClick={play} disabled={playbackUnavailable || !validEpisode}>
            Play Episode
          </Button>
          <p className="text-xs text-dark-500">
            Player IDs use AniList when linked, with MyAnimeList as fallback.
          </p>
        </aside>
      </div>

      {playerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${item.title} episode ${episode} on Ani.pm`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPlayerOpen(false);
          }}
        >
          <div className="relative aspect-video w-full max-w-5xl">
            <VideoPlayer
              src={getAniPmEmbedUrl(item, episode, language)}
              title={`${item.title} episode ${episode}`}
            />
            <button
              type="button"
              onClick={() => setPlayerOpen(false)}
              className="absolute -top-12 right-0 rounded-lg bg-black/50 p-2 text-white hover:bg-black/70"
              aria-label="Close player"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
