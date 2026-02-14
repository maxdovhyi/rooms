import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

type Body = {
  userId?: string;
  code?: string;
};

function normalizePair(a: string, b: string) {
  return a < b ? [a, b] : [b, a];
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Body;
  const userId = body.userId;
  const code = body.code?.trim().toUpperCase();

  if (!userId || !code) {
    return NextResponse.json({ error: 'userId and code are required' }, { status: 400 });
  }

  const { data: invite, error: inviteError } = await supabaseAdmin
    .from('invites')
    .select('id,code,status,created_by_user_id,target_user_id')
    .eq('code', code)
    .maybeSingle();

  if (inviteError || !invite) {
    return NextResponse.json({ error: inviteError?.message ?? 'Invite not found' }, { status: 404 });
  }

  if (invite.status !== 'pending') {
    return NextResponse.json({ error: 'Invite is not pending' }, { status: 400 });
  }

  if (invite.created_by_user_id === userId) {
    return NextResponse.json({ error: 'Cannot accept your own invite' }, { status: 400 });
  }

  await supabaseAdmin
    .from('invites')
    .update({ status: 'accepted', target_user_id: userId, accepted_at: new Date().toISOString() })
    .eq('id', invite.id);

  const [userA, userB] = normalizePair(invite.created_by_user_id, userId);

  const { error: edgeError } = await supabaseAdmin.from('friend_edges').upsert(
    {
      user_id_a: userA,
      user_id_b: userB,
      status: 'accepted',
    },
    { onConflict: 'user_id_a,user_id_b' }
  );

  if (edgeError) {
    return NextResponse.json({ error: edgeError.message }, { status: 500 });
  }

  return NextResponse.json({ accepted: true });
}
