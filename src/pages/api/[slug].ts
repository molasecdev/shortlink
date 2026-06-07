import type { APIRoute } from 'astro';
import { getLinkBySlug, incrementClicks } from '../../lib/links';

export const GET: APIRoute = async ({ params }) => {
  try {
    const slug = params.slug as string;

    if (!slug) {
      return new Response('Not found', { status: 404 });
    }

    const link = await getLinkBySlug(slug);

    if (!link) {
      return new Response('Not found', { status: 404 });
    }

    // Increment clicks asynchronously
    await incrementClicks(slug).catch(error => {
      console.error('Failed to increment clicks:', error);
    });

    return new Response(null, {
      status: 302,
      headers: {
        'Location': link.targetUrl,
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Redirect error:', error);
    return new Response('Internal server error', { status: 500 });
  }
};
