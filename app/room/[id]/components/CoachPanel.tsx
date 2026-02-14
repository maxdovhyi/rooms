type CoachMessage = {
  id: string;
  text: string;
  ts: number;
};

export function CoachPanel({ messages }: { messages: CoachMessage[] }) {
  return (
    <section className="rounded-xl border border-slate-700 p-4">
      <p className="mb-2 text-xs uppercase text-slate-400">Coach</p>
      <div className="max-h-40 space-y-2 overflow-y-auto text-sm">
        {messages.map((message) => (
          <div key={message.id} className="rounded-md bg-slate-900 p-2">
            <p className="text-indigo-300">🤖 Coach</p>
            <p>{message.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
