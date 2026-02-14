import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getRequestUser } from '@/lib/supabase/serverAuth';

export async function POST(request: NextRequest) {
  const { user, error } = await getRequestUser(request);
  if (!user) return NextResponse.json({ ok: false, error }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    challenge_id?: string;
    status?: 'ok' | 'fail';
    notes?: string;
  };

  if (!body.challenge_id || !body.status) {
    return NextResponse.json({ ok: false, error: 'challenge_id and status are required' }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const { error: checkinError } = await supabaseAdmin.from('challenge_checkins').upsert(
    {
      challenge_id: body.challenge_id,
      user_id: user.id,
      date: today,
      status: body.status,
      notes: body.notes ?? null,
    },
    { onConflict: 'challenge_id,user_id,date' }
  );

  if (checkinError) return NextResponse.json({ ok: false, error: checkinError.message }, { status: 500 });

  await supabaseAdmin.from('challenge_events').insert({
    challenge_id: body.challenge_id,
    event_type: 'checkin',
    payload: { user_id: user.id, status: body.status, date: today },
  });

  return NextResponse.json({ ok: true, date: today });
}
