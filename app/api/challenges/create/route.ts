import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getRequestUser } from '@/lib/supabase/serverAuth';

type Body = {
  title?: string;
  type?: 'checkin' | 'metric';
  rules_json?: Record<string, unknown>;
  duration_days?: number;
};

export async function POST(request: NextRequest) {
  const { user, error } = await getRequestUser(request);
  if (!user) return NextResponse.json({ ok: false, error }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Body;
  const title = body.title?.trim();
  const type = body.type ?? 'checkin';
  if (!title) return NextResponse.json({ ok: false, error: 'title is required' }, { status: 400 });

  const startAt = new Date();
  const duration = Math.max(1, Number(body.duration_days ?? 30));
  const endAt = new Date(startAt);
  endAt.setDate(endAt.getDate() + duration);

  const { data: created, error: createError } = await supabaseAdmin
    .from('challenges')
    .insert({
      title,
      type,
      rules_json: body.rules_json ?? { duration_days: duration },
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      created_by: user.id,
    })
    .select('id,title,type,start_at,end_at,created_by')
    .single();

  if (createError || !created) {
    return NextResponse.json({ ok: false, error: createError?.message ?? 'Create failed' }, { status: 500 });
  }

  await supabaseAdmin.from('challenge_members').insert([
    { challenge_id: created.id, user_id: user.id, role: 'creator' },
  ]);

  await supabaseAdmin.from('challenge_events').insert({
    challenge_id: created.id,
    event_type: 'challenge_created',
    payload: { by: user.id },
  });

  return NextResponse.json({ ok: true, challenge: created });
}
