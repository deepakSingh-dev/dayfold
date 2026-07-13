import { toNextJsHandler } from 'better-auth/next-js';

import { auth } from '@/lib/auth';

// Mounts all Better Auth endpoints under /api/auth/*.
export const { GET, POST } = toNextJsHandler(auth);
