import { FloatingDelta } from './FloatingDelta';

type Participant = {
  id: string;
  name: string;
  total: number;
  ready: boolean;
  isHost: boolean;
  online: boolean;
  avatarUrl?: string | null;
};

type AvatarGridProps = {
  participants: Participant[];
  activeDeltas: Record<string, number | undefined>;
};

function initials(name: string) {
  const parts = name.split(/[-_\s]/).filter(Boolean);
  return (parts[0]?.[0] ?? 'U') + (parts[1]?.[0] ?? '').toUpperCase();
}

export function AvatarGrid({ participants, activeDeltas }: AvatarGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {participants.map((participant) => (
        <div
          key={participant.id}
          className={`relative rounded-xl border p-3 text-center ${participant.ready ? 'border-emerald-500' : 'border-slate-700'}`}
        >
          <div className="relative mx-auto mb-2 flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-slate-700 text-xs font-bold">
            {participant.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={participant.avatarUrl} alt={participant.name} className="h-full w-full object-cover" />
            ) : (
              <span>{initials(participant.name)}</span>
            )}
            {participant.isHost ? <span className="absolute -right-1 -top-1 text-xs">👑</span> : null}
          </div>
          <p className="text-xs text-slate-300">{participant.name}</p>
          <p className="text-sm font-semibold">{participant.total}</p>
          <p className="text-[10px] text-slate-400">{participant.online ? 'online' : 'offline'}</p>
          {activeDeltas[participant.id] ? <FloatingDelta value={activeDeltas[participant.id] ?? 0} /> : null}
        </div>
      ))}
    </div>
  );
}
