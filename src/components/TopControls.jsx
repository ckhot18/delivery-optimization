export default function TopControls({
  running,
  hasStarted,
  incompleteDeliveries,
  totalDeliveries,
  speedMultiplier,
  onChangeSpeed,
  onStart,
  onPause,
  onResume,
  onReset,
}) {
  const completedCount = totalDeliveries - incompleteDeliveries;

  return (
    <header className="flex flex-col gap-3 border-b border-slate-800/80 bg-[#080c16]/95 px-5 py-3 backdrop-blur md:flex-row md:items-center md:justify-between z-10">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black tracking-tight text-white font-mono">
              AI Delivery Optimizer
            </h1>
            <span className="rounded border border-cyan-400/40 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
              Phase 4
            </span>
          </div>
          <p className="text-[11px] text-slate-400">Constraint-Aware Global Fleet Optimizer</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/90 p-0.5">
          <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Speed:</span>
          {[1, 2, 4].map((speed) => (
            <button
              key={speed}
              onClick={() => onChangeSpeed(speed)}
              className={`rounded-md px-2.5 py-1 text-xs font-mono font-bold transition-all ${
                speedMultiplier === speed
                  ? "bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-mono">
          <span className="text-slate-400 text-[11px]">Orders:</span>
          <span className="font-bold text-emerald-300">{completedCount}/{totalDeliveries}</span>
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-emerald-400 transition-all duration-300"
              style={{ width: `${totalDeliveries > 0 ? (completedCount / totalDeliveries) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold">
          <span
            className={`h-2 w-2 rounded-full transition-all ${
              running ? "bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse" : "bg-amber-400/60"
            }`}
          />
          <span className={running ? "text-emerald-300 text-[10px] font-bold uppercase" : "text-amber-300 text-[10px] font-bold uppercase"}>
            {running ? "Live" : hasStarted ? "Paused" : "Ready"}
          </span>
        </div>

        {!hasStarted ? (
          <button
            onClick={onStart}
            disabled={incompleteDeliveries === 0}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/50 bg-emerald-600/20 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-200 transition-all hover:bg-emerald-600/30 hover:border-emerald-400 active:scale-95 disabled:opacity-40"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            Start
          </button>
        ) : running ? (
          <button
            onClick={onPause}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/50 bg-amber-600/20 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-200 transition-all hover:bg-amber-600/30 hover:border-amber-400 active:scale-95"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
            Pause
          </button>
        ) : (
          <button
            onClick={onResume}
            disabled={incompleteDeliveries === 0}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/50 bg-cyan-600/20 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-cyan-200 transition-all hover:bg-cyan-600/30 hover:border-cyan-400 active:scale-95 disabled:opacity-40"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            Resume
          </button>
        )}

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/90 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-300 transition-all hover:bg-slate-800 hover:text-white active:scale-95"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
          Reset
        </button>
      </div>
    </header>
  );
}
