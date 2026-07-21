'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

/** Wraps next-themes; dark is the default theme for Dayfold. */
export function ThemeProvider({ children, ...props }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
