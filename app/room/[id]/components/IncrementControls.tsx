type IncrementControlsProps = {
  onIncrement: (delta: number) => void;
};

const STEPS = [1, 5, 10];

export function IncrementControls({ onIncrement }: IncrementControlsProps) {
  return (
    <section className="grid grid-cols-3 gap-2">
      {STEPS.map((delta) => (
        <button
          key={delta}
          type="button"
          onClick={() => onIncrement(delta)}
          className="rounded-lg bg-indigo-500 px-4 py-3 text-lg font-bold hover:bg-indigo-400"
        >
          +{delta}
        </button>
      ))}
    </section>
  );
}
