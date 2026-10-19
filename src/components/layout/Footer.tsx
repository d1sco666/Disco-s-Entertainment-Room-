import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-dark-800 bg-app-background">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-10 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <Link to="/" aria-label="Home">
          <img
            src="https://media1.tenor.com/m/tcDvU7eJUGwAAAAd/metal-blackmetal-cat-headbang-corpsepaint.gif"
            alt=""
            loading="lazy"
            className="h-12 w-16 object-contain"
          />
        </Link>
        <div className="space-y-2 text-center sm:text-right">
          <p className="text-sm text-dark-400">
            © {new Date().getFullYear()} <a
              href="https://github.com/d1sco666"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-dark-200 underline underline-offset-4"
            >
              d1sco666
            </a>
          </p>
          <p className="text-xs text-dark-500">
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </div>
      </div>
    </footer>
  );
}
