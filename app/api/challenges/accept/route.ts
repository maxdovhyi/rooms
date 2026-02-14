import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getRequestUser } from '@/lib/supabase/serverAuth';

export async function POST(request: NextRequest) {
  const { user, error } = await getRequestUser(request);
  if (!user) return NextResponse.json({ ok: false, error }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { invite_code?: string };
  const inviteCode = body.invite_code?.trim().toUpperCase();
  if (!inviteCode) return NextResponse.json({ ok: false, error: 'invite_code is required' }, { status: 400 });

  const { data: challenge } = await supabaseAdmin
    .from('challenges')
    .select('id,title')
    .eq('invite_code', inviteCode)
    .maybeSingle();

  if (!challenge) return NextResponse.json({ ok: false, error: 'Challenge not found' }, { status: 404 });

  const { error: memberError } = await supabaseAdmin.from('challenge_members').upsert(
    { challenge_id: challenge.id, user_id: user.id, role: 'member' },
    { onConflict: 'challenge_id,user_id' }
  );

  if (memberError) return NextResponse.json({ ok: false, error: memberError.message }, { status: 500 });

  await supabaseAdmin.from('challenge_events').insert({
    challenge_id: challenge.id,
    event_type: 'member_joined',
    payload: { user_id: user.id },
  });

  return NextResponse.json({ ok: true, challenge });
}
