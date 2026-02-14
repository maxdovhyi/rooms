'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { PalaceCoachPanel } from '@/components/palace/CoachPanel';
import { ChallengeCard } from '@/components/palace/ChallengeCard';
import { ChallengeCreateModal } from '@/components/palace/ChallengeCreateModal';

type Challenge = {
  id: string;
  title: string;
  type: 'checkin' | 'metric';
  start_at: string;
  end_at: string | null;
};

export default function PalacePage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [inviteCode, setInviteCode] = useState('');
  const [message, setMessage] = useState('');

  async function loadChallenges(accessToken: string) {
    const response = await fetch('/api/challenges/list', { headers: { Authorization: `Bearer ${accessToken}` } });
    const payload = await response.json();
    if (response.ok && payload.ok) setChallenges(payload.challenges ?? []);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const accessToken = data.session?.access_token ?? null;
      if (!accessToken) {
        router.replace('/');
        return;
      }
      setToken(accessToken);
      await loadChallenges(accessToken);
    });
  }, [router]);

  async function createChallenge(payload: { title: string; type: 'checkin' | 'metric'; duration_days: number }) {
    if (!token) return;
    const response = await fetch('/api/challenges/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      setMessage(data.error ?? 'Create failed');
      return;
    }
    setMessage('Challenge created');
    await loadChallenges(token);
  }

  async function acceptInvite() {
    if (!token || !inviteCode) return;
    const response = await fetch('/api/challenges/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ invite_code: inviteCode }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      setMessage(data.error ?? 'Accept failed');
      return;
    }
    setMessage('Joined challenge');
    await loadChallenges(token);
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-10">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Challenge Palace</h1>
        <Link href="/world" className="text-sm text-indigo-300">← World</Link>
      </header>

      <PalaceCoachPanel />

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <ChallengeCreateModal onCreate={createChallenge} />

        <section className="rounded-xl border border-slate-700 p-4">
          <h3 className="mb-2 font-semibold">Enter by Invite</h3>
          <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2" placeholder="CH-XXXXXX" />
          <button onClick={acceptInvite} className="mt-2 rounded-md border border-emerald-400 px-3 py-2 text-sm text-emerald-300">Accept</button>
          {message ? <p className="mt-2 text-sm text-slate-300">{message}</p> : null}
        </section>
      </div>

      <section className="mt-4 space-y-3">
        <h2 className="text-lg font-semibold">Active challenges</h2>
        {challenges.map((challenge) => (
          <ChallengeCard key={challenge.id} challenge={challenge} onOpen={(id) => router.push(`/palace/challenge/${id}`)} />
        ))}
        {!challenges.length ? <p className="text-sm text-slate-400">No challenges yet.</p> : null}
      </section>
    </main>
  );
}
