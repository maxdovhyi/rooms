type Commitment = {
  id: string;
  title: string;
  day: number;
  total: number;
  checkedToday: boolean;
};

export function CommitmentsList({ commitments }: { commitments: Commitment[] }) {
  return (
    <section className="rounded-xl border border-slate-700 p-4">
      <h2 className="mb-2 font-semibold">Commitments</h2>
      {!commitments.length ? <p className="text-sm text-slate-400">No active challenges.</p> : null}
      <div className="space-y-2 text-sm">
        {commitments.map((c) => (
          <div key={c.id} className="rounded-md border border-slate-700 p-2">
            <p>{c.title}</p>
            <p className="text-slate-400">day {c.day}/{c.total} • today {c.checkedToday ? '✅' : '⏳'}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
