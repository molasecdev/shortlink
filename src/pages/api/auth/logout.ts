import type { APIRoute } from 'astro';
import { deleteSession, clearSessionCookie } from '../../../lib/session';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const cookieHeader = request.headers.get('cookie');
    const sessionId = cookieHeader?.split('; ').find(c => c.startsWith('session='))?.split('=')[1];

    if (sessionId) {
      await deleteSession(sessionId);
    }

    const response = new Response(null, {
      status: 302,
      headers: { Location: '/login' }
    });

    clearSessionCookie(response.headers);
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return new Response('Internal server error', { status: 500 });
  }
};
