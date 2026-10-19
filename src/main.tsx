import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { Auth0ProviderWithNavigate } from './components/auth/Auth0ProviderWithNavigate';
import { AnimeLibraryProvider } from './hooks/useAnimeLibrary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Auth0ProviderWithNavigate>
        <AnimeLibraryProvider>
          <App />
        </AnimeLibraryProvider>
      </Auth0ProviderWithNavigate>
    </BrowserRouter>
  </React.StrictMode>
);