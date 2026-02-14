'use client';

import { useEffect, useMemo, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { clampToBounds, detectZone, Rect } from '@/lib/world/geometry';
import { throttle } from '@/lib/world/presence';
import { Building, BuildingDef } from './Building';
import { PlayerSprite } from './PlayerSprite';

type PresencePlayer = {
  userId: string;
  handle: string;
  x: number;
  y: number;
  zone: string;
  updated_at: number;
  bot?: boolean;
};

const WIDTH = 980;
const HEIGHT = 620;

const BUILDINGS: BuildingDef[] = [
  { id: 'gym', label: '🏋️ Raid Gym', x: 80, y: 120, w: 180, h: 120 },
  { id: 'meditation', label: '🧘 Meditation Hall', x: 340, y: 90, w: 220, h: 130 },
  { id: 'wimhof', label: '🫁 Wim Hof Lab', x: 640, y: 130, w: 200, h: 120 },
  { id: 'palace', label: '🏛️ Challenge Palace', x: 370, y: 350, w: 250, h: 170 },
];

const ZONES: Record<string, Rect> = Object.fromEntries(
  BUILDINGS.map((b) => [b.id, { x: b.x, y: b.y, w: b.w, h: b.h }]),
);

const BOT_PLAYERS: PresencePlayer[] = [
  { userId: 'bot-1', handle: 'Mila', x: 120, y: 290, zone: 'world', updated_at: Date.now(), bot: true },
  { userId: 'bot-2', handle: 'ZenFox', x: 470, y: 280, zone: 'meditation', updated_at: Date.now(), bot: true },
  { userId: 'bot-3', handle: 'Iceman', x: 740, y: 320, zone: 'wimhof', updated_at: Date.now(), bot: true },
];

export function WorldScene({ handle, level }: { handle: string; level: number }) {
  const router = useRouter();
  const [me, setMe] = useState({ x: 470, y: 520, zone: 'world' });
  const [peers, setPeers] = useState<PresencePlayer[]>([]);
  const [nearBuilding, setNearBuilding] = useState<BuildingDef | null>(null);
  const [peek, setPeek] = useState<BuildingDef | null>(null);

  useEffect(() => {
    let active = true;
    const channel: RealtimeChannel = supabase.channel('world:lobby', { config: { presence: { key: `world-${handle}` } } });

    const sync = () => {
      const state = channel.presenceState();
      const remote = Object.values(state)
        .flat()
        .map((raw) => raw as PresencePlayer)
        .filter((entry) => entry.userId !== `world-${handle}`);
      if (active) setPeers(remote);
    };

    channel.on('presence', { event: 'sync' }, sync).subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          userId: `world-${handle}`,
          handle,
          x: me.x,
          y: me.y,
          zone: me.zone,
          updated_at: Date.now(),
        });
      }
    });

    const sendPresence = throttle((x: number, y: number, zone: string) => {
      channel.track({ userId: `world-${handle}`, handle, x, y, zone, updated_at: Date.now() });
    }, 100);

    const keys = new Set<string>();
    const onDown = (e: KeyboardEvent) => {
      keys.add(e.key.toLowerCase());
      if (e.key.toLowerCase() === 'e' && nearBuilding) {
        if (nearBuilding.id === 'palace') router.push('/palace');
        else router.push('/lobby');
      }
      if (e.code === 'Space' && nearBuilding) {
        e.preventDefault();
        setPeek(nearBuilding);
      }
    };
    const onUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);

    const tick = setInterval(() => {
      setMe((prev) => {
        const speed = 6;
        let nx = prev.x;
        let ny = prev.y;
        if (keys.has('arrowup') || keys.has('w')) ny -= speed;
        if (keys.has('arrowdown') || keys.has('s')) ny += speed;
        if (keys.has('arrowleft') || keys.has('a')) nx -= speed;
        if (keys.has('arrowright') || keys.has('d')) nx += speed;
        const clamped = clampToBounds(nx, ny, WIDTH, HEIGHT);
        const zone = detectZone(clamped, ZONES);
        sendPresence(clamped.x, clamped.y, zone);
        return { ...clamped, zone };
      });
    }, 33);

    return () => {
      active = false;
      clearInterval(tick);
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      channel.unsubscribe();
    };
  }, [handle, me.x, me.y, me.zone, nearBuilding, router]);

  useEffect(() => {
    const hit = BUILDINGS.find((b) => me.x >= b.x - 20 && me.x <= b.x + b.w + 20 && me.y >= b.y - 20 && me.y <= b.y + b.h + 20) ?? null;
    setNearBuilding(hit);
  }, [me]);

  const everyone = useMemo(() => [...peers, ...BOT_PLAYERS], [peers]);

  const insideCounts = useMemo(() => {
    return Object.fromEntries(
      BUILDINGS.map((b) => [b.id, everyone.filter((p) => p.zone === b.id).length]),
    );
  }, [everyone]);

  const peekList = peek ? everyone.filter((p) => p.zone === peek.id).slice(0, 5) : [];

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-8">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold">World</h1>
        <p className="text-sm text-slate-300">@{handle} • LV {level}</p>
      </header>

      <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-b from-slate-900 to-indigo-950" style={{ width: WIDTH, height: HEIGHT }}>
        {BUILDINGS.map((building) => (
          <Building key={building.id} building={building} inside={insideCounts[building.id] ?? 0} />
        ))}

        <PlayerSprite x={me.x} y={me.y} label={handle} me />
        {everyone.map((player) => (
          <PlayerSprite key={player.userId} x={player.x} y={player.y} label={player.handle} />
        ))}

        {nearBuilding ? (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg border border-indigo-400 bg-slate-900/90 px-4 py-2 text-sm">
            <p>{nearBuilding.label}</p>
            <p className="text-xs text-slate-300">E: Enter • Space: Peek</p>
          </div>
        ) : null}

        {peek ? (
          <div className="absolute right-4 top-4 w-64 rounded-xl border border-slate-600 bg-slate-950/95 p-3">
            <p className="font-semibold">Peek: {peek.label}</p>
            <p className="mb-2 text-xs text-slate-400">Inside now: {insideCounts[peek.id] ?? 0}</p>
            <div className="space-y-1 text-sm">
              {peekList.map((p) => (
                <p key={p.userId}>• {p.handle}{p.bot ? ' 🤖' : ''}</p>
              ))}
              {!peekList.length ? <p className="text-slate-500">No one right now</p> : null}
            </div>
            <button className="mt-3 rounded-md border border-indigo-400 px-2 py-1 text-xs" onClick={() => (peek.id === 'palace' ? router.push('/palace') : router.push('/lobby'))}>Enter</button>
            <button className="ml-2 mt-3 rounded-md border border-slate-600 px-2 py-1 text-xs" onClick={() => setPeek(null)}>Close</button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
