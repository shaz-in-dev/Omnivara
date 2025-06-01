import Link from 'next/link';
import { FileSearch } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-50 px-4 dark:bg-gray-950">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
        <FileSearch className="h-8 w-8 text-gray-400" />
      </div>
      <div className="text-center">
        <p className="text-6xl font-bold text-gray-200 dark:text-gray-800">404</p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">Page not found</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
      >
        Back to Omnivara
      </Link>
    </div>
  );
}
