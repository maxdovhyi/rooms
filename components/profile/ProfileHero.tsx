import Link from 'next/link';

export function ProfileHero({ handle, level, xp }: { handle: string; level: number; xp: number }) {
  return (
    <section className="rounded-2xl border border-slate-700 p-5">
      <p className="text-2xl font-bold">@{handle}</p>
      <p className="text-sm text-slate-300">Level {level} • XP {xp}</p>
      <div className="mt-3 flex gap-2 text-sm">
        <Link href="/world" className="rounded-md border border-indigo-400 px-3 py-1">Enter World</Link>
        <Link href="/lobby" className="rounded-md border border-slate-600 px-3 py-1">Lobby</Link>
        <Link href="/palace" className="rounded-md border border-slate-600 px-3 py-1">Palace</Link>
      </div>
    </section>
  );
}
