'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { WorldScene } from '@/components/world/WorldScene';

export default function WorldPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<{ handle: string; level: number } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) {
        router.replace('/');
        return;
      }

      const { data: loaded } = await supabase
        .from('profiles')
        .select('handle,level')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!loaded) {
        router.replace('/onboarding');
        return;
      }

      setProfile(loaded);
    });
  }, [router]);

  if (!profile) {
    return <main className="p-6">Loading world...</main>;
  }

  return <WorldScene handle={profile.handle} level={profile.level} />;
}
