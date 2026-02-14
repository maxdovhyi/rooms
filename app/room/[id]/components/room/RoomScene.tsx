import { CoachCenter } from './CoachCenter';
import { RoomSeat } from './RoomSeat';

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

const SEATS = [
  { left: '50%', top: '12%' },
  { left: '70%', top: '20%' },
  { left: '82%', top: '38%' },
  { left: '78%', top: '62%' },
  { left: '64%', top: '80%' },
  { left: '50%', top: '88%' },
  { left: '36%', top: '80%' },
  { left: '22%', top: '62%' },
  { left: '18%', top: '38%' },
  { left: '30%', top: '20%' },
];

export function RoomScene({
  participants,
  activeDeltas,
  mode,
  runState,
  roomTotal,
  myTotal,
  raidGoal,
}: {
  participants: Participant[];
  activeDeltas: Record<string, number | undefined>;
  mode: 'counter' | 'timer_steps' | 'breath_cycle';
  runState: 'idle' | 'countdown' | 'running';
  roomTotal: number;
  myTotal: number;
  raidGoal: number;
}) {
  const ordered = [...participants].sort((a, b) => {
    const timeDiff = new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    if (timeDiff !== 0) return timeDiff;
    return a.id.localeCompare(b.id);
  });

  const seatParticipants = SEATS.map((_, index) => ordered[index]);
  const progress = Math.min(100, Math.round((roomTotal / Math.max(raidGoal, 1)) * 100));

  return (
    <section className="relative min-h-[520px] overflow-hidden rounded-3xl border border-slate-700 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950/30 p-4">
      <svg viewBox="0 0 1200 700" className="pointer-events-none absolute inset-0 h-full w-full opacity-70">
        <rect x="8" y="8" width="1184" height="684" rx="44" fill="rgba(15,23,42,0.9)" stroke="rgba(99,102,241,0.35)" strokeWidth="4" />
        <ellipse cx="600" cy="350" rx="340" ry="170" fill="rgba(79,70,229,0.16)" stroke="rgba(129,140,248,0.4)" strokeWidth="4" />
        <ellipse cx="600" cy="350" rx="230" ry="110" fill="rgba(30,41,59,0.92)" stroke="rgba(129,140,248,0.35)" strokeWidth="2" />
      </svg>

      <div className="relative z-20 rounded-xl border border-slate-700/80 bg-slate-950/70 p-3">
        <p className="text-xs uppercase text-slate-400">Raid progress</p>
        <div className="mt-2 h-2 rounded-full bg-slate-800">
          <div className="h-2 rounded-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-300">
          <span>Total: {roomTotal}</span>
          <span>Mine: {myTotal}</span>
          <span>Goal: {raidGoal}</span>
        </div>
      </div>

      <CoachCenter mode={mode} runState={runState} />

      <div className="absolute inset-0">
        {SEATS.map((seat, index) => (
          <RoomSeat key={`${seat.left}-${seat.top}`} style={seat} participant={seatParticipants[index]} delta={seatParticipants[index] ? activeDeltas[seatParticipants[index].id] : undefined} />
        ))}
      </div>
    </section>
  );
}
