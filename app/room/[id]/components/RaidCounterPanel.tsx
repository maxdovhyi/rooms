type RaidCounterPanelProps = {
  total: number;
  mine: number;
  goal?: number;
};

export function RaidCounterPanel({ total, mine, goal = 1000 }: RaidCounterPanelProps) {
  const progress = Math.min(100, Math.round((total / goal) * 100));

  return (
    <section className="rounded-xl border border-slate-700 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">Raid goal</p>
      <p className="text-sm text-slate-200">{goal} reps</p>
      <div className="mt-2 h-2 w-full rounded-full bg-slate-800">
        <div className="h-2 rounded-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span>Total: {total}</span>
        <span>My score: {mine}</span>
      </div>
    </section>
  );
}
