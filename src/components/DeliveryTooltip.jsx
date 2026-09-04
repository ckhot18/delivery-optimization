import { formatETA } from "../utils/fleetOptimizer.js";
import { locationByNodeId } from "../utils/simulationEngine.js";

const PRIORITY_COLORS = {
  CRITICAL: {
    border: "border-red-200",
    bg: "bg-red-50",
    text: "text-red-700",
    badge: "bg-red-100 text-red-700 border-red-200",
    dot: "#dc2626",
  },
  HIGH: {
    border: "border-amber-200",
    bg: "bg-amber-50",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "#d97706",
  },
  NORMAL: {
    border: "border-blue-200",
    bg: "bg-blue-50",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    dot: "#2563eb",
  },
};

function statusBadge(status) {
  const map = {
    "IN TRANSIT": "bg-emerald-50 text-emerald-700 border-emerald-200",
    QUEUED: "bg-slate-100 text-slate-700 border-slate-200",
    DELAYED: "bg-amber-50 text-amber-700 border-amber-200 animate-pulse",
    COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
    UNREACHABLE: "bg-red-50 text-red-700 border-red-200",
  };
  return map[status] || "bg-slate-100 text-slate-600 border-slate-200";
}

function computeDeliveryETAInfo(delivery, vehicle) {
  if (!delivery) return { updatedEtaSec: 0, originalEtaSec: 0, delaySec: 0, customerMessage: "" };

  const isComplete = delivery.status === "COMPLETED";
  const isUnreachable = delivery.status === "UNREACHABLE";
  const originalEtaSec = delivery.originalEta || 18;

  if (isComplete) {
    return {
      updatedEtaSec: 0,
      originalEtaSec,
      delaySec: 0,
      customerMessage: "Package delivered safely. Thank you for your patience.",
    };
  }

  if (isUnreachable) {
    return {
      updatedEtaSec: 0,
      originalEtaSec,
      delaySec: 0,
      customerMessage: "Direct route blocked. Dispatcher re-optimizing path.",
    };
  }

  let travelDist = 0;
  if (vehicle?.remainingLegs && vehicle.remainingLegs.length > 0) {
    const legIdx = vehicle.remainingLegs.findIndex((l) => l.deliveryId === delivery.id);
    if (legIdx >= 0) {
      travelDist = vehicle.remainingLegs.slice(0, legIdx + 1).reduce((s, l) => s + (l.distance || 0), 0);
      const curLegDist = vehicle.remainingLegs[0]?.distance || 0;
      travelDist = Math.max(0, travelDist - curLegDist * (vehicle.legProgress || 0));
    } else {
      travelDist = vehicle.remainingLegs.reduce((s, l) => s + (l.distance || 0), 0);
    }
  }

  const speed = vehicle?.speed || 60;
  const travelTimeSec = travelDist / speed;
  const breakdownDelay = vehicle?.status === "DELAYED" ? Math.ceil(vehicle.delayRemaining || 0) : 0;
  const updatedEtaSec = Math.max(1, Math.round(travelTimeSec + breakdownDelay));
  const delaySec = breakdownDelay;

  let customerMessage;
  if (vehicle?.status === "DELAYED") {
    customerMessage = `Vehicle delayed due to vehicle issue. Expected arrival in ${formatETA(updatedEtaSec)}.`;
  } else if (vehicle?.status === "MOVING") {
    customerMessage = `On the way with ${vehicle.driver || vehicle.id}. Expected arrival in ${formatETA(updatedEtaSec)}.`;
  } else if (vehicle?.status === "WAITING") {
    customerMessage = `Vehicle holding position for route clearance. Arrival in ${formatETA(updatedEtaSec)}.`;
  } else {
    customerMessage = `Order packed and queued for dispatch. Expected in ${formatETA(updatedEtaSec)}.`;
  }

  return {
    updatedEtaSec,
    originalEtaSec,
    delaySec,
    customerMessage,
  };
}

