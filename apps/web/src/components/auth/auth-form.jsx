'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * Shared login/signup form. `mode` is 'login' or 'signup'. `googleEnabled`
 * comes from the server (env-gated) so the Google button only shows when creds
 * are configured.
 */
export function AuthForm({ mode, googleEnabled }) {
  const isSignup = mode === 'signup';
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/home';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: authError } = isSignup
      ? await authClient.signUp.email({ name, email, password, callbackURL: next })
      : await authClient.signIn.email({ email, password, callbackURL: next });

    if (authError) {
      setError(authError.message || 'Something went wrong. Please try again.');
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  async function onGoogle() {
    setError('');
    setLoading(true);
    await authClient.signIn.social({ provider: 'google', callbackURL: next });
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-1">
        <CardTitle>{isSignup ? 'Create your account' : 'Welcome back'}</CardTitle>
        <CardDescription>
          {isSignup
            ? 'Start organizing your work and notes in one place.'
            : 'Log in to your Dayfold workspace.'}
        </CardDescription>
      </CardHeader>

      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {isSignup && (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Lovelace"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignup ? 'At least 8 characters' : '••••••••'}
            />
          </div>

          {error && (
            <p
              className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm"
              role="alert"
            >
              {error}
            </p>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            {isSignup ? 'Create account' : 'Log in'}
          </Button>

          {googleEnabled && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onGoogle}
              disabled={loading}
            >
              Continue with Google
            </Button>
          )}

          <p className="text-muted-foreground text-center text-sm">
            {isSignup ? (
              <>
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:underline">
                  Log in
                </Link>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="text-primary hover:underline">
                  Sign up
                </Link>
              </>
            )}
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
