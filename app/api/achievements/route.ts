import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const [{ data: profile }, { data: streak }, { count: sessionsCount }] = await Promise.all([
    supabaseAdmin.from('profiles').select('xp_total').eq('user_id', userId).maybeSingle(),
    supabaseAdmin.from('daily_streaks').select('current,best').eq('user_id', userId).maybeSingle(),
    supabaseAdmin.from('sessions').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'ended'),
  ]);

  const xp = profile?.xp_total ?? 0;
  const currentStreak = streak?.current ?? 0;
  const completed = sessionsCount ?? 0;

  const achievements = [
    { key: 'first_session', title: 'First Session', unlocked: completed >= 1 },
    { key: 'ten_sessions', title: '10 Sessions', unlocked: completed >= 10 },
    { key: 'streak_3', title: '3-Day Streak', unlocked: currentStreak >= 3 },
    { key: 'streak_7', title: '7-Day Streak', unlocked: currentStreak >= 7 },
    { key: 'xp_100', title: '100 XP', unlocked: xp >= 100 },
    { key: 'xp_500', title: '500 XP', unlocked: xp >= 500 },
  ];

  return NextResponse.json({ achievements });
}
