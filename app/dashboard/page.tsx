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

export default function DashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileView | null>(null);

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
    });
  }, [router]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-4 px-6 py-10">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <section className="rounded-xl border border-slate-800 p-5">
        <p>handle: {profile?.handle ?? '...'}</p>
        <p>xp_total: {profile?.xp_total ?? 0}</p>
        <p>level: {profile?.level ?? 1}</p>
        <p>streak: 0</p>
      </section>

      <div className="flex gap-3">
        <Link href="/lobby" className="rounded-md border border-slate-700 px-4 py-2">
          Go to Lobby
        </Link>
      </div>
    </main>
  );
}
