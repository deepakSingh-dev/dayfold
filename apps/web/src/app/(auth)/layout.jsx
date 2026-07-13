import Link from 'next/link';

import { Wordmark } from '@/components/brand';

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-12">
      <Link href="/" aria-label="Dayfold home">
        <Wordmark size="lg" />
      </Link>
      {children}
    </div>
  );
}
