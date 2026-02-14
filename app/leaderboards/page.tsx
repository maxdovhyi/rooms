'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

type Row = {
  user_id: string;
  handle: string;
  total_value: number;
  total_xp: number;
};

export default function LeaderboardsPage() {
  const [today, setToday] = useState<Row[]>([]);
  const [week, setWeek] = useState<Row[]>([]);

  useEffect(() => {
    supabase.from('leaderboard_today').select('user_id,handle,total_value,total_xp').order('total_xp', { ascending: false }).limit(20).then(({ data }) => setToday((data ?? []) as Row[]));
    supabase.from('leaderboard_week').select('user_id,handle,total_value,total_xp').order('total_xp', { ascending: false }).limit(20).then(({ data }) => setWeek((data ?? []) as Row[]));
  }, []);

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-6 py-10">
      <h1 className="mb-4 text-3xl font-bold">Leaderboards</h1>
      <section className="mb-6 rounded-xl border border-slate-800 p-4">
        <h2 className="mb-2 text-lg font-semibold">Today</h2>
        <ul className="space-y-1 text-sm text-slate-300">
          {today.map((row, index) => (
            <li key={row.user_id}>{index + 1}. {row.handle} — XP {row.total_xp} • value {row.total_value}</li>
          ))}
          {!today.length && <li className="text-slate-500">No data yet.</li>}
        </ul>
      </section>

      <section className="mb-6 rounded-xl border border-slate-800 p-4">
        <h2 className="mb-2 text-lg font-semibold">Week</h2>
        <ul className="space-y-1 text-sm text-slate-300">
          {week.map((row, index) => (
            <li key={row.user_id}>{index + 1}. {row.handle} — XP {row.total_xp} • value {row.total_value}</li>
          ))}
          {!week.length && <li className="text-slate-500">No data yet.</li>}
        </ul>
      </section>

      <Link href="/dashboard" className="text-sm text-indigo-300">← Back to dashboard</Link>
    </main>
  );
}
