type Session = {
  id: string;
  category: string;
  result_value: number;
  unit: string;
  completed_at: string;
};

export function RecentSessions({ items }: { items: Session[] }) {
  return (
    <section className="rounded-xl border border-slate-700 p-4">
      <h2 className="mb-2 font-semibold">Recent sessions</h2>
      <div className="space-y-1 text-sm text-slate-300">
        {items.map((item) => (
          <p key={item.id}>{item.category}: {item.result_value} {item.unit} • {new Date(item.completed_at).toLocaleString()}</p>
        ))}
        {!items.length ? <p className="text-slate-500">No sessions yet.</p> : null}
      </div>
    </section>
  );
}
