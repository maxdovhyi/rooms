'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { AchievementGrid, type Achievement } from '@/components/profile/AchievementGrid';
import { BankTiles } from '@/components/profile/BankTiles';
import { CommitmentsList } from '@/components/profile/CommitmentsList';
import { ProfileHero } from '@/components/profile/ProfileHero';
import { RecentSessions } from '@/components/profile/RecentSessions';

type SessionRow = {
  id: string;
  result_value: number | null;
  completed_at: string | null;
  room_templates: { title: string | null; mode: string | null } | null;
};

type ChallengeRow = {
  id: string;
  title: string;
  rules_json?: { duration_days?: number };
};

type SupabaseSessionRow = {
  id: string;
  result_value: number | null;
  completed_at: string | null;
  scheduled_rooms?: {
    room_templates?: { title: string | null; mode: string | null } | null;
  } | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<{ handle: string; level: number; xp_total: number } | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [commitments, setCommitments] = useState<{ id: string; title: string; day: number; total: number; checkedToday: boolean }[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      const accessToken = data.session?.access_token ?? null;
      if (!user || !accessToken) {
        router.replace('/');
        return;
      }

      const { data: loadedProfile } = await supabase
        .from('profiles')
        .select('handle,level,xp_total')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!loadedProfile) {
        router.replace('/onboarding');
        return;
      }

      setProfile(loadedProfile);

      const { data: loadedSessions } = await supabase
        .from('sessions')
        .select('id,result_value,completed_at,scheduled_rooms(template_id,room_templates(title,mode))')
        .eq('user_id', user.id)
        .eq('status', 'ended')
        .order('completed_at', { ascending: false })
        .limit(200);

      const normalized = ((loadedSessions ?? []) as SupabaseSessionRow[]).map((row) => ({
        id: row.id,
        result_value: row.result_value,
        completed_at: row.completed_at,
        room_templates: row.scheduled_rooms?.room_templates ?? null,
      }));
      setSessions(normalized);

      const [achRes, chRes] = await Promise.all([
        fetch(`/api/achievements?userId=${user.id}`),
        fetch('/api/challenges/list', { headers: { Authorization: `Bearer ${accessToken}` } }),
      ]);

      const achPayload = (await achRes.json()) as { achievements?: Achievement[] };
      const chPayload = (await chRes.json()) as { challenges?: ChallengeRow[] };
      setAchievements(achPayload.achievements ?? []);
      setCommitments(
        (chPayload.challenges ?? []).map((c) => ({
          id: c.id,
          title: c.title,
          day: 1,
          total: c.rules_json?.duration_days ?? 30,
          checkedToday: false,
        }))
      );
    });
  }, [router]);

  const now = Date.now();

  const banks = useMemo(() => {
    const inRange = (date: string | null, days: number) => {
      if (!date) return false;
      return now - new Date(date).getTime() <= days * 24 * 60 * 60 * 1000;
    };

    const byMode = (mode: string) => sessions.filter((s) => s.room_templates?.mode === mode);
    const sum = (items: SessionRow[], days?: number) =>
      items.reduce((acc, item) => {
        if (days && !inRange(item.completed_at, days)) return acc;
        return acc + (item.result_value ?? 0);
      }, 0);

    const meditation = byMode('timer_steps');
    const counter = byMode('counter');
    const breath = byMode('breath_cycle');

    return {
      meditation: { week: sum(meditation, 7), month: sum(meditation, 30), all: sum(meditation) },
      reps: { week: sum(counter, 7), month: sum(counter, 30), all: sum(counter) },
      breathCycles: { week: sum(breath, 7), month: sum(breath, 30) },
      bestHold: 0,
    };
  }, [sessions, now]);

  const recent = sessions.slice(0, 10).map((session) => ({
    id: session.id,
    category: session.room_templates?.title ?? 'Session',
    result_value: session.result_value ?? 0,
    unit: session.room_templates?.mode === 'counter' ? 'reps' : session.room_templates?.mode === 'timer_steps' ? 'min' : 'cycles',
    completed_at: session.completed_at ?? new Date().toISOString(),
  }));

  if (!profile) return <main className="p-6">Loading profile...</main>;

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl space-y-4 px-6 py-10">
      <ProfileHero handle={profile.handle} level={profile.level} xp={profile.xp_total} />
      <BankTiles meditation={banks.meditation} reps={banks.reps} breathCycles={banks.breathCycles} bestHold={banks.bestHold} />
      <AchievementGrid achievements={achievements} />
      <CommitmentsList commitments={commitments} />
      <RecentSessions items={recent} />
    </main>
  );
}
