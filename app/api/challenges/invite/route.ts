import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getRequestUser } from '@/lib/supabase/serverAuth';

function code() {
  return `CH-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  const { user, error } = await getRequestUser(request);
  if (!user) return NextResponse.json({ ok: false, error }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { challenge_id?: string };
  const challengeId = body.challenge_id;
  if (!challengeId) return NextResponse.json({ ok: false, error: 'challenge_id is required' }, { status: 400 });

  const { data: creatorMember } = await supabaseAdmin
    .from('challenge_members')
    .select('role')
    .eq('challenge_id', challengeId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (creatorMember?.role !== 'creator') {
    return NextResponse.json({ ok: false, error: 'Only creator can invite' }, { status: 403 });
  }

  const inviteCode = code();
  const { error: updateError } = await supabaseAdmin
    .from('challenges')
    .update({ invite_code: inviteCode })
    .eq('id', challengeId)
    .eq('created_by', user.id);

  if (updateError) {
    return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, invite_code: inviteCode });
}
