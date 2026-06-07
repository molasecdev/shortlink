import { defineMiddleware } from 'astro:middleware';
import { validateSession } from './lib/session';
import { getUserById } from './lib/auth';

export interface CurrentUser {
  id: string;
  username: string;
  role: 'admin' | 'user';
}

export const onRequest = defineMiddleware(async (context, next) => {
  const cookies = context.request.headers.get('cookie');
  const sessionId = cookies?.split('; ').find(c => c.startsWith('session='))?.split('=')[1];

  let user: CurrentUser | null = null;

  if (sessionId) {
    const userId = await validateSession(sessionId);
    if (userId) {
      const userData = await getUserById(userId);
      if (userData) {
        user = {
          id: userData.id,
          username: userData.username,
          role: userData.role,
        };
      }
    }
  }

  context.locals.user = user;
  return next();
});
