export type Achievement = { key: string; title: string; unlocked: boolean };

export function AchievementGrid({ achievements }: { achievements: Achievement[] }) {
  const sorted = [...achievements].sort((a, b) => Number(b.unlocked) - Number(a.unlocked));
  return (
    <section className="rounded-xl border border-slate-700 p-4">
      <h2 className="mb-2 font-semibold">Achievements</h2>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {sorted.map((item) => (
          <div key={item.key} className={`rounded-md border p-2 ${item.unlocked ? 'border-emerald-500 text-emerald-300' : 'border-slate-700 text-slate-400'}`}>
            {item.unlocked ? '✅' : '⬜'} {item.title}
          </div>
        ))}
      </div>
    </section>
  );
}
