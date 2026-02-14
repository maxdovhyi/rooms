type Challenge = {
  id: string;
  title: string;
  type: 'checkin' | 'metric';
  start_at: string;
  end_at: string | null;
};

export function ChallengeCard({ challenge, onOpen }: { challenge: Challenge; onOpen: (id: string) => void }) {
  return (
    <article className="rounded-xl border border-slate-700 p-4">
      <p className="font-semibold">{challenge.title}</p>
      <p className="text-xs text-slate-400">{challenge.type} • {new Date(challenge.start_at).toLocaleDateString()}</p>
      <button onClick={() => onOpen(challenge.id)} className="mt-3 rounded-md border border-indigo-400 px-3 py-1 text-sm">Open</button>
    </article>
  );
}
