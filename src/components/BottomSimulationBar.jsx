export default function BottomSimulationBar({
  metrics,
  speedMultiplier,
  onChangeSpeed,
  running,
  elapsedSeconds,
  completedDeliveries,
  totalDeliveries,
}) {
  const elapsedMins = Math.floor(elapsedSeconds / 60);
  const elapsedSecs = Math.floor(elapsedSeconds % 60);
  const timeFormatted = `${String(elapsedMins).padStart(2, "0")}:${String(elapsedSecs).padStart(2, "0")}`;

  const completionPercent = totalDeliveries > 0 ? Math.round((completedDeliveries / totalDeliveries) * 100) : 0;

  return (
    <footer className="border-t border-slate-800 bg-[#090d16]/95 px-5 py-3 backdrop-blur shadow-2xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Speed Controls inspired by Reference 2 */}
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Simulation Speed
              </span>
              <span className="font-mono text-[10px] text-cyan-300">
                T+{timeFormatted}
              </span>
              <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono font-semibold ${running ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" : "bg-slate-800 text-slate-400"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${running ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                {running ? "LIVE" : "PAUSED"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/90 rounded-lg p-1 border border-slate-800">
              {[1, 2, 4].map((speed) => (
                <button
                  key={speed}
                  onClick={() => onChangeSpeed(speed)}
                  className={`rounded-md px-3 py-1 text-xs font-mono font-bold transition-all ${
                    speedMultiplier === speed
                      ? "bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Progress Bar */}
          <div className="min-w-[180px] sm:min-w-[220px]">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              <span>Overall Progress</span>
              <span className="text-cyan-300 font-mono">{completionPercent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800 border border-slate-700/60">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Telemetry & KPI Cards */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:items-center lg:gap-3">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="flex-1 rounded-lg border border-slate-800 bg-slate-900/90 px-3 py-2 min-w-[120px]"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  {metric.label}
                </span>
                {metric.badge && (
                  <span className="rounded bg-cyan-500/10 px-1.5 py-0.2 text-[8px] font-mono font-bold text-cyan-300 border border-cyan-500/20">
                    {metric.badge}
                  </span>
                )}
              </div>
              <p className="mt-1 text-lg font-black tracking-tight text-white font-mono">
                {metric.value}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{metric.delta}</p>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
