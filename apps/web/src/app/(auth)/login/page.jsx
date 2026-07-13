import { Suspense } from 'react';

import { AuthForm } from '@/components/auth/auth-form';
import { googleOAuthEnabled } from '@/lib/env';

export const metadata = { title: 'Log in · Dayfold' };

export default function LoginPage() {
  return (
    <Suspense>
      <AuthForm mode="login" googleEnabled={googleOAuthEnabled} />
    </Suspense>
  );
}
