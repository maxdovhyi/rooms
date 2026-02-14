type FloatingDeltaProps = {
  value: number;
};

export function FloatingDelta({ value }: FloatingDeltaProps) {
  return (
    <span className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 animate-[floatUp_900ms_ease-out_forwards] text-sm font-bold text-emerald-300">
      +{value}
    </span>
  );
}
