'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

type Gender = 'male' | 'female' | 'other' | 'prefer_not';

export default function OnboardingPage() {
  const router = useRouter();
  const [handle, setHandle] = useState('');
  const [age, setAge] = useState<number>(18);
  const [gender, setGender] = useState<Gender>('prefer_not');
  const [timezone, setTimezone] = useState('UTC');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');

    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) {
        router.replace('/');
        return;
      }

      setUserId(user.id);
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        router.replace('/dashboard');
      }
    });
  }, [router]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!userId) return;

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.from('profiles').upsert(
      {
        user_id: userId,
        handle,
        age,
        gender,
        timezone,
        avatar_seed: handle || userId,
      },
      { onConflict: 'user_id' },
    );

    if (error) {
      setMessage(error.message);
    } else {
      router.replace('/dashboard');
    }

    setLoading(false);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-800 p-5">
        <h1 className="text-2xl font-semibold">Onboarding</h1>

        <div>
          <label className="text-sm">Handle</label>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            minLength={3}
            maxLength={20}
            required
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm">Age</label>
          <input
            type="number"
            min={13}
            max={120}
            required
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm">Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender)}
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not">Prefer not to say</option>
          </select>
        </div>

        <div>
          <label className="text-sm">Timezone</label>
          <input
            value={timezone}
            readOnly
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-400"
          />
        </div>

        <button type="submit" disabled={loading} className="w-full rounded-md bg-indigo-500 px-4 py-2 font-semibold">
          {loading ? 'Saving...' : 'Complete onboarding'}
        </button>

        {message && <p className="text-sm text-rose-300">{message}</p>}
      </form>
    </main>
  );
}
