import { computeVehicleETA, formatETA } from "../utils/fleetOptimizer.js";

function Stat({ label, value, sub, color }) {
  return (
    <div className="flex flex-col items-center justify-center min-w-0">
      <span className={`text-base font-black font-mono leading-none ${color || "text-white"}`}>{value}</span>
      {sub && <span className="text-[8px] text-slate-500 font-mono mt-0.5">{sub}</span>}
      <span className="text-[8px] text-slate-500 uppercase tracking-wider mt-0.5">{label}</span>
    </div>
  );
}

function Divider() {
  return <div className="w-px h-6 bg-slate-800 shrink-0" />;
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
  const scoreColor = score >= 80 ? "text-emerald-300" : score >= 50 ? "text-amber-300" : "text-red-400";

  const before = m.beforeSnapshot;
  const after = m.afterSnapshot;
  const showDiff = before && (m.totalReroutes > 0 || unreachable > 0);

  return (
    <div className="border-b border-slate-800/60 bg-slate-950/80 px-4 py-2">
      {/* Main metrics row */}
      <div className="flex items-center gap-3 overflow-x-auto scrollbar-none">
        <Stat label="ETA" value={etaStr} color="text-cyan-300" />
        <Divider />
        <Stat label="Distance" value={`${(totalDist / 100).toFixed(1)}km`} color="text-slate-200" />
        <Divider />
        <Stat label="Fuel" value={`${avgFuel}%`} color={avgFuel < 20 ? "text-red-400" : avgFuel < 40 ? "text-amber-300" : "text-emerald-300"} />
        <Divider />
        <Stat label="Delivered" value={`${completed}/${total}`} color="text-emerald-300" />
        <Divider />
        <Stat label="Critical ?" value={`${criticalDone}/${criticalTotal}`} color={criticalDone === criticalTotal ? "text-emerald-300" : "text-amber-300"} />
        <Divider />
        <Stat label="Fleet" value={`${activeVehicles}/3`} color={activeVehicles < 3 ? "text-amber-300" : "text-slate-200"} />
        <Divider />
        <Stat label="Reroutes" value={m.totalReroutes || 0} color={(m.totalReroutes || 0) > 0 ? "text-amber-300" : "text-slate-400"} />
        <Divider />
        <Stat label="Score" value={`${score}`} color={scoreColor} sub="/100" />
        {unreachable > 0 && (
          <>
            <Divider />
            <Stat label="Unreachable" value={unreachable} color="text-red-400" />
          </>
        )}
      </div>

      {/* Before / After disruption diff */}
      {showDiff && before && (
        <div className="mt-2 flex items-center gap-3 text-[9px] font-mono rounded-md border border-slate-800 bg-slate-900/50 px-2.5 py-1.5">
          <span className="text-slate-500 uppercase font-bold shrink-0">Disruption Impact</span>
          <span className="text-amber-300">Reroutes: +{m.totalReroutes - (before.reroutes || 0)}</span>
          {after && (
            <span className={after.optimizationScore >= before.optimizationScore ? "text-emerald-300" : "text-red-400"}>
              Score: {before.optimizationScore} ? {after.optimizationScore}
            </span>
          )}
          {unreachable > 0 && <span className="text-red-400">Blocked Deliveries: {unreachable}</span>}
          <span className="text-slate-600 ml-auto">{before.timestamp}</span>
        </div>
      )}
    </div>
  );
}
