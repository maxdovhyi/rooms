import { FloatingDelta } from './FloatingDelta';

type Participant = {
  id: string;
  total: number;
  name: string;
};

type AvatarGridProps = {
  participants: Participant[];
  activeDeltas: Record<string, number | undefined>;
};

export function AvatarGrid({ participants, activeDeltas }: AvatarGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {participants.map((participant) => (
        <div key={participant.id} className="relative rounded-xl border border-slate-700 p-3 text-center">
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-slate-700 text-xs font-bold">
            {participant.name.slice(0, 2).toUpperCase()}
          </div>
          <p className="text-xs text-slate-300">{participant.name}</p>
          <p className="text-sm font-semibold">{participant.total}</p>
          {activeDeltas[participant.id] ? <FloatingDelta value={activeDeltas[participant.id] ?? 0} /> : null}
        </div>
      ))}
    </div>
  );
}
