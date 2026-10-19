# Entertainment Room

A personal movie and TV discovery website using **TMDB** for title metadata, a choice of **Vimeus** or **CineSrc** embedded players, and **Simkl** for optional watchlist and watched-history sync.

## Features

- 🎬 **Movie & TV Discovery** - Popular, trending, search, posters, ratings, and certifications from TMDB
- 🎥 **Player Choice** - Choose between Vimeus and CineSrc for movies and TV episodes
- 🔍 **Search Functionality** - Find content instantly
- 📱 **Responsive Design** - Works on all devices
- 🌙 **Dark Mode** - Easy on the eyes
- ⚡ **Fast Performance** - Built with Vite + React + TypeScript

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **State Management**: React hooks
- **Routing**: React Router v7
- **Video Player**: Vimeus and CineSrc embed players
- **Metadata API**: TMDB
- **Library Sync**: Simkl OAuth 2.0 (PKCE)
- **Authentication**: Auth0 SPA SDK
- **Build and lint**: Vite 6 and ESLint 9

## Getting Started

### Prerequisites

- Node.js 20.19+, 22.13+, or 24+
- npm 10+
- TMDB v3 API key

### Installation

```bash
# Clone the repository
git clone https://github.com/d1sco666/Entertainment-Room-666.git
cd Entertainment-Room-666

# Install locked dependencies
npm ci

# Copy .env.example to .env.local and set:
# VITE_TMDB_API_KEY=your_tmdb_v3_api_key
# VITE_SIMKL_CLIENT_ID=your_simkl_auth_v2_client_id
# VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
# VITE_AUTH0_CLIENT_ID=your_auth0_client_id
# VITE_VIMEUS_VIEW_KEY=your_vimeus_view_key
# The Vimeus view key is a public embed parameter; configure its allowed domains in Vimeus.

# Start development server
npm run dev
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_TMDB_API_KEY` | TMDB v3 API key used by the browser to load catalog metadata | Yes |
| `VITE_SIMKL_CLIENT_ID` | Public Simkl Auth V2 client ID (the client ID provided for this project is the default) | No |
| `VITE_AUTH0_DOMAIN` | Auth0 tenant domain for SPA login | No |
| `VITE_AUTH0_CLIENT_ID` | Auth0 Single Page Application client ID | No |
| `VITE_AUTH0_AUDIENCE` | Optional Auth0 API audience for access-token requests | No |
| `VITE_VIMEUS_VIEW_KEY` | Vimeus embed key appended to the documented embed URLs | Yes for Vimeus playback |

Vimeus documents the `view_key` as a public embed parameter and requires it in each embed URL. Configure allowed embed domains in Vimeus. The separate Vimeus API key is only needed for authenticated listing API requests and is not used by this app's direct embeds.

### Auth0 setup

- Create an Auth0 **Single Page Application** and copy its domain and client ID to `.env.local`.
- Add your app origin (for example `http://localhost:3000`) to the Auth0 application's **Allowed Callback URLs**, **Allowed Logout URLs**, and **Allowed Web Origins**. Add the production origin for deployment.
- Set `VITE_AUTH0_AUDIENCE` only if the app needs access tokens for a configured Auth0 API.
- Restart Vite after changing environment variables. Auth0 controls appear in the navigation when the domain and client ID are configured.

### Simkl setup

- Register the exact callback URL(s) in the Simkl developer app settings: `http://localhost:3000/simkl/callback` for local development and `https://your-site-domain/simkl/callback` for production.
- Use an Auth V2 app/device client without a client secret. The integration uses OAuth PKCE and requests `media:read media:write`; it does not store a client secret.
- Connect and manually sync from the **Simkl Sync** section on the Watchlist page. The first sync merges libraries; later syncs mirror watchlist and watched-history removals in either direction.
- Movie and episode watched states are explicit actions on detail pages; opening the embedded player does not mark content watched.
- OAuth tokens are stored in this browser's local storage. Disconnecting removes the local tokens and sync snapshot.

## Project Structure

