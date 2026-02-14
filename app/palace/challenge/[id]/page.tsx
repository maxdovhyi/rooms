'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { CheckinPanel } from '@/components/palace/CheckinPanel';

type ChallengeDetailPayload = {
  ok: boolean;
  challenge?: { id: string; title: string };
  checkins?: { user_id: string; date: string }[];
  events?: { event_type: string; created_at: string }[];
  error?: string;
};

export default function ChallengeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [payload, setPayload] = useState<ChallengeDetailPayload | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const accessToken = data.session?.access_token ?? null;
      if (!accessToken) {
        router.replace('/');
        return;
      }
      setToken(accessToken);
      const response = await fetch(`/api/challenges/${params.id}`, { headers: { Authorization: `Bearer ${accessToken}` } });
      const dataPayload = (await response.json()) as ChallengeDetailPayload;
      if (!response.ok || !dataPayload.ok) {
        setMessage(dataPayload.error ?? 'Failed to load challenge');
        return;
      }
      setPayload(dataPayload);
    });
  }, [params.id, router]);

  const today = new Date().toISOString().slice(0, 10);
  const checkedToday = useMemo(() => {
    if (!payload?.checkins) return false;
    return payload.checkins.some((c) => c.date === today);
  }, [payload, today]);

  async function onCheckin(status: 'ok' | 'fail') {
    if (!token) return;
    const response = await fetch('/api/challenges/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ challenge_id: params.id, status }),
    });
    const data = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok || !data.ok) {
      setMessage(data.error ?? 'Check-in failed');
      return;
    }
    setMessage('Check-in saved');
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10">
      <header className="mb-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{payload?.challenge?.title ?? 'Challenge'}</h1>
        <Link href="/palace" className="text-sm text-indigo-300">← Palace</Link>
      </header>
      <p className="mb-3 text-sm text-slate-300">{checkedToday ? 'Сегодня уже отмечено ✅' : 'Сегодня ещё не отмечено ⏳'}</p>
      <CheckinPanel onCheckin={onCheckin} />
      {message ? <p className="mt-2 text-sm text-slate-300">{message}</p> : null}

      <section className="mt-4 rounded-xl border border-slate-700 p-4 text-sm">
        <h2 className="mb-2 font-semibold">Coach feed</h2>
        {(payload?.events ?? []).slice(0, 12).map((event, index) => (
          <p key={index}>• {event.event_type} • {new Date(event.created_at).toLocaleString()}</p>
        ))}
        {!(payload?.events ?? []).length ? <p className="text-slate-400">No events yet</p> : null}
      </section>
    </main>
  );
}
