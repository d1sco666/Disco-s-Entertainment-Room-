import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-600 dark:text-primary-400 mb-4">404</h1>
        <h2 className="text-3xl font-bold text-dark-900 dark:text-white mb-4">Page Not Found</h2>
        <p className="text-dark-500 dark:text-dark-400 mb-8 max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/"><Button>Go Home</Button></Link>
          <Link to="/movies"><Button variant="outline">Browse Movies</Button></Link>
        </div>
      </div>
    </div>
  );
}