export default function DeliveryTooltip({ delivery, location, vehicle, position }) {
  if (!delivery && !location) return null;
  if (!position) return null;

  const locLabel = location?.label || (delivery ? locationByNodeId[delivery.destination]?.label : "Location");
  const prio = delivery?.priority || "NORMAL";
  const pStyle = PRIORITY_COLORS[prio] || PRIORITY_COLORS.NORMAL;

  const { updatedEtaSec, originalEtaSec, delaySec, customerMessage } = computeDeliveryETAInfo(delivery, vehicle);

  return (
    <div
      className="pointer-events-none absolute z-50 w-72 rounded-xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur-md transition-opacity duration-150"
      style={{ left: position.x + 16, top: Math.max(10, position.y - 40) }}
    >
      {/* Top Bar with Priority Glow */}
      <div
        className={`flex items-center justify-between rounded-t-xl px-3.5 py-2.5 border-b ${pStyle.border} ${pStyle.bg}`}
      >
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full animate-pulse" style={{ backgroundColor: pStyle.dot }} />
          <span className="font-black text-slate-900 text-xs tracking-wide font-mono">
            {delivery ? delivery.id : location?.id}
          </span>
          <span className="text-slate-300 text-xs">|</span>
          <span className={`rounded border px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider ${pStyle.badge}`}>
            {prio}
          </span>
        </div>
        {delivery && (
          <span className={`rounded border px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider ${statusBadge(delivery.status)}`}>
            {delivery.status}
          </span>
        )}
      </div>

      {/* Package & Recipient Header */}
      <div className="px-3.5 pt-2.5 pb-1.5">
        <h4 className="text-xs font-black text-slate-900 leading-snug">
          {delivery ? delivery.title : locLabel}
        </h4>
        <p className="text-[10px] text-slate-500 font-medium mt-0.5">
          {delivery?.recipient || locLabel} {delivery?.weight ? `· ${delivery.weight} kg` : ""}
        </p>
      </div>

      <div className="border-t border-slate-100 mx-3.5" />

      {/* Logistics Details */}
      <div className="px-3.5 py-2 space-y-1.5">
        <div className="flex justify-between items-center text-[9.5px]">
          <span className="text-slate-400 uppercase font-bold">Assigned Fleet</span>
          <span className="font-mono font-bold text-slate-800">
            {vehicle ? `${vehicle.id} (${vehicle.type})` : "Unassigned"}
          </span>
        </div>
        {vehicle && (
          <div className="flex justify-between items-center text-[9.5px]">
            <span className="text-slate-400 uppercase font-bold">Courier</span>
            <span className="font-mono text-slate-700">{vehicle.driver}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-[9.5px]">
          <span className="text-slate-400 uppercase font-bold">Destination</span>
          <span className="font-mono text-blue-600 font-semibold">{locLabel}</span>
        </div>
      </div>

      <div className="border-t border-slate-100 mx-3.5" />

      {/* ETA & Breakdown Timing Matrix */}
      <div className="px-3.5 py-2">
        <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-slate-50 border border-slate-200 p-1.5 text-center">
          <div>
            <span className="block text-[8px] font-bold text-slate-400 uppercase">Orig ETA</span>
            <span className="text-[10px] font-mono font-bold text-slate-500">
              {formatETA(originalEtaSec)}
            </span>
          </div>
          <div>
            <span className="block text-[8px] font-bold text-slate-400 uppercase">Updated ETA</span>
            <span className={`text-[10px] font-mono font-black ${delaySec > 0 ? "text-amber-600" : "text-emerald-600"}`}>
              {formatETA(updatedEtaSec)}
            </span>
          </div>
          <div>
            <span className="block text-[8px] font-bold text-slate-400 uppercase">Delay</span>
            <span className={`text-[10px] font-mono font-bold ${delaySec > 0 ? "text-amber-600 font-black animate-pulse" : "text-slate-500"}`}>
              {delaySec > 0 ? `+${delaySec}s` : "0s"}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 mx-3.5" />

      {/* Customer Status Message */}
      <div className="px-3.5 py-2.5 bg-slate-50/80 rounded-b-xl border-t border-slate-100">
        <span className="text-[8.5px] text-slate-400 uppercase font-extrabold tracking-wider block mb-1">
          Customer Notification Status
        </span>
        <div className="flex items-start gap-1.5">
          <svg className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-[10px] text-slate-600 font-sans leading-snug italic">
            "{customerMessage}"
          </p>
        </div>
      </div>
    </div>
  );
}
