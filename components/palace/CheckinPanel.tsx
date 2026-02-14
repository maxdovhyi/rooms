export function CheckinPanel({ onCheckin }: { onCheckin: (status: 'ok' | 'fail') => Promise<void> }) {
  return (
    <section className="rounded-xl border border-slate-700 p-4">
      <h3 className="mb-2 font-semibold">Today check-in</h3>
      <div className="flex gap-2">
        <button onClick={() => onCheckin('ok')} className="rounded-md border border-emerald-400 px-3 py-2 text-sm text-emerald-300">✅ I’m OK today</button>
        <button onClick={() => onCheckin('fail')} className="rounded-md border border-rose-400 px-3 py-2 text-sm text-rose-300">😵 Fail today</button>
      </div>
    </section>
  );
}
