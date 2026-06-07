import type { APIRoute } from 'astro';
import { validateSession } from '../../../lib/session';
import { getUserById } from '../../../lib/auth';
import { updateLink, deleteLink, getLinkById } from '../../../lib/links';

interface UpdateLinkRequest {
  slug: string;
  targetUrl: string;
}

export const PUT: APIRoute = async ({ request, params }) => {
  if (request.method !== 'PUT') {
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

    const linkId = params.id as string;
    const link = await getLinkById(linkId);

    if (!link) {
      return new Response(JSON.stringify({ error: 'Link not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check authorization
    if (user.role !== 'admin' && link.createdBy !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { slug, targetUrl } = await request.json() as UpdateLinkRequest;

    if (!slug || !targetUrl) {
      return new Response(JSON.stringify({ error: 'Slug and targetUrl are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const updatedLink = await updateLink(linkId, { slug, targetUrl });

    return new Response(JSON.stringify(updatedLink), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Update link error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  if (request.method !== 'DELETE') {
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

    const linkId = params.id as string;
    const link = await getLinkById(linkId);

    if (!link) {
      return new Response(JSON.stringify({ error: 'Link not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check authorization
    if (user.role !== 'admin' && link.createdBy !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await deleteLink(linkId);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Delete link error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
