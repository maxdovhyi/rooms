export function PlayerSprite({
  x,
  y,
  label,
  me,
}: {
  x: number;
  y: number;
  label: string;
  me?: boolean;
}) {
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: x, top: y }}>
      <div className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold ${me ? 'border-indigo-300 bg-indigo-600' : 'border-slate-500 bg-slate-700'}`}>
        {label.slice(0, 2).toUpperCase()}
      </div>
      <p className="mt-1 text-center text-[10px] text-slate-300">{label}</p>
    </div>
  );
}
