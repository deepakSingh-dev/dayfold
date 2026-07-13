import './globals.css';

import { ThemeProvider } from '@/components/theme-provider';

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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
