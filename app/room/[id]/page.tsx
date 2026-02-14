import Link from 'next/link';

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-bold">Room {id}</h1>
      <p className="mt-3 text-slate-300">Room skeleton page for Sprint 1.</p>
      <button className="mt-6 rounded-md bg-indigo-500 px-4 py-2 font-semibold">Start</button>
      <div>
        <Link href="/lobby" className="mt-6 inline-block text-sm text-indigo-300">
          ← Back to lobby
        </Link>
      </div>
    </main>
  );
}
