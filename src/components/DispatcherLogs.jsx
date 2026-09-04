import { getSelectionDetails } from "../utils/simulationEngine.js";

const toneStyles = {
  cyan:    "text-cyan-300 border-cyan-500/30 bg-cyan-950/20",
  emerald: "text-emerald-300 border-emerald-500/30 bg-emerald-950/20",
  amber:   "text-amber-300 border-amber-500/30 bg-amber-950/20",
  red:     "text-red-300 border-red-500/30 bg-red-950/20",
  slate:   "text-slate-300 border-slate-800 bg-slate-900/40",
};

export default function DispatcherLogs({
  logs,
  selectedItem,
  simulation,
  onBlockRoad,
  onVehicleBreakdown,
  onEmergencyDelivery,
  onMoveDelivery,
  onClearSelection,
}) {
  const selectionInfo = getSelectionDetails(selectedItem, simulation);
  const selectedRoadId = selectedItem?.type === "road" || selectedItem?.type === "bridge" ? selectedItem.id : null;
  const selectedVehicleId = selectedItem?.type === "vehicle" ? selectedItem.id : null;
  const isSelectedRoadBlocked = selectedRoadId && simulation.blockedRoadIds.includes(selectedRoadId);

  const metrics = simulation.metrics || {};
  const unreachable = simulation.deliveries.filter((d) => d.status === "UNREACHABLE").length;

  return (
    <aside className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-800/80 bg-[#080c16] shadow-2xl">

      {/* Incident Control Header */}
      <div className="border-b border-slate-800/80 bg-slate-950/90 p-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-red-400 animate-pulse" />
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Incident Control</h2>
          </div>
          <span className="text-[9px] font-mono text-slate-500">Click map road to block/unblock</span>
        </div>

        {/* 4 Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {/* BLOCK / UNBLOCK ROAD */}
          <button
            onClick={() => onBlockRoad(selectedRoadId)}
            className={`flex flex-col items-center justify-center rounded-lg border p-2 text-center transition-all active:scale-95 ${
              isSelectedRoadBlocked
                ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-200 hover:bg-emerald-900/40"
                : "border-red-500/40 bg-red-950/30 text-red-200 hover:bg-red-900/40 hover:border-red-400"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
              <span className="text-[10px] font-black uppercase tracking-wider">
                {isSelectedRoadBlocked ? "Unblock" : "Block Road"}
              </span>
            </div>
            <span className="text-[9px] text-slate-400 mt-0.5 font-mono truncate max-w-[120px]">
              {selectedRoadId || "Select a road on map"}
            </span>
          </button>

          {/* VEHICLE BREAKDOWN */}
          <div className="flex flex-col justify-center rounded-lg border border-amber-500/40 bg-amber-950/30 p-1.5 text-center transition-all">
            <div className="flex items-center gap-1.5 justify-center mb-1 text-amber-200">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span className="text-[10px] font-black uppercase tracking-wider">Breakdown</span>
            </div>
            <div className="flex gap-1 w-full">
              <button
                onClick={() => onVehicleBreakdown(selectedVehicleId, "MINOR")}
                className="flex-1 rounded border border-amber-500/30 bg-amber-900/40 py-1 text-[8px] font-bold text-amber-200 hover:bg-amber-800/60 active:scale-95"
              >
                MINOR
              </button>
              <button
                onClick={() => onVehicleBreakdown(selectedVehicleId, "MAJOR")}
                className="flex-1 rounded border border-red-500/30 bg-red-900/40 py-1 text-[8px] font-bold text-red-200 hover:bg-red-800/60 active:scale-95"
              >
                MAJOR
              </button>
            </div>
          </div>

          {/* EMERGENCY DELIVERY */}
          <button
            onClick={() => onEmergencyDelivery(selectedItem?.type === "location" ? selectedItem.id : null)}
            className="flex flex-col items-center justify-center rounded-lg border border-purple-500/40 bg-purple-950/30 p-2 text-center text-purple-200 transition-all hover:bg-purple-900/40 hover:border-purple-400 active:scale-95"
          >
            <div className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span className="text-[10px] font-black uppercase tracking-wider">Emergency</span>
            </div>
            <span className="text-[9px] text-slate-400 mt-0.5 font-mono">Spawn Critical Drop</span>
          </button>

          {/* MOVE DELIVERY */}
          <button
            onClick={() => onMoveDelivery()}
            className="flex flex-col items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-950/30 p-2 text-center text-cyan-200 transition-all hover:bg-cyan-900/40 hover:border-cyan-400 active:scale-95"
          >
            <div className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
              </svg>
              <span className="text-[10px] font-black uppercase tracking-wider">Move Drop</span>
            </div>
            <span className="text-[9px] text-slate-400 mt-0.5 font-mono">Shift Destination</span>
          </button>
        </div>
      </div>

      {/* Target Inspector */}
      {selectionInfo && (
        <div className="border-b border-slate-800 bg-slate-900/80 p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-bold text-white truncate pr-2">{selectionInfo.title}</p>
            <button onClick={onClearSelection} className="text-[10px] text-slate-400 hover:text-white shrink-0">✕</button>
          </div>
          <p className="text-[10px] text-cyan-300 font-mono mb-2">{selectionInfo.status}</p>
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            {selectionInfo.specs.slice(0, 6).map((s, i) => (
              <div key={i} className="rounded border border-slate-800 bg-slate-950/60 p-1">
                <span className="text-slate-400 uppercase text-[8px] block">{s.label}</span>
                <span className="font-semibold text-slate-200 truncate block">{s.value}</span>
              </div>
            ))}
          </div>
          {selectionInfo.actionTip && (
            <p className="mt-1.5 text-[9px] text-slate-500 font-mono italic">{selectionInfo.actionTip}</p>
          )}
        </div>
      )}

      {/* Dispatcher Logs Feed */}
      <div className="flex-1 flex flex-col overflow-hidden p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
            </svg>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">Dispatcher Logs</h3>
          </div>
          <span className="text-[9px] font-mono text-slate-500">{logs.length} events</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 pr-1 font-mono text-[10px]">
          {logs.map((log) => {
            const toneClass = toneStyles[log.tone] || toneStyles.slate;
            return (
              <div key={log.id} className={`rounded border px-2 py-1 transition-all ${toneClass}`}>
                <span className="leading-snug block">{log.text}</span>
              </div>
            );
          })}
          {logs.length === 0 && (
            <div className="text-slate-600 text-center py-4 text-[9px]">Awaiting dispatch events…</div>
          )}
        </div>
      </div>

      {/* Footer metrics */}
      <div className="border-t border-slate-800/80 bg-slate-950/90 px-3.5 py-2 grid grid-cols-3 gap-2 text-[9px] font-mono">
        <div className="text-center">
          <span className="text-slate-500 block">Blocked</span>
          <span className={simulation.blockedRoadIds.length > 0 ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
            {simulation.blockedRoadIds.length}
          </span>
        </div>
        <div className="text-center">
          <span className="text-slate-500 block">Fleet</span>
          <span className="text-cyan-300 font-bold">{simulation.vehicles.filter((v) => v.status !== "DISABLED").length}/3</span>
        </div>
        <div className="text-center">
          <span className="text-slate-500 block">Reroutes</span>
          <span className={metrics.totalReroutes > 0 ? "text-amber-300 font-bold" : "text-slate-400"}>
            {metrics.totalReroutes || 0}
          </span>
        </div>
        {unreachable > 0 && (
          <div className="col-span-3 text-center">
            <span className="text-red-400 font-bold">{unreachable} delivery unreachable</span>
          </div>
        )}
      </div>
    </aside>
  );
}
