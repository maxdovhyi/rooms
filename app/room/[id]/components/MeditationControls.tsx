type MeditationControlsProps = {
  disabled: boolean;
  selectedMinutes: number;
  onSelectMinutes: (value: number) => void;
  onComplete: () => void;
};

export function MeditationControls({ disabled, selectedMinutes, onSelectMinutes, onComplete }: MeditationControlsProps) {
  return (
    <section className="space-y-3 rounded-xl border border-slate-700 p-4">
      <p className="text-sm text-slate-300">Выберите формат медитации</p>
      <div className="flex gap-2">
        {[5, 7, 10].map((value) => (
          <button
            key={value}
            type="button"
            disabled={disabled}
            onClick={() => onSelectMinutes(value)}
            className={`rounded-md px-3 py-2 text-sm ${selectedMinutes === value ? 'bg-indigo-500' : 'bg-slate-800'} disabled:opacity-50`}
          >
            {value} min
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onComplete}
        className="rounded-md border border-emerald-500 px-3 py-2 text-sm text-emerald-300 disabled:opacity-50"
      >
        Завершить медитацию
      </button>
    </section>
  );
}
