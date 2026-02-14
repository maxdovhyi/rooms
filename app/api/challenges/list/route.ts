import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getRequestUser } from '@/lib/supabase/serverAuth';

export async function GET(request: NextRequest) {
  const { user, error } = await getRequestUser(request);
  if (!user) return NextResponse.json({ ok: false, error }, { status: 401 });

  const { data: membership } = await supabaseAdmin
    .from('challenge_members')
    .select('challenge_id,role')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false });

  const challengeIds = (membership ?? []).map((m) => m.challenge_id);
  if (!challengeIds.length) return NextResponse.json({ ok: true, challenges: [] });

  const { data: challenges, error: challengeError } = await supabaseAdmin
    .from('challenges')
    .select('id,title,type,rules_json,start_at,end_at,created_by,invite_code,created_at')
    .in('id', challengeIds)
    .order('created_at', { ascending: false });

  if (challengeError) return NextResponse.json({ ok: false, error: challengeError.message }, { status: 500 });

  return NextResponse.json({ ok: true, challenges: challenges ?? [] });
}
