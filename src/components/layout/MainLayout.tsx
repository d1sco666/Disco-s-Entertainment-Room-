import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { classNames } from '../../utils/helpers';
import { MediaLibraryProvider, useMediaLibrary } from '../../hooks/useMediaLibrary';

function MediaLibraryNotice() {
  const { storageError } = useMediaLibrary();
  if (!storageError) return null;

  return (
    <p className="mx-auto max-w-7xl px-4 text-sm text-red-600 dark:text-red-400" role="alert">
      {storageError}
    </p>
  );
}

export function MainLayout() {
  return (
    <MediaLibraryProvider>
      <div className={classNames('min-h-screen flex flex-col bg-app-background')}>
        <Header />
        <MediaLibraryNotice />
        <main className="flex-1 pt-16" id="main-content">
          <Outlet />
        </main>
        <Footer />
      </div>
    </MediaLibraryProvider>
  );
}