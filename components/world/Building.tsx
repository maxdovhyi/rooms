export type BuildingDef = {
  id: 'gym' | 'meditation' | 'wimhof' | 'palace';
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

export function Building({ building, inside }: { building: BuildingDef; inside: number }) {
  return (
    <div className="absolute rounded-xl border border-indigo-500/30 bg-slate-900/80 p-2 text-center" style={{ left: building.x, top: building.y, width: building.w, height: building.h }}>
      <p className="text-sm font-semibold">{building.label}</p>
      <p className="text-xs text-emerald-300">🟢 {inside} inside</p>
    </div>
  );
}
