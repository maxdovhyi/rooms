export function BankTiles({
  meditation,
  reps,
  breathCycles,
  bestHold,
}: {
  meditation: { week: number; month: number; all: number };
  reps: { week: number; month: number; all: number };
  breathCycles: { week: number; month: number };
  bestHold: number;
}) {
  return (
    <section className="grid gap-3 md:grid-cols-3">
      <article className="rounded-xl border border-slate-700 p-3 text-sm">
        <p className="font-semibold">🧘 Meditation Minutes Bank</p>
        <p>week {meditation.week} • 30d {meditation.month} • all {meditation.all}</p>
      </article>
      <article className="rounded-xl border border-slate-700 p-3 text-sm">
        <p className="font-semibold">🏋️ Reps Bank</p>
        <p>week {reps.week} • 30d {reps.month} • all {reps.all}</p>
      </article>
      <article className="rounded-xl border border-slate-700 p-3 text-sm">
        <p className="font-semibold">🫁 Wim Hof</p>
        <p>cycles week {breathCycles.week} • 30d {breathCycles.month}</p>
        <p>best hold {bestHold}s</p>
      </article>
    </section>
  );
}
