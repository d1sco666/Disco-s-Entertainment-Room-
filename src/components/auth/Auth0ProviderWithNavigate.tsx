import { Auth0Provider } from '@auth0/auth0-react';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import type { User } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';

const Auth0RedirectUserContext = createContext<User | null>(null);
const AUTH0_LOGIN_STATE_KEY = 'entertainment-room-auth0-logged-in';
const AUTH0_LOGIN_PENDING_KEY = 'entertainment-room-auth0-login-pending';
const AUTH0_LOGIN_STATE_EVENT = 'auth0-login-state-changed';

export function useAuth0RedirectUser() {
  return useContext(Auth0RedirectUserContext);
}

export function isAuth0LoginConfirmed() {
  return sessionStorage.getItem(AUTH0_LOGIN_STATE_KEY) === 'true';
}

export function setAuth0LoginConfirmed(confirmed: boolean) {
  if (confirmed) {
    sessionStorage.setItem(AUTH0_LOGIN_STATE_KEY, 'true');
    sessionStorage.removeItem(AUTH0_LOGIN_PENDING_KEY);
  } else {
    sessionStorage.removeItem(AUTH0_LOGIN_STATE_KEY);
    sessionStorage.removeItem(AUTH0_LOGIN_PENDING_KEY);
  }
  window.dispatchEvent(new Event(AUTH0_LOGIN_STATE_EVENT));
}

export function setAuth0LoginPending() {
  sessionStorage.setItem(AUTH0_LOGIN_PENDING_KEY, 'true');
}

export function subscribeToAuth0LoginState(listener: () => void) {
  window.addEventListener(AUTH0_LOGIN_STATE_EVENT, listener);
  return () => window.removeEventListener(AUTH0_LOGIN_STATE_EVENT, listener);
}

export function Auth0ProviderWithNavigate({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const [redirectUser, setRedirectUser] = useState<User | null>(null);
  const domain = import.meta.env.VITE_AUTH0_DOMAIN;
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;

  useEffect(() => {
    if (!domain || !clientId) return;
    if (window.location.pathname === '/simkl/callback') return;
    const params = new URLSearchParams(window.location.search);
    if (params.has('error')) {
      sessionStorage.removeItem(AUTH0_LOGIN_PENDING_KEY);
      return;
    }
    if (
      params.has('code')
      && params.has('state')
      && sessionStorage.getItem(AUTH0_LOGIN_PENDING_KEY) === 'true'
    ) {
      setAuth0LoginConfirmed(true);
    }
  }, [domain, clientId]);

  if (!domain || !clientId) return children;

  const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

  return (
    <Auth0RedirectUserContext.Provider value={redirectUser}>
      <Auth0Provider
        domain={domain}
        clientId={clientId}
        authorizationParams={{
          redirect_uri: window.location.origin,
          ...(audience ? { audience } : {}),
        }}
        skipRedirectCallback={window.location.pathname === '/simkl/callback'}
        onRedirectCallback={(appState, user) => {
          if (user) {
            setRedirectUser(user);
          }
          setAuth0LoginConfirmed(true);
          navigate(appState?.returnTo || window.location.pathname);
        }}
      >
        {children}
      </Auth0Provider>
    </Auth0RedirectUserContext.Provider>
  );
}
