export function CoachCenter({ mode, runState }: { mode: string; runState: 'idle' | 'countdown' | 'running' }) {
  const subtitle =
    runState === 'idle'
      ? 'Нажмите Ready — старт при 2 участниках'
      : runState === 'countdown'
        ? 'Подготовьтесь, синхронный запуск'
        : mode === 'counter'
          ? 'Работаем в ритме рейда'
          : mode === 'timer_steps'
            ? 'Держим внимание на дыхании'
            : 'Фазы: breathe → hold → recover';

  return (
    <div className="absolute left-1/2 top-1/2 z-10 w-56 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-indigo-400/50 bg-slate-900/90 p-3 text-center shadow-lg">
      <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/30 text-lg">🧘</div>
      <p className="text-sm font-semibold text-indigo-200">Coach</p>
      <p className="text-xs text-slate-300">{subtitle}</p>
    </div>
  );
}
