import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { classNames } from '@/utils/helpers';
import { simklAPI } from '@/services/simkl';
import { useAuth0 } from '@auth0/auth0-react';
import {
  isAuth0LoginConfirmed,
  setAuth0LoginPending,
  setAuth0LoginConfirmed,
  subscribeToAuth0LoginState,
  useAuth0RedirectUser,
} from '@/components/auth/Auth0ProviderWithNavigate';

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [simklConnected, setSimklConnected] = useState(simklAPI.isConnected());
  const [simklLoginError, setSimklLoginError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const updateSimklStatus = () => setSimklConnected(simklAPI.isConnected());
    window.addEventListener('simkl-auth-changed', updateSimklStatus);
    return () => window.removeEventListener('simkl-auth-changed', updateSimklStatus);
  }, []);

  useEffect(() => {
    setShowSearch(false);
    setShowMenu(false);
    setSearchQuery('');
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSimklLogin = async () => {
    setSimklLoginError(null);
    try {
      await simklAPI.connect();
    } catch (error) {
      setSimklLoginError(error instanceof Error ? error.message : 'Could not connect to Simkl.');
    }
  };

  return (
    <header className={classNames(
      'fixed top-0 left-0 right-0 z-40 bg-app-background',
      scrolled && 'shadow-sm'
    )}>
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center" aria-label="Home">
            <img
              src="https://media1.tenor.com/m/tcDvU7eJUGwAAAAd/metal-blackmetal-cat-headbang-corpsepaint.gif"
              alt=""
              className="h-12 w-16 object-contain"
            />
          </Link>

          <div className="flex-1 max-w-xl mx-8 hidden md:block">
            <form onSubmit={handleSearch} className="relative" role="search">
              <label htmlFor="search" className="sr-only">Search movies and TV shows</label>
              <Input
                id="search"
                type="search"
                placeholder="Search movies, TV shows..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                leftIcon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
                className="bg-dark-100 dark:bg-dark-800 border-dark-200 dark:border-dark-700 focus:bg-white dark:focus:bg-dark-800"
              />
            </form>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/movies" className="hidden sm:block px-3 py-2 text-sm font-medium text-dark-700 dark:text-dark-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800">
              Movies
            </Link>
            <Link to="/tv-shows" className="hidden sm:block px-3 py-2 text-sm font-medium text-dark-700 dark:text-dark-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800">
              TV Shows
            </Link>
            <Link to="/watchlist" className="hidden sm:block px-3 py-2 text-sm font-medium text-dark-700 dark:text-dark-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800">
              Watchlist
            </Link>
            <Link to="/watched" className="hidden sm:block px-3 py-2 text-sm font-medium text-dark-700 dark:text-dark-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800">
              Watched
            </Link>
            {simklConnected ? (
              <Link to="/watchlist" className="hidden sm:block px-3 py-2 text-sm font-medium text-emerald-400 hover:bg-dark-800">
                Simkl connected
              </Link>
            ) : (
              <Button size="sm" className="hidden sm:inline-flex" onClick={handleSimklLogin}>
                Sign in with Simkl
              </Button>
            )}
            <Auth0Controls />
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label={showSearch ? 'Close search' : 'Open search'}
              aria-expanded={showSearch}
              onClick={() => {
                setShowSearch((visible) => !visible);
                setShowMenu(false);
              }}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label={showMenu ? 'Close menu' : 'Open menu'}
              aria-expanded={showMenu}
              onClick={() => {
                setShowMenu((visible) => !visible);
                setShowSearch(false);
              }}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>

        {showSearch && (
          <div className="md:hidden py-4 border-t border-dark-200 dark:border-dark-700">
            <form onSubmit={handleSearch} className="relative" role="search">
              <label htmlFor="mobile-search" className="sr-only">Search movies and TV shows</label>
              <Input
                id="mobile-search"
                type="search"
                placeholder="Search movies, TV shows..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                leftIcon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
                className="bg-dark-100 dark:bg-dark-800 border-dark-200 dark:border-dark-700"
                autoFocus
              />
            </form>
          </div>
        )}
        {showMenu && (
          <div className="md:hidden border-t border-dark-200 dark:border-dark-700 py-3">
            <nav aria-label="Mobile navigation" className="flex flex-col">
              <Link to="/movies" className="rounded-lg px-3 py-2 text-sm font-medium text-dark-700 hover:bg-dark-100 dark:text-dark-300 dark:hover:bg-dark-800">Movies</Link>
              <Link to="/tv-shows" className="rounded-lg px-3 py-2 text-sm font-medium text-dark-700 hover:bg-dark-100 dark:text-dark-300 dark:hover:bg-dark-800">TV Shows</Link>
              <Link to="/watchlist" className="rounded-lg px-3 py-2 text-sm font-medium text-dark-700 hover:bg-dark-100 dark:text-dark-300 dark:hover:bg-dark-800">Watchlist</Link>
              <Link to="/watched" className="rounded-lg px-3 py-2 text-sm font-medium text-dark-700 hover:bg-dark-100 dark:text-dark-300 dark:hover:bg-dark-800">Watched</Link>
              <Link to="/trending" className="rounded-lg px-3 py-2 text-sm font-medium text-dark-700 hover:bg-dark-100 dark:text-dark-300 dark:hover:bg-dark-800">Trending</Link>
              {simklConnected ? (
                <Link to="/watchlist" className="rounded-lg px-3 py-2 text-sm font-medium text-emerald-400 hover:bg-dark-800">Simkl connected</Link>
              ) : (
                <button
                  type="button"
                  onClick={handleSimklLogin}
                  className="rounded-lg px-3 py-2 text-left text-sm font-medium text-primary-400 hover:bg-dark-800"
                >
                  Sign in with Simkl
                </button>
              )}
              <Auth0Controls mobile />
            </nav>
          </div>
        )}
        {simklLoginError && (
          <p className="pb-3 text-right text-xs text-red-400" role="alert">{simklLoginError}</p>
        )}
      </nav>
    </header>
  );
}

function Auth0Controls({ mobile = false }: { mobile?: boolean }) {
  const configured = Boolean(import.meta.env.VITE_AUTH0_DOMAIN && import.meta.env.VITE_AUTH0_CLIENT_ID);
  if (!configured) return <Auth0SetupButton mobile={mobile} />;
  return <ConfiguredAuth0Controls mobile={mobile} />;
}

function Auth0SetupButton({ mobile }: { mobile: boolean }) {
  const [showSetupMessage, setShowSetupMessage] = useState(false);

  return (
    <div className={mobile ? 'px-3 py-2' : 'relative'}>
      <Button
        size="sm"
        className={mobile ? 'w-full justify-start' : 'hidden sm:inline-flex'}
        onClick={() => setShowSetupMessage(true)}
      >
        Log in
      </Button>
      {showSetupMessage && (
        <p className="mt-1 text-xs text-amber-300" role="alert">
          Add VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID to .env.local to enable login.
        </p>
      )}
    </div>
  );
}

function ConfiguredAuth0Controls({ mobile }: { mobile: boolean }) {
  const { isAuthenticated, isLoading, user, loginWithRedirect, logout } = useAuth0();
  const redirectUser = useAuth0RedirectUser();
  const [callbackConfirmed, setCallbackConfirmed] = useState(isAuth0LoginConfirmed);
  const loggedIn = isAuthenticated || Boolean(user) || Boolean(redirectUser) || callbackConfirmed;
  const [authError, setAuthError] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = subscribeToAuth0LoginState(() => setCallbackConfirmed(isAuth0LoginConfirmed()));
    setCallbackConfirmed(isAuth0LoginConfirmed());
    return unsubscribe;
  }, []);

  const handleAuthAction = async () => {
    setAuthError(null);
    try {
      if (loggedIn) {
        setAuth0LoginConfirmed(false);
        await logout({ logoutParams: { returnTo: window.location.origin } });
      } else {
        setAuth0LoginPending();
        await loginWithRedirect({
          appState: { returnTo: `${location.pathname}${location.search}` },
        });
      }
    } catch (error) {
      setAuth0LoginConfirmed(false);
      setAuthError(error instanceof Error ? error.message : 'Could not complete Auth0 sign-in.');
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant={loggedIn ? 'outline' : 'primary'}
        className={classNames(
          mobile ? 'w-full justify-start' : 'hidden sm:inline-flex',
          loggedIn && 'border-emerald-500 text-emerald-400'
        )}
        onClick={handleAuthAction}
        disabled={isLoading}
        aria-label={loggedIn ? 'Log out of your account' : 'Log in with Auth0'}
        title={loggedIn && (user?.name || redirectUser?.name)
          ? `Logged in as ${user?.name || redirectUser?.name}. Click to log out.`
          : undefined}
      >
        {isLoading
          ? 'Checking login…'
          : loggedIn
            ? 'Logged in'
            : 'Log in'}
      </Button>
      {authError && (
        <p className="text-xs text-red-400" role="alert">
          {authError}
        </p>
      )}
    </>
  );
}