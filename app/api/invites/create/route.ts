import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

type Body = { userId?: string };

function generateCode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Body;
  const userId = body.userId;

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const code = generateCode();

  const { data, error } = await supabaseAdmin
    .from('invites')
    .insert({
      code,
      created_by_user_id: userId,
      status: 'pending',
    })
    .select('id,code,status,created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ invite: data, link: `/invites?code=${code}` });
}
