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
    <header className="flex flex-col gap-3 border-b border-black/5 bg-white/80 backdrop-blur-xl px-6 py-4 md:flex-row md:items-center md:justify-between z-10 shrink-0">
      <div className="flex items-center gap-3.5">
        <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#007AFF] text-white shadow-sm">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
              Fleet Logistics Dispatcher
            </h1>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-[#007AFF]">
              Active Fleet
            </span>
          </div>
          <p className="text-[13px] font-medium text-neutral-500 mt-0.5">Autonomous Real-Time Optimizer</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center rounded-full bg-neutral-100 p-1 ring-1 ring-black/5">
          <span className="px-3 text-[11px] font-bold uppercase tracking-wider text-neutral-500">Speed</span>
          {[1, 2, 4].map((speed) => (
            <button
              key={speed}
              onClick={() => onChangeSpeed(speed)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all ${
                speedMultiplier === speed
                  ? "bg-white text-neutral-900 shadow-sm ring-1 ring-black/5"
                  : "text-neutral-500 hover:text-neutral-900"
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-2.5 rounded-full bg-neutral-50 px-4 py-2 ring-1 ring-black/5 text-[13px]">
          <span className="text-neutral-500 font-medium">Delivered</span>
          <span className="font-semibold text-neutral-900 font-mono text-[14px] leading-none">{completedCount}/{totalDeliveries}</span>
          <div className="h-2 w-24 overflow-hidden rounded-full bg-neutral-200 ml-1">
            <div
              className="h-full bg-[#34C759] transition-all duration-500 ease-out"
              style={{ width: `${totalDeliveries > 0 ? (completedCount / totalDeliveries) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-neutral-50 px-4 py-2 ring-1 ring-black/5 text-[13px]">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              running ? "bg-[#34C759] animate-pulse" : "bg-neutral-400"
            }`}
          />
          <span className="font-semibold text-neutral-800">
            {running ? "Running" : hasStarted ? "Paused" : "Standby"}
          </span>
        </div>

        {!hasStarted ? (
          <button
            onClick={onStart}
            disabled={incompleteDeliveries === 0}
            className="flex items-center gap-2 rounded-full bg-[#007AFF] px-5 py-2 text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-[#006ee6] active:scale-95 disabled:opacity-40"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            Dispatch Fleet
          </button>
        ) : running ? (
          <button
            onClick={onPause}
            className="flex items-center gap-2 rounded-full bg-[#FF9500] px-5 py-2 text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-[#e68600] active:scale-95"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
            Pause
          </button>
        ) : (
          <button
            onClick={onResume}
            disabled={incompleteDeliveries === 0}
            className="flex items-center gap-2 rounded-full bg-[#007AFF] px-5 py-2 text-[14px] font-semibold text-white shadow-sm transition-all hover:bg-[#006ee6] active:scale-95 disabled:opacity-40"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            Resume
          </button>
        )}

        <button
          onClick={onReset}
          className="flex items-center gap-2 rounded-full bg-white ring-1 ring-black/5 px-4 py-2 text-[14px] font-semibold text-neutral-700 shadow-sm transition-all hover:bg-neutral-50 hover:text-neutral-900 active:scale-95"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          Reset
        </button>
      </div>
    </header>
  );
}
