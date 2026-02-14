import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

type Edge = {
  user_id_a: string;
  user_id_b: string;
  status: string;
};

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const { data: edges, error: edgeError } = await supabaseAdmin
    .from('friend_edges')
    .select('user_id_a,user_id_b,status')
    .eq('status', 'accepted')
    .or(`user_id_a.eq.${userId},user_id_b.eq.${userId}`);

  if (edgeError) {
    return NextResponse.json({ error: edgeError.message }, { status: 500 });
  }

  const friendIds = ((edges ?? []) as Edge[])
    .map((edge) => (edge.user_id_a === userId ? edge.user_id_b : edge.user_id_a))
    .filter(Boolean);

  if (!friendIds.length) {
    return NextResponse.json({ friends: [] });
  }

  const { data: profiles, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('user_id,handle,avatar_seed,level,xp_total')
    .in('user_id', friendIds);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ friends: profiles ?? [] });
}
