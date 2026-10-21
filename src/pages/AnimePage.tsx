import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimeBrowser } from '../components/features/AnimeBrowser';
import { VideoPlayer } from '../components/features/VideoPlayer';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAnimeDetails } from '../hooks/useAnime';
import { useAnimeLibrary } from '../hooks/useAnimeLibrary';
import { getEpisodeUrl } from '../services/anime';

export function AnimePage() {
  const { id: rawId } = useParams<{ id: string }>();

  if (rawId) return <AnimeDetailsPage key={rawId} id={rawId} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-white">Anime</h1>
        <p className="text-dark-400">Browse the anime catalog and watch episodes.</p>
      </div>
      <AnimeBrowser />
    </div>
  );
}

function AnimeDetailsPage({ id }: { id: string }) {
  const { item, seasons, loading, error } = useAnimeDetails(id);
  const { watchlist, toggleWatchlist, markWatched, addToContinueWatching } = useAnimeLibrary();
  const [seasonIndex, setSeasonIndex] = useState(0);
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

  const selectedSeason = seasons.length ? seasons[seasonIndex] : item;
  const seasonEpisodeCount = selectedSeason.episodes || 0;
  const validEpisode = Number.isSafeInteger(episode) && episode >= 1 && episode <= (seasonEpisodeCount || 0);
  const selectedEpisodeNumber = episode;
  const playableUrl = validEpisode && selectedSeason.aniId
    ? getEpisodeUrl(selectedSeason.aniId, { id: selectedEpisodeNumber, number: selectedEpisodeNumber } as import('../services/anime').AnimeEpisode, language)
    : '';

  const play = () => {
    if (!validEpisode || !playableUrl) return;
    addToContinueWatching(selectedSeason, episode);
    setPlayerOpen(true);
  };

  const handleSeasonChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const index = Number(event.target.value);
    if (Number.isFinite(index) && index >= 0 && index < seasons.length) {
      setSeasonIndex(index);
      setEpisode(1);
    }
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
            <img
              src={item.poster}
              alt={`${item.title} poster`}
              className="w-full max-w-xs rounded-xl object-contain sm:w-64"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/placeholder-poster.svg';
              }}
            />
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="primary">★ {item.score ? item.score.toFixed(2) : '—'}</Badge>
                <Badge variant="default">{item.rating}</Badge>
                <Badge variant="default">{item.status}</Badge>
              </div>
              <h1 className="text-3xl font-bold text-white">{item.title}</h1>
              {item.alternative && <p className="text-dark-400">{item.alternative}</p>}
              <p className="text-sm text-dark-400">
                {item.year || 'Year unknown'} · {item.episodes ? `${item.episodes} episodes` : 'Episode count unknown'}
              </p>
              <div className="flex flex-wrap gap-2">
                {item.genres.map((genre) => <Badge key={genre} variant="default">{genre}</Badge>)}
              </div>
              {seasons.length > 1 && (
                <div className="mt-3">
                  <label className="block mb-1.5 text-sm font-medium text-dark-300">Season</label>
                  <select
                    value={String(seasonIndex)}
                    onChange={handleSeasonChange}
                    className="w-full border border-dark-600 bg-dark-800 px-3 py-2.5 text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    aria-label="Select season"
                  >
                    {seasons.map((s, i) => (
                      <option key={s.id} value={String(i)}>
                        Season {i + 1}{s.season ? ` · ${s.season}` : ''} ({s.episodes || 0} eps)
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <p className="whitespace-pre-line leading-relaxed text-dark-300">{item.overview || 'No synopsis available.'}</p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={play} disabled={!validEpisode || !playableUrl}>
                  {validEpisode && playableUrl ? 'Watch Episode' : 'Episode not playable'}
                </Button>
                <Button variant="outline" aria-pressed={watchlist.some((saved) => saved.id === selectedSeason.id)} onClick={() => toggleWatchlist(selectedSeason)}>
                  {watchlist.some((saved) => saved.id === selectedSeason.id) ? 'Remove from Anime Watchlist' : 'Add to Anime Watchlist'}
                </Button>
                <Button variant="outline" onClick={() => markWatched(selectedSeason)}>Mark as Watched</Button>
              </div>

            </div>
          </div>
        </section>

        <aside className="space-y-4 rounded-xl border border-dark-700 bg-dark-900 p-5">
          <h2 className="text-lg font-semibold text-white">Player</h2>
          {seasonEpisodeCount === 0 && (
            <p className="text-sm text-dark-400">No episodes available for this title.</p>
          )}
          {seasonEpisodeCount > 0 && (
            <>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-dark-300">
                Season
                <select
                  value={String(seasonIndex)}
                  onChange={handleSeasonChange}
                  disabled={seasons.length <= 1}
                  className="border border-dark-600 bg-dark-800 px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  aria-label="Select season"
                >
                  {seasons.map((s, i) => (
                    <option key={s.id} value={String(i)}>
                      Season {i + 1}{s.season ? ` · ${s.season}` : ''} ({s.episodes || 0} eps)
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-dark-300">
                Episode
                <select
                  value={episode}
                  onChange={(event) => setEpisode(Number(event.target.value))}
                  className="border border-dark-600 bg-dark-800 px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {Array.from({ length: seasonEpisodeCount }, (_, i) => i + 1).map((epNumber) => (
                    <option key={epNumber} value={epNumber}>
                      Episode {epNumber}
                    </option>
                  ))}
                </select>
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
              <Button onClick={play} disabled={!validEpisode || !playableUrl}>
                Play Episode
              </Button>
              {!playableUrl && validEpisode && (
                <p className="text-xs text-red-400">No playable link for the selected language.</p>
              )}
              <p className="text-xs text-dark-500">
                Episode playback links are not available from AniList.
              </p>
            </>
          )}
        </aside>
      </div>

      {playerOpen && playableUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedSeason.title} episode ${selectedEpisodeNumber}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPlayerOpen(false);
          }}
        >
          <div className="relative aspect-video w-full max-w-5xl">
            <VideoPlayer
              src={playableUrl}
              title={`${selectedSeason.title} episode ${selectedEpisodeNumber}`}
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
