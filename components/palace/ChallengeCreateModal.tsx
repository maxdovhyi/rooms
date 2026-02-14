import { useState } from 'react';

export function ChallengeCreateModal({ onCreate }: { onCreate: (payload: { title: string; type: 'checkin' | 'metric'; duration_days: number }) => Promise<void> }) {
  const [title, setTitle] = useState('NO SUGAR 14 days');
  const [type, setType] = useState<'checkin' | 'metric'>('checkin');
  const [days, setDays] = useState(30);

  return (
    <section className="rounded-xl border border-slate-700 p-4">
      <h3 className="mb-2 font-semibold">Create Challenge</h3>
      <input value={title} onChange={(e) => setTitle(e.target.value)} className="mb-2 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2" />
      <div className="mb-2 flex gap-2">
        <select value={type} onChange={(e) => setType(e.target.value as 'checkin' | 'metric')} className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2">
          <option value="checkin">Daily check-in</option>
          <option value="metric">Metric based</option>
        </select>
        <input type="number" min={1} value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-24 rounded-md border border-slate-700 bg-slate-900 px-3 py-2" />
      </div>
      <button onClick={() => onCreate({ title, type, duration_days: days })} className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold">Create</button>
    </section>
  );
}
