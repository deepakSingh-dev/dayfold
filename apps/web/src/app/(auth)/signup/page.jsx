import { Suspense } from 'react';

import { AuthForm } from '@/components/auth/auth-form';
import { googleOAuthEnabled } from '@/lib/env';

export const metadata = { title: 'Sign up · Dayfold' };

export default function SignupPage() {
  return (
    <Suspense>
      <AuthForm mode="signup" googleEnabled={googleOAuthEnabled} />
    </Suspense>
  );
}
