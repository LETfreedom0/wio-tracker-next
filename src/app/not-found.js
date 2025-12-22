'use client';

import Link from 'next/link';
import { useLanguage } from './context/LanguageContext';

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-2xl font-bold text-foreground mb-6">Page Not Found</h2>
      <p className="text-subtle mb-8 max-w-md">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link 
        href="/"
        className="px-6 py-3 rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
      >
        Go Back Home
      </Link>
    </div>
  );
}
