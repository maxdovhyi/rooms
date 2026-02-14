import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getRequestUser } from '@/lib/supabase/serverAuth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await getRequestUser(request);
  if (!user) return NextResponse.json({ ok: false, error }, { status: 401 });

  const { id } = await params;

  const { data: member } = await supabaseAdmin
    .from('challenge_members')
    .select('role')
    .eq('challenge_id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!member) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const [{ data: challenge }, { data: members }, { data: checkins }, { data: events }] = await Promise.all([
    supabaseAdmin.from('challenges').select('*').eq('id', id).maybeSingle(),
    supabaseAdmin
      .from('challenge_members')
      .select('user_id,role,joined_at,profiles(handle,avatar_seed)')
      .eq('challenge_id', id),
    supabaseAdmin.from('challenge_checkins').select('user_id,date,status,notes,created_at').eq('challenge_id', id).order('date', { ascending: false }).limit(120),
    supabaseAdmin.from('challenge_events').select('event_type,payload,created_at').eq('challenge_id', id).order('created_at', { ascending: false }).limit(50),
  ]);

  return NextResponse.json({ ok: true, challenge, members: members ?? [], checkins: checkins ?? [], events: events ?? [] });
}
