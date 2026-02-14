import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

type FinalizeBody = {
  scheduledRoomId?: string;
  resultValue?: number;
  joinedAt?: string;
  participantKey?: string;
  userId?: string | null;
};

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as FinalizeBody;
  const scheduledRoomId = body.scheduledRoomId;
  const participantKey = body.participantKey ?? 'guest';
  const userId = body.userId ?? null;
  const resultValue = Math.max(0, Number(body.resultValue ?? 0));

  if (!scheduledRoomId) {
    return NextResponse.json({ error: 'scheduledRoomId is required' }, { status: 400 });
  }

  const existingQuery = supabaseAdmin
    .from('sessions')
    .select('id,result_value,xp_awarded,completed_at')
    .eq('scheduled_room_id', scheduledRoomId)
    .eq('status', 'ended')
    .limit(1);

  const { data: existingRows } = userId
    ? await existingQuery.eq('user_id', userId)
    : await existingQuery.eq('participant_key', participantKey);

  if (existingRows?.length) {
    return NextResponse.json({ alreadySubmitted: true, session: existingRows[0] });
  }

  const { data: room, error: roomError } = await supabaseAdmin
    .from('scheduled_rooms')
    .select('id,start_at,end_at')
    .eq('id', scheduledRoomId)
    .single();

  if (roomError || !room) {
    return NextResponse.json({ error: roomError?.message ?? 'Room not found' }, { status: 404 });
  }

  const startAt = new Date(room.start_at);
  const endAt = new Date(room.end_at);
  const joinedAt = body.joinedAt ? new Date(body.joinedAt) : startAt;
  const now = new Date();

  const fullDurationMs = Math.max(endAt.getTime() - startAt.getTime(), 1);
  const attendedMs = Math.max(Math.min(now.getTime(), endAt.getTime()) - Math.max(joinedAt.getTime(), startAt.getTime()), 0);
  const attendanceRatio = Number((attendedMs / fullDurationMs).toFixed(4));

  const attendanceXP = attendanceRatio >= 0.6 ? 10 : 0;
  const volumeXP = Math.floor(3 * Math.sqrt(resultValue));
  const xpAwarded = attendanceXP + volumeXP;

  const insertPayload = {
    scheduled_room_id: scheduledRoomId,
    user_id: userId,
    participant_key: participantKey,
    result_value: resultValue,
    xp_awarded: xpAwarded,
    attendance_ratio: attendanceRatio,
    status: 'ended',
    start_at: room.start_at,
    end_at: room.end_at,
    completed_at: now.toISOString(),
  };

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('sessions')
    .insert(insertPayload)
    .select('id,result_value,xp_awarded,attendance_ratio,completed_at')
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  if (userId) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('xp_total')
      .eq('user_id', userId)
      .maybeSingle();

    if (profile) {
      const nextXpTotal = (profile.xp_total ?? 0) + xpAwarded;
      const nextLevel = Math.max(1, Math.floor(nextXpTotal / 100) + 1);
      await supabaseAdmin.from('profiles').update({ xp_total: nextXpTotal, level: nextLevel }).eq('user_id', userId);
    }

    const { data: streak } = await supabaseAdmin
      .from('daily_streaks')
      .select('current,best,last_completed_date')
      .eq('user_id', userId)
      .maybeSingle();

    const today = startOfDay(now);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastCompletedDate = streak?.last_completed_date ? new Date(streak.last_completed_date) : null;
    const sameDay = lastCompletedDate && startOfDay(lastCompletedDate).getTime() === today.getTime();
    const continuous = lastCompletedDate && startOfDay(lastCompletedDate).getTime() === yesterday.getTime();
    const nextCurrent = sameDay ? streak?.current ?? 1 : continuous ? (streak?.current ?? 0) + 1 : 1;
    const nextBest = Math.max(streak?.best ?? 0, nextCurrent);

    await supabaseAdmin.from('daily_streaks').upsert({
      user_id: userId,
      current: nextCurrent,
      best: nextBest,
      last_completed_date: today.toISOString().slice(0, 10),
    });

    return NextResponse.json({ session: inserted, xpAwarded, streak: nextCurrent, attendanceRatio });
  }

  const { data: guestStreak } = await supabaseAdmin
    .from('guest_streaks')
    .select('current,best,last_completed_date')
    .eq('participant_key', participantKey)
    .maybeSingle();

  const today = startOfDay(now);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastCompletedDate = guestStreak?.last_completed_date ? new Date(guestStreak.last_completed_date) : null;
  const sameDay = lastCompletedDate && startOfDay(lastCompletedDate).getTime() === today.getTime();
  const continuous = lastCompletedDate && startOfDay(lastCompletedDate).getTime() === yesterday.getTime();
  const nextCurrent = sameDay ? guestStreak?.current ?? 1 : continuous ? (guestStreak?.current ?? 0) + 1 : 1;
  const nextBest = Math.max(guestStreak?.best ?? 0, nextCurrent);

  await supabaseAdmin.from('guest_streaks').upsert({
    participant_key: participantKey,
    current: nextCurrent,
    best: nextBest,
    last_completed_date: today.toISOString().slice(0, 10),
  });

  return NextResponse.json({ session: inserted, xpAwarded, streak: nextCurrent, attendanceRatio });
}
