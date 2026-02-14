'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

type ScheduledRoom = {
  id: string;
  start_at: string;
  end_at: string;
  status: 'scheduled' | 'running' | 'ended' | 'cancelled';
  room_templates: {
    id: string;
    title: string;
  } | null;
};

function getCountdownLabel(startAt: string, nowMs: number): string {
  const deltaMs = new Date(startAt).getTime() - nowMs;

  if (deltaMs <= 0) {
    return 'Started';
  }

  const totalSeconds = Math.floor(deltaMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m ${seconds}s`;
}

export default function LobbyPage() {
  const [rooms, setRooms] = useState<ScheduledRoom[]>([]);
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const nowIso = new Date().toISOString();
    const endWindow = new Date();
    endWindow.setHours(endWindow.getHours() + 24);

    supabase
      .from('scheduled_rooms')
      .select('id,start_at,end_at,status,room_templates(id,title)')
      .gte('start_at', nowIso)
      .lt('start_at', endWindow.toISOString())
      .order('start_at', { ascending: true })
      .then(({ data }) => setRooms((data ?? []) as ScheduledRoom[]));
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const upcomingRooms = useMemo(() => {
    return rooms.filter((room) => room.room_templates);
  }, [rooms]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-6 py-10">
      <h1 className="mb-4 text-3xl font-bold">Lobby</h1>
      <p className="mb-6 text-sm text-slate-400">Upcoming scheduled rooms for the next 24 hours.</p>

      <div className="space-y-3">
        {upcomingRooms.map((room) => (
          <article key={room.id} className="rounded-xl border border-slate-800 p-4">
            <h2 className="text-xl font-semibold">{room.room_templates?.title}</h2>
            <p className="text-sm text-slate-300">Status: {room.status}</p>
            <p className="text-sm text-slate-300">Starts in: {getCountdownLabel(room.start_at, nowMs)}</p>
            <Link
              href={`/room/${room.id}`}
              className="mt-3 inline-block rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold"
            >
              Open scheduled room
            </Link>
          </article>
        ))}

        {!upcomingRooms.length && <p className="text-slate-400">No scheduled rooms in the next 24 hours.</p>}
      </div>
    </main>
  );
}
