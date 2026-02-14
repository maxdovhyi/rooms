type CounterControlsProps = {
  disabled: boolean;
  onIncrement: (delta: number) => void;
};

const STEPS = [1, 5, 10];

export function CounterControls({ disabled, onIncrement }: CounterControlsProps) {
  return (
    <section className="grid grid-cols-3 gap-2">
      {STEPS.map((delta) => (
        <button
          key={delta}
          type="button"
          disabled={disabled}
          onClick={() => onIncrement(delta)}
          className="rounded-lg bg-indigo-500 px-4 py-3 text-lg font-bold disabled:opacity-50"
        >
          +{delta}
        </button>
      ))}
    </section>
  );
}
