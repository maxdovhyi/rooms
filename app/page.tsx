'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function HomePage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionActive(Boolean(data.session));
    });
  }, []);

  const signInWithOtp = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Magic link sent. Check your email.');
    }

    setLoading(false);
  };

  const continueFlow = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage('Please login first.');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    router.push(profile ? '/dashboard' : '/onboarding');
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-5 px-6">
      <h1 className="text-3xl font-bold">Ritual Rooms</h1>
      <p className="text-sm text-slate-300">Sprint 1 MVP: auth + onboarding + dashboard.</p>

      <form onSubmit={signInWithOtp} className="space-y-3 rounded-xl border border-slate-800 p-4">
        <label className="block text-sm">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2"
          placeholder="you@example.com"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-indigo-500 px-3 py-2 font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Login / Register'}
        </button>
      </form>

      <button
        onClick={continueFlow}
        disabled={!sessionActive}
        className="w-full rounded-md border border-indigo-400 px-3 py-2 font-semibold text-indigo-300 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Continue
      </button>

      {message && <p className="text-sm text-slate-300">{message}</p>}
    </main>
  );
}
