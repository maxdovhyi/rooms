'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function InvitesPage() {
  const searchParams = useSearchParams();
  const [inviteCode, setInviteCode] = useState(searchParams.get('code') ?? '');
  const [generatedLink, setGeneratedLink] = useState('');
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  async function createInvite() {
    if (!userId) {
      setMessage('Login required');
      return;
    }

    const response = await fetch('/api/invites/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? 'Failed to create invite');
      return;
    }

    const absolute = `${window.location.origin}${payload.link}`;
    setGeneratedLink(absolute);
    setMessage('Invite created');
  }

  async function acceptInvite() {
    if (!userId) {
      setMessage('Login required');
      return;
    }

    const response = await fetch('/api/invites/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, code: inviteCode }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? 'Failed to accept invite');
      return;
    }

    setMessage('Invite accepted. Friend added.');
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-6 py-10">
      <h1 className="mb-4 text-3xl font-bold">Invites</h1>

      <section className="mb-4 rounded-xl border border-slate-800 p-4">
        <h2 className="mb-2 font-semibold">Create invite link</h2>
        <button onClick={createInvite} className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold">Create Invite</button>
        {generatedLink && <p className="mt-2 break-all text-sm text-slate-300">{generatedLink}</p>}
      </section>

      <section className="mb-4 rounded-xl border border-slate-800 p-4">
        <h2 className="mb-2 font-semibold">Accept invite</h2>
        <input
          value={inviteCode}
          onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
          placeholder="INVITE CODE"
          className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2"
        />
        <button onClick={acceptInvite} className="mt-2 rounded-md border border-emerald-500 px-3 py-2 text-sm font-semibold text-emerald-300">Accept</button>
      </section>

      {message && <p className="mb-2 text-sm text-slate-300">{message}</p>}
      <Link href="/dashboard" className="text-sm text-indigo-300">← Back to dashboard</Link>
    </main>
  );
}
