type BreathControlsProps = {
  disabled: boolean;
  phase: 'breathe' | 'hold' | 'recover';
  onNextPhase: () => void;
};

const LABELS = {
  breathe: 'Начать цикл дыхания',
  hold: 'Перейти к задержке',
  recover: 'Завершить удержание',
};

export function BreathControls({ disabled, phase, onNextPhase }: BreathControlsProps) {
  return (
    <section className="rounded-xl border border-slate-700 p-4">
      <p className="mb-2 text-sm text-slate-300">Текущая фаза: {phase}</p>
      <button
        type="button"
        disabled={disabled}
        onClick={onNextPhase}
        className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold disabled:opacity-50"
      >
        {LABELS[phase]}
      </button>
    </section>
  );
}
