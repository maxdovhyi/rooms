type Slot = {
  id: string;
  start_at: string;
  status: 'scheduled' | 'running' | 'ended' | 'cancelled';
};

type ScheduleStripProps = {
  slots: Slot[];
  currentRoomId: string;
};

export function ScheduleStrip({ slots, currentRoomId }: ScheduleStripProps) {
  return (
    <section className="rounded-xl border border-slate-700 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">Today schedule</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {slots.map((slot) => {
          const date = new Date(slot.start_at);
          const label = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const isCurrent = slot.id === currentRoomId;
          return (
            <span
              key={slot.id}
              className={`rounded-md px-2 py-1 text-xs ${
                isCurrent ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-200'
              }`}
            >
              {label} · {slot.status}
            </span>
          );
        })}
      </div>
    </section>
  );
}
