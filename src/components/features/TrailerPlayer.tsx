import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

interface TrailerPlayerProps {
  title: string;
  videoKey: string | null;
  loading: boolean;
  error: string | null;
}

export function TrailerPlayer({ title, videoKey, loading, error }: TrailerPlayerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title} Trailer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-video overflow-hidden rounded-lg bg-black">
          {videoKey ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoKey)}?autoplay=0&controls=1&rel=0`}
              title={`${title} trailer`}
              className="h-full w-full border-0"
              loading="lazy"
              allow="encrypted-media; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-dark-300" role={error ? 'alert' : 'status'}>
              {loading ? 'Finding trailer…' : error ? 'Trailer unavailable.' : 'No trailer available.'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
