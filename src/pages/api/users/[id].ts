import type { APIRoute } from 'astro';
import { validateSession } from '../../../lib/session';
import { getUserById, updateUser, deleteUser, hashPassword } from '../../../lib/auth';
import { getLinksByUser, deleteLink } from '../../../lib/links';

interface UpdateUserRequest {
  username: string;
  role: 'admin' | 'user';
  password?: string;
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

    const currentUser = await getUserById(userId);
    if (!currentUser || currentUser.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const editUserId = params.id as string;
    const editUser = await getUserById(editUserId);

    if (!editUser) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { username, role, password } = await request.json() as UpdateUserRequest;

    if (!username) {
      return new Response(JSON.stringify({ error: 'Username is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (username.length < 4 || username.length > 30) {
      return new Response(JSON.stringify({ error: 'Username must be 4-30 characters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const updates: { username: string; role: 'admin' | 'user'; passwordHash?: string } = {
      username,
      role: role || editUser.role,
    };

    if (password) {
      if (password.length < 8) {
        return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      updates.passwordHash = await hashPassword(password);
    }

    const updatedUser = await updateUser(editUserId, updates);

    return new Response(JSON.stringify(updatedUser), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Update user error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request, params }) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const cookieHeader = request.headers.get('cookie');
    const sessionId = cookieHeader?.split('; ').find(c => c.startsWith('session='))?.split('=')[1];

    if (!sessionId) {
      return new Response(null, { status: 302, headers: { Location: '/login' } });
    }

    const currentUserId = await validateSession(sessionId);
    if (!currentUserId) {
      return new Response(null, { status: 302, headers: { Location: '/login' } });
    }

    const actingUser = await getUserById(currentUserId);
    if (!actingUser) {
      return new Response(null, { status: 302, headers: { Location: '/login' } });
    }

    const targetUserId = params.id as string;
    const targetUser = await getUserById(targetUserId);
    if (!targetUser) {
      return new Response(null, { status: 302, headers: { Location: '/users' } });
    }

    if (actingUser.role !== 'admin' && actingUser.id !== targetUserId) {
      return new Response(null, { status: 302, headers: { Location: '/users' } });
    }

    const form = await request.formData();
    const action = String(form.get('action') || 'update');

    if (action === 'delete') {
      await deleteUser(targetUserId);
      return new Response(null, { status: 302, headers: { Location: '/users' } });
    }

    const username = String(form.get('username') || '');
    const role = String(form.get('role') || targetUser.role) as 'admin' | 'user';
    const password = String(form.get('password') || '');

    if (!username || username.length < 4 || username.length > 30) {
      return new Response(null, { status: 302, headers: { Location: `/users/edit/${targetUserId}?error=invalid` } });
    }

    const updates: any = { username, role };
    if (password) {
      updates.passwordHash = await hashPassword(password);
    }

    await updateUser(targetUserId, updates);
    return new Response(null, { status: 302, headers: { Location: '/users' } });
  } catch (err) {
    console.error('User update/delete (form) error:', err);
    return new Response(null, { status: 500 });
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

    const currentUser = await getUserById(userId);
    if (!currentUser || currentUser.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const deleteUserId = params.id as string;
    const deleteUserData = await getUserById(deleteUserId);

    if (!deleteUserData) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Prevent admin from deleting themselves
    if (deleteUserId === userId) {
      return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete all links created by this user
    const userLinks = await getLinksByUser(deleteUserId);
    for (const link of userLinks) {
      await deleteLink(link.id);
    }

    // Delete the user
    await deleteUser(deleteUserId);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
