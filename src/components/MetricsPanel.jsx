import { computeVehicleETA, formatETA } from "../utils/fleetOptimizer.js";

function Stat({ label, value, sub, color }) {
  return (
    <div className="flex flex-col items-start justify-center min-w-0 px-2 py-1">
      <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-1.5">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`text-[18px] font-semibold font-mono tracking-tight leading-none ${color || "text-neutral-900"}`}>{value}</span>
        {sub && <span className="text-[12px] text-neutral-400 font-medium font-mono">{sub}</span>}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="w-px h-10 bg-black/5 shrink-0 mx-1" />;
}

export default function MetricsPanel({ simulation, hasStarted }) {
  if (!hasStarted) return null;

  const { vehicles, deliveries, metrics } = simulation;
  const m = metrics || {};

  // Per-fleet ETA (max ETA across active vehicles)
  const maxETA = Math.max(0, ...vehicles
    .filter((v) => v.status === "MOVING" || v.status === "READY")
    .map((v) => computeVehicleETA(v)));
  const etaStr = formatETA(maxETA);

  // Total remaining distance
  const totalDist = vehicles.reduce((sum, v) => {
    return sum + (v.remainingLegs || []).reduce((s, l) => s + (l.distance || 0), 0);
  }, 0);

  // Average fleet fuel %
  const fuelPcts = vehicles
    .filter((v) => v.status !== "DISABLED")
    .map((v) => {
      const cap = v.fuel || 100;
      return Math.max(0, Math.round(((cap - (v.fuelUsed || 0)) / cap) * 100));
    });
  const avgFuel = fuelPcts.length > 0 ? Math.round(fuelPcts.reduce((a, b) => a + b, 0) / fuelPcts.length) : 100;

  const completed = deliveries.filter((d) => d.status === "COMPLETED").length;
  const total = deliveries.length;
  const criticalDone = deliveries.filter((d) => d.status === "COMPLETED" && d.priority === "CRITICAL").length;
  const criticalTotal = deliveries.filter((d) => d.priority === "CRITICAL").length;
  const unreachable = deliveries.filter((d) => d.status === "UNREACHABLE").length;
  const activeVehicles = vehicles.filter((v) => v.status !== "DISABLED").length;

  const score = m.optimizationScore ?? 100;
  const scoreColor = score >= 80 ? "text-[#34C759]" : score >= 50 ? "text-[#FF9500]" : "text-[#FF3B30]";

  const before = m.beforeSnapshot;
  const after = m.afterSnapshot;
  const showDiff = before && (m.totalReroutes > 0 || unreachable > 0);

  return (
    <div className="border-b border-black/5 bg-white/50 backdrop-blur-md px-6 py-4">
      {/* Main metrics row */}
      <div className="flex items-center gap-4 overflow-x-auto scrollbar-none">
        <Stat label="ETA" value={etaStr} color="text-[#007AFF]" />
        <Divider />
        <Stat label="Distance" value={`${(totalDist / 100).toFixed(1)}km`} color="text-neutral-800" />
        <Divider />
        <Stat label="Fuel" value={`${avgFuel}%`} color={avgFuel < 20 ? "text-[#FF3B30]" : avgFuel < 40 ? "text-[#FF9500]" : "text-[#34C759]"} />
        <Divider />
        <Stat label="Delivered" value={`${completed}`} sub={`/ ${total}`} color="text-[#34C759]" />
        <Divider />
        <Stat label="Critical" value={`${criticalDone}`} sub={`/ ${criticalTotal}`} color={criticalDone === criticalTotal ? "text-[#34C759]" : "text-[#FF9500]"} />
        <Divider />
        <Stat label="Active Fleet" value={`${activeVehicles}`} sub="/ 3" color={activeVehicles < 3 ? "text-[#FF9500]" : "text-neutral-800"} />
        <Divider />
        <Stat label="Reroutes" value={m.totalReroutes || 0} color={(m.totalReroutes || 0) > 0 ? "text-[#FF9500]" : "text-neutral-400"} />
        <Divider />
        <Stat label="Score" value={`${score}`} color={scoreColor} sub="/ 100" />
        {unreachable > 0 && (
          <>
            <Divider />
            <Stat label="Unreachable" value={unreachable} color="text-[#FF3B30]" />
          </>
        )}
      </div>

      {/* Before / After disruption diff */}
      {showDiff && before && (
        <div className="mt-4 flex items-center gap-4 text-[12px] font-mono rounded-xl bg-[#F5F5F7] px-4 py-2.5 text-neutral-600">
          <span className="text-neutral-900 uppercase font-bold text-[10px] tracking-wider shrink-0">Disruption Impact</span>
          <span className="text-[#FF9500] font-semibold">Reroutes: +{m.totalReroutes - (before.reroutes || 0)}</span>
          {after && (
            <span className={after.optimizationScore >= before.optimizationScore ? "text-[#34C759] font-semibold" : "text-[#FF3B30] font-semibold"}>
              Score: {before.optimizationScore} → {after.optimizationScore}
            </span>
          )}
          {unreachable > 0 && <span className="text-[#FF3B30] font-semibold">Blocked: {unreachable}</span>}
          <span className="text-neutral-400 ml-auto">{before.timestamp}</span>
        </div>
      )}
    </div>
  );
}
