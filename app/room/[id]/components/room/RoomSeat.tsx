import { CSSProperties } from 'react';
import { FloatingDelta } from '../FloatingDelta';

type SeatParticipant = {
  id: string;
  name: string;
  total: number;
  ready: boolean;
  isHost: boolean;
  online: boolean;
  joinedAt: string;
  avatarUrl?: string | null;
};

function initials(name: string) {
  const parts = name.split(/[-_\s]/).filter(Boolean);
  const first = parts[0]?.[0] ?? 'U';
  const second = parts[1]?.[0] ?? '';
  return `${first}${second}`.toUpperCase();
}

export function RoomSeat({
  participant,
  style,
  delta,
}: {
  participant?: SeatParticipant;
  style: CSSProperties;
  delta?: number;
}) {
  if (!participant) {
    return <div style={style} className="absolute h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-slate-700/60" />;
  }

  return (
    <div style={style} className="absolute -translate-x-1/2 -translate-y-1/2">
      <div
        className={`relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 bg-slate-800 text-xs font-bold transition-all ${
          participant.ready ? 'border-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.45)]' : 'border-slate-600'
        } ${delta ? 'scale-110' : 'scale-100'}`}
      >
        {participant.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={participant.avatarUrl} alt={participant.name} className="h-full w-full object-cover" />
        ) : (
          <span>{initials(participant.name)}</span>
        )}
        {participant.online ? <span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400" /> : null}
        {participant.isHost ? <span className="absolute -right-1 -top-1 text-xs">👑</span> : null}
        {delta ? <FloatingDelta value={delta} /> : null}
      </div>
      <p className="mt-1 w-20 -translate-x-2 text-center text-[10px] text-slate-300">{participant.name}</p>
    </div>
  );
}
