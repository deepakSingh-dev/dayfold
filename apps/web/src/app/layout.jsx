import './globals.css';

import { Providers } from '@/components/providers';

export const metadata = {
  title: 'Dayfold',
  description: 'A project management app with Asana structure and Notion soul.',
};

export const viewport = {
  themeColor: '#0d0e11',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
