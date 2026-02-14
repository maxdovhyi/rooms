'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

type RoomTemplate = {
  id: string;
  title: string;
  verification_mode: string;
  is_featured: boolean;
};

export default function LobbyPage() {
  const [templates, setTemplates] = useState<RoomTemplate[]>([]);

  useEffect(() => {
    supabase
      .from('room_templates')
      .select('id,title,verification_mode,is_featured')
      .order('created_at', { ascending: false })
      .then(({ data }) => setTemplates(data ?? []));
  }, []);

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-6 py-10">
      <h1 className="mb-4 text-3xl font-bold">Lobby</h1>
      <div className="space-y-3">
        {templates.map((template) => (
          <article key={template.id} className="rounded-xl border border-slate-800 p-4">
            <h2 className="text-xl font-semibold">{template.title}</h2>
            <p className="text-sm text-slate-300">Verification: {template.verification_mode}</p>
            {template.is_featured && <p className="text-xs text-indigo-300">Featured</p>}
            <Link href={`/room/${template.id}`} className="mt-3 inline-block rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold">
              Open room
            </Link>
          </article>
        ))}

        {!templates.length && <p className="text-slate-400">No room templates yet.</p>}
      </div>
    </main>
  );
}
