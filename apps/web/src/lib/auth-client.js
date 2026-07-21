'use client';

import { createAuthClient } from 'better-auth/react';

/**
 * Browser auth client. baseURL defaults to the current origin, so it works
 * without extra config in dev and prod.
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
