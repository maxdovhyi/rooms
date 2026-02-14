'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

type ProfileView = {
  handle: string;
  xp_total: number;
  level: number;
};

type DailyStreak = {
  current: number;
};

type SessionHistoryRow = {
  id: string;
  result_value: number | null;
  xp_awarded: number | null;
  completed_at: string | null;
};

type Achievement = {
  key: string;
  title: string;
  unlocked: boolean;
};

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileView | null>(null);
  const [streak, setStreak] = useState(0);
  const [history, setHistory] = useState<SessionHistoryRow[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) {
        router.replace('/');
        return;
      }

      const { data: loadedProfile } = await supabase
        .from('profiles')
        .select('handle,xp_total,level')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!loadedProfile) {
        router.replace('/onboarding');
        return;
      }

      setProfile(loadedProfile);

      const { data: loadedStreak } = await supabase
        .from('daily_streaks')
        .select('current')
        .eq('user_id', user.id)
        .maybeSingle();
      setStreak((loadedStreak as DailyStreak | null)?.current ?? 0);

      const { data: loadedHistory } = await supabase
        .from('sessions')
        .select('id,result_value,xp_awarded,completed_at')
        .eq('user_id', user.id)
        .eq('status', 'ended')
        .order('completed_at', { ascending: false })
        .limit(5);

      setHistory((loadedHistory ?? []) as SessionHistoryRow[]);

      const achievementsResponse = await fetch(`/api/achievements?userId=${user.id}`);
      const achievementsPayload = await achievementsResponse.json();
      setAchievements(achievementsPayload.achievements ?? []);
    });
  }, [router]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-4 px-6 py-10">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <section className="rounded-xl border border-slate-800 p-5">
        <p>handle: {profile?.handle ?? '...'}</p>
        <p>xp_total: {profile?.xp_total ?? 0}</p>
        <p>level: {profile?.level ?? 1}</p>
        <p>streak: {streak}</p>
      </section>

      <section className="rounded-xl border border-slate-800 p-5">
        <h2 className="mb-2 font-semibold">Achievements</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {achievements.map((item) => (
            <div key={item.key} className={`rounded-md border p-2 ${item.unlocked ? 'border-emerald-500 text-emerald-300' : 'border-slate-700 text-slate-400'}`}>
              {item.unlocked ? '✅' : '⬜'} {item.title}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 p-5">
        <h2 className="mb-2 font-semibold">Recent sessions</h2>
        {!history.length && <p className="text-sm text-slate-400">No completed sessions yet.</p>}
        <ul className="space-y-1 text-sm text-slate-300">
          {history.map((item) => (
            <li key={item.id}>
              result: {item.result_value ?? 0} • xp: {item.xp_awarded ?? 0} •{' '}
              {item.completed_at ? new Date(item.completed_at).toLocaleString() : 'n/a'}
            </li>
          ))}
        </ul>
      </section>

      <div className="mb-3">
        <Link href="/world" className="rounded-md bg-indigo-500 px-4 py-2 font-semibold">Enter World</Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/world" className="rounded-md border border-slate-700 px-4 py-2">World</Link>
        <Link href="/lobby" className="rounded-md border border-slate-700 px-4 py-2">Lobby</Link>
        <Link href="/profile" className="rounded-md border border-slate-700 px-4 py-2">Profile</Link>
        <Link href="/palace" className="rounded-md border border-slate-700 px-4 py-2">Palace</Link>
        <Link href="/leaderboards" className="rounded-md border border-slate-700 px-4 py-2">Leaderboards</Link>
        <Link href="/friends" className="rounded-md border border-slate-700 px-4 py-2">Friends</Link>
        <Link href="/invites" className="rounded-md border border-slate-700 px-4 py-2">Invites</Link>
      </div>
    </main>
  );
}
