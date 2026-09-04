import { computeVehicleETA, formatETA } from "../utils/fleetOptimizer.js";
import { locationByNodeId, pointById, roadById } from "../utils/simulationEngine.js";


const VEHICLE_COLORS = {
  "V-01": "#22c55e",
  "V-02": "#3b82f6",
  "V-03": "#ef4444",
};

function statusBadge(status) {
  const map = {
    MOVING: "bg-emerald-50 text-emerald-700 border-emerald-200",
    READY: "bg-blue-50 text-blue-700 border-blue-200",
    WAITING: "bg-amber-50 text-amber-700 border-amber-200",
    DELAYED: "bg-amber-50 text-amber-700 border-amber-200 animate-pulse",
    COMPLETE: "bg-slate-100 text-slate-700 border-slate-200",
    DISABLED: "bg-red-50 text-red-700 border-red-200",
    "NO ROUTE": "bg-amber-50 text-amber-700 border-amber-200",
    IDLE: "bg-slate-50 text-slate-500 border-slate-200",
  };
  return map[status] || map.IDLE;
}

function Bar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default function VehicleTooltip({ vehicle, position }) {
  if (!vehicle || !position) return null;

  const color = vehicle.color || VEHICLE_COLORS[vehicle.id] || "#64748b";
  const etaSec = computeVehicleETA(vehicle);
  const etaStr = formatETA(etaSec);

  const fuelCap = vehicle.fuel || 100;
  const fuelRemaining = Math.max(0, fuelCap - (vehicle.fuelUsed || 0));
  const fuelPct = Math.round((fuelRemaining / fuelCap) * 100);

  const loadCap = vehicle.capacity || 100;
  const loadUsed = vehicle.assignedWeight || 0;

  // Current location label
  const currentLocLabel = locationByNodeId[vehicle.currentNodeId]?.label
    || pointById[vehicle.currentNodeId]?.label
    || vehicle.currentNodeId
    || "In transit";

  // Destination label (first pending delivery)
  let destLabel = "—";
  let destDeliveryId = "—";
  if (vehicle.remainingLegs && vehicle.remainingLegs.length > 0) {
    const destNode = vehicle.remainingLegs[vehicle.remainingLegs.length - 1]?.toNode;
    destLabel = locationByNodeId[destNode]?.label || pointById[destNode]?.label || destNode || "—";
    // Find first delivery in remaining legs
    const firstDeliveryLeg = vehicle.remainingLegs.find((l) => l.deliveryId);
    destDeliveryId = firstDeliveryLeg?.deliveryId || "—";
  }

  // Next 3 road segments
  const routeSnippet = (vehicle.remainingLegs || [])
    .slice(0, 3)
    .map((leg) => roadById[leg.roadId]?.label || leg.roadId || "—")
    .join(" → ") || "—";

  const reason = vehicle.currentDecision || vehicle.noRouteReason || "Optimal global assignment";

  return (
    <div
      className="pointer-events-none absolute z-50 w-64 rounded-xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur-sm"
      style={{ left: position.x + 14, top: position.y - 10 }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between rounded-t-xl px-3 py-2.5 bg-slate-50 border-b border-slate-200"
      >
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: color }} />
          <span className="font-black text-slate-900 text-sm font-mono">{vehicle.id}</span>
          <span className="text-slate-300 text-xs">|</span>
          <span className="text-xs font-bold text-slate-600">{vehicle.type}</span>
        </div>
        <span className={`rounded border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${statusBadge(vehicle.status)}`}>
          {vehicle.status}
        </span>
      </div>

      {/* Driver */}
      <div className="px-3 pt-2 pb-1">
        <p className="text-[10px] text-slate-500 font-mono">{vehicle.driver}</p>
      </div>

      <div className="border-t border-slate-100 mx-3" />

      {/* Info Grid */}
      <div className="px-3 py-2 space-y-1.5">
        <Row label="Location" value={currentLocLabel} />
        <Row label="Destination" value={destLabel} />
        <Row label="Delivery" value={destDeliveryId} highlight />
        <Row label="ETA" value={etaStr} highlight />
        <Row label="Route" value={routeSnippet} small />
        <Row label="Speed" value={`${vehicle.speed || "?"} km/h`} />
        <Row label="Orders" value={vehicle.assignedDeliveryIds.join(", ") || "None"} small />
      </div>

      <div className="border-t border-slate-100 mx-3" />

      {/* Bars */}
      <div className="px-3 py-2 space-y-2">
        <div>
          <div className="flex justify-between mb-0.5">
            <span className="text-[9px] text-slate-400 uppercase font-bold">Load</span>
            <span className="text-[9px] text-slate-700 font-mono">{loadUsed} / {loadCap} kg</span>
          </div>
          <Bar value={loadUsed} max={loadCap} color={loadUsed > loadCap * 0.9 ? "#f59e0b" : color} />
        </div>
        <div>
          <div className="flex justify-between mb-0.5">
            <span className="text-[9px] text-slate-400 uppercase font-bold">Fuel</span>
            <span className="text-[9px] text-slate-700 font-mono">{fuelPct}%</span>
          </div>
          <Bar value={fuelRemaining} max={fuelCap} color={fuelPct < 20 ? "#ef4444" : fuelPct < 40 ? "#f59e0b" : "#16a34a"} />
        </div>
      </div>

      <div className="border-t border-slate-100 mx-3" />

      {/* Decision */}
      <div className="px-3 py-2">
        <p className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">Decision</p>
        <p className="text-[10px] text-blue-600 font-mono leading-relaxed truncate">{reason}</p>
      </div>
    </div>
  );
}

function Row({ label, value, highlight, small }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-[9px] text-slate-400 uppercase font-bold shrink-0">{label}</span>
      <span className={`text-right font-mono truncate max-w-[150px] ${
        small ? "text-[9px] text-slate-500" :
        highlight ? "text-[10px] text-blue-600 font-bold" :
        "text-[10px] text-slate-800"
      }`}>
        {value}
      </span>
    </div>
  );
}