```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   ├── layout/       # Layout components (Header, Footer)
│   └── features/     # Feature-specific components
├── pages/            # Page components
├── hooks/            # Custom React hooks
├── services/         # TMDB and Simkl API clients
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
├── App.tsx           # Main app with routing
└── main.tsx          # Entry point
```

## Features in Detail

### Video Player (Vimeus and CineSrc)
- Choose Vimeus or CineSrc from the provider picker when starting a movie or episode.
- Both providers use the title's TMDB ID. Vimeus URLs follow its documented embed format and include the configured `view_key`.
- Movie embed: `https://vimeus.com/e/movie?tmdb={tmdb_id}&view_key={view_key}`
- TV episode embed: `https://vimeus.com/e/serie?tmdb={tmdb_id}&se={season}&ep={episode}&view_key={view_key}`
- See the [Vimeus API documentation](https://vimeus.com/) for supported embed URLs and options.

### Content Browsing
- Trending movies & TV shows
- Popular movies & TV shows
- Search with debounced queries
- Genres shown with movie and TV metadata
- Manual "Load More" pagination

### Pages
- **Home** - Hero banner + trending/popular sections
- **Movies** - Popular & Trending tabs
- **TV Shows** - Popular & Trending tabs
- **Trending** - Combined trending view
- **Search** - Debounced search results
- **Movie Detail** - Info and provider picker for Vimeus or CineSrc playback
- **TV Show Detail** - Season/episode selector and provider picker for Vimeus or CineSrc playback
- **Watchlist** - Local collection with optional Simkl synchronization
- **Watched** - Explicitly marked movies and episodes, optionally synced with Simkl

## Deployment

### Build for Production

```bash
npm run build
```

The output will be in the `dist/` folder, ready for static hosting. Configure `VITE_VIMEUS_VIEW_KEY` in the deployment environment before building; as a `VITE_` variable, it is included in the public browser bundle, as intended for Vimeus embed use.

### Cloudflare Workers Builds

This repository is configured to deploy the Vite single-page app as Cloudflare Workers Static Assets. The Wrangler config publishes `dist/` and routes unknown paths to the SPA entry point.

In Cloudflare, connect the repository as a **Workers Builds** project and use:

- Root directory: `/`
- Build command: `npm ci && npm run build`
- Deploy command: `npx wrangler deploy`
- Build variables:
  - `VITE_TMDB_API_KEY` — required for TMDB catalog data.
  - `VITE_VIMEUS_VIEW_KEY` — required for Vimeus embeds.
  - `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID`, and optionally `VITE_AUTH0_AUDIENCE` if using Auth0.
  - `VITE_SIMKL_CLIENT_ID` if using Simkl.

Set variables in the Cloudflare build environment for each deployment environment that needs them. `VITE_` values are embedded in the public client bundle; only use public client-side keys and never put a Cloudflare deploy/build token in Vite variables or source control. With no `VITE_TMDB_API_KEY`, the app can build but TMDB-backed pages will not load data. Cloudflare runs the build before `npx wrangler deploy`; do not also configure a Wrangler custom build command, as this would rebuild the app a second time. SPA route fallback is handled by Wrangler's `not_found_handling` setting.

To deploy locally, install dependencies, provide the required Vite variables in a local environment file, then run:

```bash
npm run build
npx wrangler deploy
```

### Docker

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Metadata and attribution

The catalog uses TMDB for search, popular and trending titles, poster artwork, ratings, genres, and detail-page certifications. TMDB does not include certifications in its popular/trending list responses, so those cards show a dash until an age rating is available on the title details. Playback opens the selected provider's hosted embed player directly; it does not fetch stream URLs from TMDB.

This product uses the TMDB API but is not endorsed or certified by TMDB. See the [TMDB terms of use](https://www.themoviedb.org/terms-of-use).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run lint` and `npm run build`
5. Submit a pull request

## License

No license is currently specified. All rights are reserved unless the copyright holder grants permission.

## Disclaimer

This project is for personal/educational use only. Ensure you comply with applicable laws, TMDB's API terms, and the Vimeus and CineSrc embed terms when using this application.
