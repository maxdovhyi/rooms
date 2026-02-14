'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { AvatarGrid } from './AvatarGrid';
import { IncrementControls } from './IncrementControls';
import { RaidCounterPanel } from './RaidCounterPanel';
import { ScheduleStrip } from './ScheduleStrip';

type RoomTemplate = {
  id: string;
  title: string;
};

type ScheduledRoom = {
  id: string;
  start_at: string;
  end_at: string;
  status: 'scheduled' | 'running' | 'ended' | 'cancelled';
  template_id: string;
  room_templates: RoomTemplate | null;
};

type Participant = { id: string; name: string; total: number };

type IncrementPayload = { userId: string; delta: number; ts: number };

type SnapshotPayload = { totals: Record<string, number>; ts: number };

function makeGuestId() {
  const existing = window.localStorage.getItem('rr_guest_id');
  if (existing) return existing;
  const value = `guest-${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem('rr_guest_id', value);
  return value;
}

function getTimerLabel(endAt?: string) {
  if (!endAt) return '--:--';
  const delta = new Date(endAt).getTime() - Date.now();
  if (delta <= 0) return '00:00';
  const totalSec = Math.floor(delta / 1000);
  const minutes = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const seconds = String(totalSec % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function RoomArena({ roomId }: { roomId: string }) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const meRef = useRef<string>('guest');
  const [room, setRoom] = useState<ScheduledRoom | null>(null);
  const [daySlots, setDaySlots] = useState<ScheduledRoom[]>([]);
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeDeltas, setActiveDeltas] = useState<Record<string, number | undefined>>({});
  const [timerLabel, setTimerLabel] = useState('--:--');
  const [userId, setUserId] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const totalsRef = useRef<Record<string, number>>({});
  const joinedAtRef = useRef<string>(new Date().toISOString());

  useEffect(() => {
    meRef.current = makeGuestId();
    joinedAtRef.current = new Date().toISOString();
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    supabase
      .from('scheduled_rooms')
      .select('id,start_at,end_at,status,template_id,room_templates(id,title)')
      .eq('id', roomId)
      .single()
      .then(({ data }) => {
        if (data) {
          setRoom(data as ScheduledRoom);
        }
      });
  }, [roomId]);

  useEffect(() => {
    if (!room) return;

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    supabase
      .from('scheduled_rooms')
      .select('id,start_at,end_at,status,template_id,room_templates(id,title)')
      .eq('template_id', room.template_id)
      .gte('start_at', start.toISOString())
      .lt('start_at', end.toISOString())
      .order('start_at', { ascending: true })
      .then(({ data }) => setDaySlots((data ?? []) as ScheduledRoom[]));
  }, [room]);

  useEffect(() => {
    if (!room) return;

    const channel = supabase.channel(`arena:${room.id}`, {
      config: { presence: { key: meRef.current } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const ids = Object.keys(state);
        setParticipants(
          ids.map((id) => ({
            id,
            name: id === meRef.current ? 'You' : id,
            total: totalsRef.current[id] ?? 0,
          }))
        );
      })
      .on('broadcast', { event: 'increment' }, ({ payload }) => {
        const data = payload as IncrementPayload;
        setTotals((prev) => ({ ...prev, [data.userId]: (prev[data.userId] ?? 0) + data.delta }));
        setActiveDeltas((prev) => ({ ...prev, [data.userId]: data.delta }));
        window.setTimeout(() => {
          setActiveDeltas((prev) => ({ ...prev, [data.userId]: undefined }));
        }, 900);
      })
      .on('broadcast', { event: 'snapshot_request' }, () => {
        channel.send({
          type: 'broadcast',
          event: 'snapshot',
          payload: { totals: totalsRef.current, ts: Date.now() } as SnapshotPayload,
        });
      })
      .on('broadcast', { event: 'snapshot' }, ({ payload }) => {
        const data = payload as SnapshotPayload;
        if (Object.keys(totalsRef.current).length === 0 && data.ts) {
          setTotals(data.totals ?? {});
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ joinedAt: new Date().toISOString() });
          channel.send({ type: 'broadcast', event: 'snapshot_request', payload: { requester: meRef.current } });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [room]);

  useEffect(() => {
    const timer = window.setInterval(() => setTimerLabel(getTimerLabel(room?.end_at)), 1000);
    return () => window.clearInterval(timer);
  }, [room?.end_at]);

  useEffect(() => {
    totalsRef.current = totals;
  }, [totals]);

  const myTotal = totals[meRef.current] ?? 0;
  const roomTotal = useMemo(() => Object.values(totals).reduce((sum, n) => sum + n, 0), [totals]);
  const effectiveParticipants = participants.length
    ? participants.map((entry) => ({ ...entry, total: totals[entry.id] ?? 0 }))
    : [{ id: meRef.current, name: 'You', total: myTotal }];


  async function submitResult() {
    if (!room || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitMessage('Submitting...');

    const response = await fetch('/api/sessions/finalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scheduledRoomId: room.id,
        resultValue: myTotal,
        joinedAt: joinedAtRef.current,
        participantKey: meRef.current,
        userId,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setSubmitMessage(payload.error ?? 'Failed to submit result');
      setIsSubmitting(false);
      return;
    }

    if (payload.alreadySubmitted) {
      setSubmitMessage('Result already submitted for this room.');
      setIsSubmitting(false);
      return;
    }

    setSubmitMessage(`Done: +${payload.xpAwarded ?? 0} XP • streak ${payload.streak ?? 0}`);
    setIsSubmitting(false);
  }

  function increment(delta: number) {
    const payload: IncrementPayload = { userId: meRef.current, delta, ts: Date.now() };
    setTotals((prev) => ({ ...prev, [payload.userId]: (prev[payload.userId] ?? 0) + delta }));
    setActiveDeltas((prev) => ({ ...prev, [payload.userId]: delta }));
    window.setTimeout(() => {
      setActiveDeltas((prev) => ({ ...prev, [payload.userId]: undefined }));
    }, 900);

    channelRef.current?.send({ type: 'broadcast', event: 'increment', payload });
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-10">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{room?.room_templates?.title ?? `Room ${roomId}`}</h1>
        <p className="text-2xl font-semibold">{timerLabel}</p>
      </header>

      <div className="space-y-4">
        <ScheduleStrip slots={daySlots} currentRoomId={roomId} />
        <RaidCounterPanel total={roomTotal} mine={myTotal} />
        <AvatarGrid participants={effectiveParticipants} activeDeltas={activeDeltas} />
        <IncrementControls onIncrement={increment} />
        <button
          type="button"
          onClick={submitResult}
          disabled={isSubmitting}
          className="w-full rounded-lg border border-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-300 disabled:opacity-60"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Result'}
        </button>
        {submitMessage ? <p className="text-sm text-slate-300">{submitMessage}</p> : null}
      </div>

      <Link href="/lobby" className="mt-8 inline-block text-sm text-indigo-300">
        ← Back to lobby
      </Link>
    </main>
  );
}
