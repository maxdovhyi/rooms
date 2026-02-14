import { NextRequest } from 'next/server';
import { supabaseAdmin } from './admin';

export async function getRequestUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return { user: null, error: 'Missing bearer token' };

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return { user: null, error: error?.message ?? 'Unauthorized' };
  }

  return { user: data.user, error: null };
}
