import { getSelectionDetails } from "../utils/simulationEngine.js";

const toneStyles = {
  cyan:    "text-[#007AFF] bg-[#007AFF]/10",
  emerald: "text-[#34C759] bg-[#34C759]/10",
  amber:   "text-[#FF9500] bg-[#FF9500]/10",
  red:     "text-[#FF3B30] bg-[#FF3B30]/10",
  slate:   "text-neutral-600 bg-neutral-100",
};

export default function DispatcherLogs({
  logs,
  selectedItem,
  simulation,
  onBlockRoad,
  onVehicleBreakdown,
  onClearSelection,
}) {
  const selectionInfo = getSelectionDetails(selectedItem, simulation);
  const selectedRoadId = selectedItem?.type === "road" || selectedItem?.type === "bridge" ? selectedItem.id : null;
  const selectedVehicleId = selectedItem?.type === "vehicle" ? selectedItem.id : null;
  const isSelectedRoadBlocked = selectedRoadId && simulation.blockedRoadIds.includes(selectedRoadId);

  const metrics = simulation.metrics || {};
  const unreachable = simulation.deliveries.filter((d) => d.status === "UNREACHABLE").length;

  return (
    <aside className="flex h-full flex-col overflow-hidden rounded-[24px] bg-white shadow-sm ring-1 ring-black/5 border border-black/5">
      {/* Incident Control Header */}
      <div className="border-b border-black/5 bg-[#F5F5F7] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#FF3B30] animate-pulse" />
            <h2 className="text-[13px] font-bold uppercase tracking-wider text-neutral-900">Incident Controls</h2>
          </div>
          <span className="text-[11px] font-semibold text-neutral-500">Click road to toggle</span>
        </div>

        {/* 2 Core Action Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* BLOCK / UNBLOCK ROAD */}
          <button
            onClick={() => onBlockRoad(selectedRoadId)}
            className={`flex flex-col items-center justify-center rounded-[16px] p-4 text-center transition-all active:scale-95 shadow-sm ring-1 ring-inset ${
              isSelectedRoadBlocked
                ? "ring-[#34C759]/30 bg-[#34C759]/10 text-[#34C759]"
                : "ring-black/5 bg-white text-neutral-800 hover:bg-neutral-50"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <svg className={`h-4 w-4 ${isSelectedRoadBlocked ? "text-[#34C759]" : "text-neutral-500"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
              <span className="text-[12px] font-bold uppercase tracking-wider">
                {isSelectedRoadBlocked ? "Unblock" : "Block"}
              </span>
            </div>
            <span className="text-[11px] text-neutral-500 font-mono font-medium truncate max-w-full">
              {selectedRoadId || "Select on map"}
            </span>
          </button>

          {/* VEHICLE BREAKDOWN */}
          <div className="flex flex-col justify-center rounded-[16px] bg-white p-3.5 text-center shadow-sm ring-1 ring-inset ring-black/5">
            <div className="flex items-center gap-1.5 justify-center mb-2.5 text-neutral-800">
              <svg className="h-4 w-4 text-[#FF9500]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span className="text-[12px] font-bold uppercase tracking-wider">Breakdown</span>
            </div>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => onVehicleBreakdown(selectedVehicleId, "MINOR")}
                className="flex-1 rounded-[10px] bg-[#FF9500]/10 py-1.5 text-[11px] font-bold text-[#FF9500] hover:bg-[#FF9500]/20 active:scale-95 transition-colors"
              >
                Minor
              </button>
              <button
                onClick={() => onVehicleBreakdown(selectedVehicleId, "MAJOR")}
                className="flex-1 rounded-[10px] bg-[#FF3B30]/10 py-1.5 text-[11px] font-bold text-[#FF3B30] hover:bg-[#FF3B30]/20 active:scale-95 transition-colors"
              >
                Major
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Target Inspector */}
      {selectionInfo && (
        <div className="border-b border-black/5 bg-[#FAFAFA] p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[14px] font-bold text-neutral-900 truncate pr-2">{selectionInfo.title}</p>
            <button onClick={onClearSelection} className="text-[12px] font-bold text-neutral-400 hover:text-neutral-700 shrink-0 bg-neutral-200/50 rounded-full w-6 h-6 flex items-center justify-center">✕</button>
          </div>
          <p className="text-[12px] text-[#007AFF] font-bold mb-3">{selectionInfo.status}</p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {selectionInfo.specs.slice(0, 6).map((s, i) => (
              <div key={i} className="rounded-[12px] bg-white p-2.5 shadow-sm ring-1 ring-inset ring-black/5">
                <span className="text-neutral-400 uppercase text-[10px] block font-bold mb-0.5">{s.label}</span>
                <span className="font-bold text-neutral-800 truncate block">{s.value}</span>
              </div>
            ))}
          </div>
          {selectionInfo.actionTip && (
            <p className="mt-3 text-[11px] text-neutral-500 font-medium bg-neutral-100 p-2.5 rounded-[10px]">{selectionInfo.actionTip}</p>
          )}
        </div>
      )}

      {/* Dispatcher Logs Feed */}
      <div className="flex-1 flex flex-col overflow-hidden p-5 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-[#007AFF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
            </svg>
            <h3 className="text-[13px] font-bold uppercase tracking-wider text-neutral-900">Dispatcher Log</h3>
          </div>
          <span className="text-[11px] font-mono font-bold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">{logs.length} events</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-[12px]">
          {logs.map((log) => {
            const toneClass = toneStyles[log.tone] || toneStyles.slate;
            return (
              <div key={log.id} className={`rounded-[10px] px-3 py-2 transition-all ${toneClass}`}>
                <span className="leading-snug block font-medium">{log.text}</span>
              </div>
            );
          })}
          {logs.length === 0 && (
            <div className="text-neutral-400 text-center py-8 text-[13px] font-sans">Awaiting dispatch events…</div>
          )}
        </div>
      </div>

      {/* Footer metrics */}
      <div className="border-t border-black/5 bg-[#FAFAFA] px-5 py-4 grid grid-cols-3 gap-3 text-[12px] font-mono">
        <div className="text-center">
          <span className="text-neutral-400 block text-[10px] uppercase font-bold mb-0.5">Blocked</span>
          <span className={simulation.blockedRoadIds.length > 0 ? "text-[#FF3B30] font-extrabold" : "text-neutral-800 font-extrabold"}>
            {simulation.blockedRoadIds.length}
          </span>
        </div>
        <div className="text-center">
          <span className="text-neutral-400 block text-[10px] uppercase font-bold mb-0.5">Active Fleet</span>
          <span className="text-neutral-800 font-extrabold">{simulation.vehicles.filter((v) => v.status !== "DISABLED").length}/3</span>
        </div>
        <div className="text-center">
          <span className="text-neutral-400 block text-[10px] uppercase font-bold mb-0.5">Reroutes</span>
          <span className={metrics.totalReroutes > 0 ? "text-[#FF9500] font-extrabold" : "text-neutral-500 font-bold"}>
            {metrics.totalReroutes || 0}
          </span>
        </div>
        {unreachable > 0 && (
          <div className="col-span-3 text-center bg-[#FF3B30]/10 rounded-[8px] py-1.5 mt-1">
            <span className="text-[#FF3B30] font-bold text-[11px]">{unreachable} delivery unreachable</span>
          </div>
        )}
      </div>
    </aside>
  );
}
