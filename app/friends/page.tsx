'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

type Friend = {
  user_id: string;
  handle: string;
  level: number;
  xp_total: number;
};

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) return;

      const response = await fetch(`/api/friends?userId=${user.id}`);
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? 'Failed to load friends');
        return;
      }

      setFriends(payload.friends ?? []);
    });
  }, []);

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-6 py-10">
      <h1 className="mb-4 text-3xl font-bold">Friends</h1>
      <div className="space-y-2 rounded-xl border border-slate-800 p-4">
        {!!error && <p className="text-sm text-red-300">{error}</p>}
        {!friends.length && !error && <p className="text-sm text-slate-400">No friends yet. Accept an invite to add one.</p>}
        {friends.map((friend) => (
          <article key={friend.user_id} className="rounded-md border border-slate-700 p-3 text-sm">
            <p className="font-semibold">@{friend.handle}</p>
            <p className="text-slate-300">Level {friend.level} • XP {friend.xp_total}</p>
          </article>
        ))}
      </div>
      <Link href="/dashboard" className="mt-4 inline-block text-sm text-indigo-300">← Back to dashboard</Link>
    </main>
  );
}
