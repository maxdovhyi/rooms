'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { BreathControls } from './BreathControls';
import { CoachPanel } from './CoachPanel';
import { CounterControls } from './CounterControls';
import { MeditationControls } from './MeditationControls';
import { ScheduleStrip } from './ScheduleStrip';
import { RoomScene } from './room/RoomScene';

type RoomMode = 'counter' | 'timer_steps' | 'breath_cycle';

type RoomTemplate = {
  id: string;
  title: string;
  mode: RoomMode | null;
};

type ScheduledRoom = {
  id: string;
  start_at: string;
  end_at: string;
  status: 'scheduled' | 'running' | 'ended' | 'cancelled';
  template_id: string;
  room_templates: RoomTemplate | null;
};

type Participant = {
  id: string;
  name: string;
  total: number;
  ready: boolean;
  isHost: boolean;
  online: boolean;
  joinedAt: string;
  avatarUrl?: string | null;
};

type IncrementPayload = { userId: string; delta: number; ts: number };
type CoachMessage = { id: string; text: string; ts: number };

function makeGuestId() {
  const existing = window.localStorage.getItem('rr_guest_id');
  if (existing) return existing;
  const value = `guest-${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem('rr_guest_id', value);
  return value;
}

function detectMode(template?: RoomTemplate | null): RoomMode {
  if (template?.mode) return template.mode;
  const title = template?.title.toLowerCase() ?? '';
  if (title.includes('meditation')) return 'timer_steps';
  if (title.includes('wim') || title.includes('breath')) return 'breath_cycle';
  return 'counter';
}

export function RoomArena({ roomId }: { roomId: string }) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const meRef = useRef<string>('guest');
  const joinedAtRef = useRef<string>(new Date().toISOString());

  const [room, setRoom] = useState<ScheduledRoom | null>(null);
  const [daySlots, setDaySlots] = useState<ScheduledRoom[]>([]);
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [readyMap, setReadyMap] = useState<Record<string, boolean>>({});
  const readyRef = useRef<Record<string, boolean>>({});
  const totalsRef = useRef<Record<string, number>>({});
  const [activeDeltas, setActiveDeltas] = useState<Record<string, number | undefined>>({});
  const [runState, setRunState] = useState<'idle' | 'countdown' | 'running'>('idle');
  const [countdownLeft, setCountdownLeft] = useState(0);
  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>([]);
  const [meditationMinutes, setMeditationMinutes] = useState(7);
  const [breathPhase, setBreathPhase] = useState<'breathe' | 'hold' | 'recover'>('breathe');
  const [userId, setUserId] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitDetails, setSubmitDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mode = detectMode(room?.room_templates);

  function addCoach(text: string) {
    setCoachMessages((prev) => [...prev.slice(-8), { id: `${Date.now()}-${Math.random()}`, text, ts: Date.now() }]);
  }

  useEffect(() => {
    meRef.current = makeGuestId();
    joinedAtRef.current = new Date().toISOString();
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    addCoach('Выберите программу и нажмите Ready.');
  }, []);

  useEffect(() => {
    supabase
      .from('scheduled_rooms')
      .select('id,start_at,end_at,status,template_id,room_templates(id,title,mode)')
      .eq('id', roomId)
      .single()
      .then(({ data }) => data && setRoom(data as ScheduledRoom));
  }, [roomId]);

  useEffect(() => {
    if (!room) return;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    supabase
      .from('scheduled_rooms')
      .select('id,start_at,end_at,status,template_id,room_templates(id,title,mode)')
      .eq('template_id', room.template_id)
      .gte('start_at', start.toISOString())
      .lt('start_at', end.toISOString())
      .order('start_at', { ascending: true })
      .then(({ data }) => setDaySlots((data ?? []) as ScheduledRoom[]));
  }, [room]);

  useEffect(() => {
    if (!room) return;
    const channel = supabase.channel(`arena:${room.id}`, { config: { presence: { key: meRef.current } } });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const ids = Object.keys(state).sort();

        setParticipants(
          ids.map((id, index) => {
            const meta = (state[id]?.[0] ?? {}) as { ready?: boolean; joinedAt?: string; avatarUrl?: string };
            return {
              id,
              name: id === meRef.current ? 'You' : id,
              total: totalsRef.current[id] ?? 0,
              ready: Boolean(meta.ready ?? readyRef.current[id]),
              isHost: index === 0,
              online: true,
              joinedAt: meta.joinedAt ?? new Date().toISOString(),
              avatarUrl: meta.avatarUrl ?? null,
            };
          })
        );
      })
      .on('broadcast', { event: 'increment' }, ({ payload }) => {
        const data = payload as IncrementPayload;
        setTotals((prev) => ({ ...prev, [data.userId]: (prev[data.userId] ?? 0) + data.delta }));
        setActiveDeltas((prev) => ({ ...prev, [data.userId]: data.delta }));
        window.setTimeout(() => setActiveDeltas((prev) => ({ ...prev, [data.userId]: undefined })), 800);
      })
      .on('broadcast', { event: 'ready_update' }, ({ payload }) => {
        const data = payload as { userId: string; ready: boolean };
        setReadyMap((prev) => ({ ...prev, [data.userId]: data.ready }));
      })
      .on('broadcast', { event: 'run_start' }, ({ payload }) => {
        const data = payload as { startAt: number };
        const sec = Math.max(1, Math.ceil((data.startAt - Date.now()) / 1000));
        setRunState('countdown');
        setCountdownLeft(sec);
        addCoach(`Старт через ${sec} секунд...`);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ joinedAt: joinedAtRef.current, ready: false });
        }
      });

    channelRef.current = channel;
    return () => {
      channel.unsubscribe();
    };
  }, [room]);

  useEffect(() => {
    if (runState !== 'countdown') return;
    if (countdownLeft <= 0) {
      setRunState('running');
      addCoach(
        mode === 'counter'
          ? 'Поехали! Набираем очки.'
          : mode === 'timer_steps'
            ? 'Начинаем медитацию, держите фокус.'
            : 'Старт цикла: breathe → hold → recover.'
      );
      return;
    }
    const timer = window.setTimeout(() => setCountdownLeft((v) => v - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdownLeft, mode, runState]);

  useEffect(() => {
    readyRef.current = readyMap;
  }, [readyMap]);

  useEffect(() => {
    totalsRef.current = totals;
  }, [totals]);

  const myTotal = totals[meRef.current] ?? 0;
  const roomTotal = useMemo(() => Object.values(totals).reduce((sum, n) => sum + n, 0), [totals]);
  const readyCount = useMemo(() => Object.values(readyMap).filter(Boolean).length, [readyMap]);
  const canStart = readyCount >= 2;

  const baseParticipants = participants.length
    ? participants.map((entry) => ({ ...entry, ready: readyMap[entry.id] ?? entry.ready, total: totals[entry.id] ?? 0 }))
    : [
        {
          id: meRef.current,
          name: 'You',
          total: myTotal,
          ready: readyMap[meRef.current] ?? false,
          isHost: true,
          online: true,
          joinedAt: joinedAtRef.current,
          avatarUrl: null,
        },
      ];

  const botParticipants = [
    { id: 'bot-room-1', name: 'Ritmo', total: Math.max(3, Math.floor(roomTotal * 0.2)), ready: true, isHost: false, online: true, joinedAt: '2026-01-01T10:00:00.000Z', avatarUrl: null },
    { id: 'bot-room-2', name: 'MediBee', total: Math.max(2, Math.floor(roomTotal * 0.12)), ready: true, isHost: false, online: true, joinedAt: '2026-01-01T10:02:00.000Z', avatarUrl: null },
  ];

  const effectiveParticipants = baseParticipants.length < 4 ? [...baseParticipants, ...botParticipants.slice(0, 4 - baseParticipants.length)] : baseParticipants;

  async function toggleReady() {
    const next = !(readyMap[meRef.current] ?? false);
    setReadyMap((prev) => ({ ...prev, [meRef.current]: next }));
    await channelRef.current?.track({ joinedAt: joinedAtRef.current, ready: next });
    await channelRef.current?.send({ type: 'broadcast', event: 'ready_update', payload: { userId: meRef.current, ready: next } });
    addCoach(next ? 'Игрок готов. Ждём остальных.' : 'Игрок снял готовность.');
  }

  async function startRun() {
    if (!canStart) return;
    const startAt = Date.now() + 10_000;
    await channelRef.current?.send({ type: 'broadcast', event: 'run_start', payload: { startAt } });
  }

  async function increment(delta: number) {
    if (runState !== 'running') return;
    const payload: IncrementPayload = { userId: meRef.current, delta, ts: Date.now() };
    setTotals((prev) => ({ ...prev, [payload.userId]: (prev[payload.userId] ?? 0) + delta }));
    setActiveDeltas((prev) => ({ ...prev, [payload.userId]: delta }));
    window.setTimeout(() => setActiveDeltas((prev) => ({ ...prev, [payload.userId]: undefined })), 800);
    await channelRef.current?.send({ type: 'broadcast', event: 'increment', payload });
  }

  function nextBreathPhase() {
    const next = breathPhase === 'breathe' ? 'hold' : breathPhase === 'hold' ? 'recover' : 'breathe';
    setBreathPhase(next);
    addCoach(`Фаза ${next}. Следуйте инструкции спокойно и безопасно.`);
  }

  async function submitResult() {
    if (!room || isSubmitting) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort('timeout'), 12_000);
    setIsSubmitting(true);
    setSubmitMessage('Submitting...');
    setSubmitDetails('');

    try {
      const resultValue = mode === 'counter' ? myTotal : mode === 'timer_steps' ? meditationMinutes : 1;
      const response = await fetch('/api/sessions/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledRoomId: room.id,
          resultValue,
          joinedAt: joinedAtRef.current,
          participantKey: meRef.current,
          userId,
        }),
        signal: controller.signal,
      });

      const payload = await response
        .json()
        .catch(() => ({ ok: false, error: `Invalid server response (${response.status})` }));
      if (!response.ok || !payload.ok) {
        setSubmitMessage('Не удалось отправить. Повторить.');
        setSubmitDetails(payload.error ?? `HTTP ${response.status}`);
        return;
      }

      setSubmitMessage(`Done: +${payload.xpAwarded ?? 0} XP • streak ${payload.streak ?? 0}`);
      setSubmitDetails('');
    } catch (error) {
      console.error('Submit failed', error);
      const message = error instanceof Error ? error.message : String(error);
      setSubmitMessage('Не удалось отправить. Повторить.');
      setSubmitDetails(message);
    } finally {
      window.clearTimeout(timeout);
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{room?.room_templates?.title ?? `Room ${roomId}`}</h1>
        <p className="text-sm text-slate-300">Mode: {mode}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[3fr_1.2fr]">
        <div className="space-y-4">
          <ScheduleStrip slots={daySlots} currentRoomId={roomId} />
          <RoomScene
            participants={effectiveParticipants}
            activeDeltas={activeDeltas}
            mode={mode}
            runState={runState}
            roomTotal={roomTotal}
            myTotal={myTotal}
            raidGoal={mode === 'counter' ? 1000 : 60}
          />

          <div className="flex flex-wrap gap-2">
            <button
              onClick={toggleReady}
              className="rounded-md border border-emerald-500 px-3 py-2 text-sm text-emerald-300"
            >
              {readyMap[meRef.current] ? 'Ready ✓' : 'Ready'}
            </button>
            <button
              onClick={startRun}
              disabled={!canStart || runState === 'running'}
              className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {runState === 'countdown' ? `Start in ${countdownLeft}s` : 'Start'}
            </button>
            <p className="self-center text-xs text-slate-400">Ready: {readyCount} / 2</p>
          </div>

          {mode === 'counter' ? <CounterControls disabled={runState !== 'running'} onIncrement={increment} /> : null}
          {mode === 'timer_steps' ? (
            <MeditationControls
              disabled={runState !== 'running'}
              selectedMinutes={meditationMinutes}
              onSelectMinutes={setMeditationMinutes}
              onComplete={submitResult}
            />
          ) : null}
          {mode === 'breath_cycle' ? (
            <BreathControls disabled={runState !== 'running'} phase={breathPhase} onNextPhase={nextBreathPhase} />
          ) : null}

          {mode !== 'timer_steps' ? (
            <button
              type="button"
              onClick={submitResult}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-300 disabled:opacity-60"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Result'}
            </button>
          ) : null}

          {submitMessage ? (
            <div className="rounded-md border border-slate-700 p-3 text-sm">
              <p>{submitMessage}</p>
              {submitDetails ? <p className="mt-1 text-xs text-slate-400">details: {submitDetails}</p> : null}
            </div>
          ) : null}
        </div>

        <CoachPanel messages={coachMessages} />
      </div>

      <Link href="/lobby" className="mt-8 inline-block text-sm text-indigo-300">
        ← Back to lobby
      </Link>
    </main>
  );
}
