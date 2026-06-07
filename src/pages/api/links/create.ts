import type { APIRoute } from 'astro';
import { validateSession } from '../../../lib/session';
import { getUserById } from '../../../lib/auth';
import { createLink } from '../../../lib/links';

interface CreateLinkRequest {
  slug: string;
  targetUrl: string;
}

export const POST: APIRoute = async ({ request }) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Check authentication
    const cookieHeader = request.headers.get('cookie');
    const sessionId = cookieHeader?.split('; ').find(c => c.startsWith('session='))?.split('=')[1];

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userId = await validateSession(sessionId);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = await getUserById(userId);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // support both JSON and form submissions
    const contentType = request.headers.get('content-type') || '';
    let slug = '';
    let targetUrl = '';

    if (contentType.includes('application/json')) {
      const body = await request.json() as CreateLinkRequest;
      slug = body.slug;
      targetUrl = body.targetUrl;
    } else {
      const form = await request.formData();
      slug = String(form.get('slug') || '');
      targetUrl = String(form.get('targetUrl') || '');
    }

    if (!slug || !targetUrl) {
      // if form submission, redirect back with error
      if (!contentType.includes('application/json')) {
        return new Response(null, { status: 302, headers: { Location: '/links/create?error=missing' } });
      }
      return new Response(JSON.stringify({ error: 'Slug and targetUrl are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const newLink = await createLink(slug, targetUrl, user.id);

    if (contentType.includes('application/json')) {
      return new Response(JSON.stringify(newLink), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(null, { status: 302, headers: { Location: '/links' } });
  } catch (error) {
    console.error('Create link error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
