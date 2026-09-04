import { useMemo, useRef, useState } from "react";
import { MAP_DATA } from "../data/simulationData.js";
import { getVehicleRoutePoints, pointById, routeToPath } from "../utils/simulationEngine.js";
import VehicleTooltip from "./VehicleTooltip.jsx";
import DeliveryTooltip from "./DeliveryTooltip.jsx";

const roadStyles = {
  bridge:   { base: "#2a374a", border: "#080e1a", width: 20 },
  arterial: { base: "#2a374a", border: "#080e1a", width: 17 },
  cluster:  { base: "#1e293b", border: "#080e1a", width: 13 },
  highway:  { base: "#2d3b4f", border: "#080e1a", width: 18 },
  local:    { base: "#162032", border: "#080e1a", width: 10 },
};

function VehicleIcon({ type, color }) {
  if (type === "TRUCK") {
    return (
      <g>
        <rect x="-16" y="-9" width="22" height="18" rx="2" fill={color} stroke="#ffffff" strokeWidth="1.5" />
        <rect x="6" y="-7" width="10" height="14" rx="2" fill="#0f172a" stroke={color} strokeWidth="1.5" />
        <rect x="9" y="-5" width="5" height="10" rx="1" fill="#bae6fd" opacity="0.9" />
        <rect x="-14" y="-11" width="6" height="3" rx="1" fill="#0f172a" />
        <rect x="-14" y="8" width="6" height="3" rx="1" fill="#0f172a" />
        <rect x="7" y="-9" width="5" height="3" rx="1" fill="#0f172a" />
        <rect x="7" y="6" width="5" height="3" rx="1" fill="#0f172a" />
      </g>
    );
  }
  if (type === "VAN") {
    return (
      <g>
        <rect x="-13" y="-8" width="26" height="16" rx="4" fill={color} stroke="#ffffff" strokeWidth="1.5" />
        <path d="M 5 -6 L 10 -3 L 10 3 L 5 6 Z" fill="#0f172a" opacity="0.85" />
        <rect x="-6" y="-6" width="7" height="12" rx="1" fill="#0f172a" opacity="0.5" />
        <rect x="-10" y="-10" width="5" height="3" rx="1" fill="#020617" />
        <rect x="-10" y="7" width="5" height="3" rx="1" fill="#020617" />
        <rect x="4" y="-10" width="5" height="3" rx="1" fill="#020617" />
        <rect x="4" y="7" width="5" height="3" rx="1" fill="#020617" />
      </g>
    );
  }
  return (
    <g>
      <circle cx="-6" cy="0" r="4.5" fill="none" stroke={color} strokeWidth="2" />
      <circle cx="6" cy="0" r="4.5" fill="none" stroke={color} strokeWidth="2" />
      <path d="M -6 0 L -1 -4 L 4 0 M -1 -4 L 1 0 M 4 -4 L 5 -7" fill="none" stroke="#f8fafc" strokeWidth="1.8" strokeLinecap="round" />
    </g>
  );
}

function LocationMarker({ location, delivery, isSelected, onSelect, onMouseEnter, onMouseLeave }) {
  const point = pointById[location.nodeId];
  if (!point) return null;
  const isStore = location.type === "store";
  const isComplete = delivery?.status === "COMPLETED";
  const isUnreachable = delivery?.status === "UNREACHABLE";
  const isCritical = delivery?.priority === "CRITICAL";
  const isDelayed = delivery?.status === "DELAYED";
  const cluster = MAP_DATA.clusters.find((c) => c.id === location.clusterId);
  const themeColor = cluster ? cluster.color : "#38bdf8";

  return (
    <g
      className="cursor-pointer transition-transform hover:scale-110 outline-none"
      tabIndex="0"
      role="button"
      aria-label={`Select ${location.label}`}
      onClick={(e) => { e.stopPropagation(); onSelect({ type: "location", id: location.id, label: location.label }); }}
      onKeyDown={(e) => { if (e.key === "Enter") onSelect({ type: "location", id: location.id, label: location.label }); }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      opacity={isComplete ? 0.45 : isUnreachable ? 0.6 : 1}
    >
      {isSelected && <circle cx={point.x} cy={point.y} r="22" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="4 4" className="animate-spin" />}
      <circle
        cx={point.x} cy={point.y}
        r={isStore ? 15 : 13}
        fill={isUnreachable ? "#1c1917" : isDelayed ? "#7c2d12" : isStore ? "#78350f" : isCritical ? "#7f1d1d" : "#0f172a"}
        stroke={isSelected ? "#ffffff" : isUnreachable ? "#78716c" : isDelayed ? "#f97316" : isCritical ? "#ef4444" : themeColor}
        strokeWidth={isSelected ? 3 : isDelayed ? 2.5 : 2}
      />
      {isStore ? (
        <g transform={`translate(${point.x - 6}, ${point.y - 6})`}>
          <path d="M 1 4 L 3 0 L 9 0 L 11 4 Z" fill={themeColor} />
          <path d="M 2 4 V 11 H 10 V 4" fill="none" stroke="#ffffff" strokeWidth="1.2" />
        </g>
      ) : (
        <g transform={`translate(${point.x - 5}, ${point.y - 5})`}>
          <path d="M 0 5 L 5 0 L 10 5 V 10 H 0 Z" fill={isComplete ? "#94a3b8" : isUnreachable ? "#57534e" : "#ffffff"} />
        </g>
      )}
      {isComplete && (
        <g transform={`translate(${point.x + 4}, ${point.y - 12})`}>
          <circle cx="5" cy="5" r="6" fill="#15803d" stroke="#ffffff" strokeWidth="1.2" />
          <path d="M 2 5 L 4 7 L 8 3" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
      {isUnreachable && (
        <g transform={`translate(${point.x - 11}, ${point.y - 19})`}>
          <rect x="0" y="0" width="22" height="9" rx="2.5" fill="#78350f" />
          <text x="11" y="7" textAnchor="middle" fill="#fed7aa" fontSize="7" fontWeight="900">BLOCKED</text>
        </g>
      )}
      {isDelayed && !isComplete && !isUnreachable && (
        <g transform={`translate(${point.x - 14}, ${point.y - 19})`}>
          <rect x="0" y="0" width="28" height="9" rx="2.5" fill="#7c2d12" stroke="#f97316" strokeWidth="0.8" />
          <text x="14" y="7" textAnchor="middle" fill="#ffedd5" fontSize="6.5" fontWeight="900">DELAYED</text>
        </g>
      )}
      {isCritical && !isComplete && !isUnreachable && !isDelayed && (
        <g transform={`translate(${point.x - 11}, ${point.y - 19})`}>
          <rect x="0" y="0" width="22" height="9" rx="2.5" fill="#dc2626" />
          <text x="11" y="7" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900">SOS</text>
        </g>
      )}
      <text x={point.x} y={point.y + 22} textAnchor="middle" fill="#cbd5e1" fontSize="9" fontWeight="700" className="pointer-events-none select-none">
        {location.label}
      </text>
    </g>
  );
}

export default function LogisticsMap({ vehicles, deliveries, blockedRoadIds = [], selectedItem, onSelect, onRoadToggle }) {
  const containerRef = useRef(null);
  const [hoveredVehicle, setHoveredVehicle] = useState(null);
  const [hoveredLocation, setHoveredLocation] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const deliveriesByNodeId = useMemo(() => Object.fromEntries(deliveries.map((d) => [d.destination, d])), [deliveries]);
  const blockedSet = useMemo(() => new Set(blockedRoadIds), [blockedRoadIds]);

  function handleRoadClick(e, road) {
    e.stopPropagation();
    if (onRoadToggle) {
      onRoadToggle(road.id);
    } else {
      onSelect({ type: "road", id: road.id, label: road.label || road.id });
    }
  }

  function handleBridgeClick(e, bridge) {
    e.stopPropagation();
    if (onRoadToggle) {
      onRoadToggle(bridge.id);
    } else {
      onSelect({ type: "bridge", id: bridge.id, label: bridge.label });
    }
  }

  function handleMouseMove(e) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  function handleLocationMouseEnter(e, location, delivery) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setHoveredLocation({ location, delivery });
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative flex h-full min-h-[560px] flex-col overflow-hidden rounded-xl border border-slate-800/80 bg-[#070b14] shadow-2xl"
    >
      {/* SVG Canvas */}
      <div className="relative flex-1 w-full overflow-hidden bg-[#060a12]" onClick={() => onSelect(null)}>
        <svg viewBox={MAP_DATA.viewBox} className="h-full w-full select-none" role="img" aria-label="Interactive city logistics map">
          <defs>
            <pattern id="urban-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#141e2e" strokeWidth="0.8" opacity="0.4" />
            </pattern>
            <pattern id="hazard-pattern" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="12" fill="#ef4444" />
              <rect x="6" width="6" height="12" fill="#020617" />
            </pattern>
            <linearGradient id="river-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0369a1" stopOpacity="0.85" />
              <stop offset="30%" stopColor="#0284c7" stopOpacity="0.95" />
              <stop offset="70%" stopColor="#0284c7" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.85" />
            </linearGradient>
            <marker id="arrow-green" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#22c55e" />
            </marker>
            <marker id="arrow-blue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#3b82f6" />
            </marker>
            <marker id="arrow-red" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#ef4444" />
            </marker>
          </defs>

          {/* Base Map Background & Urban Grid */}
          <rect width="1200" height="780" fill="#080d19" />
          <rect width="1200" height="780" fill="url(#urban-grid)" />

          {/* Subtle District Zoning Underlays for Spatial Context */}
          <g opacity="0.10">
            {/* Cluster A: Medical & Residential (Northwest) */}
            <rect x="50" y="40" width="470" height="280" rx="16" fill="#065f46" stroke="#10b981" strokeWidth="1.5" />
            {/* Cluster B: Tech & Commercial (Northeast) */}
            <rect x="680" y="40" width="480" height="280" rx="16" fill="#881337" stroke="#f43f5e" strokeWidth="1.5" />
            {/* Cluster C: Hub & Riverbank (Southwest) */}
            <rect x="50" y="390" width="470" height="350" rx="16" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="1.5" />
            {/* Cluster D: Industrial & Maritime (Southeast) */}
            <rect x="680" y="390" width="480" height="350" rx="16" fill="#78350f" stroke="#f59e0b" strokeWidth="1.5" />
          </g>

          {/* District Zoning Labels */}
          <g opacity="0.45" className="pointer-events-none select-none">
            <text x="75" y="70" fill="#34d399" fontSize="10.5" fontWeight="900" letterSpacing="0.15em">NORTHWEST · HEALTH & RESIDENTIAL</text>
            <text x="705" y="70" fill="#fb7185" fontSize="10.5" fontWeight="900" letterSpacing="0.15em">NORTHEAST · COMMERCIAL & TECH</text>
            <text x="75" y="420" fill="#60a5fa" fontSize="10.5" fontWeight="900" letterSpacing="0.15em">SOUTHWEST · LOGISTICS CENTRAL</text>
            <text x="705" y="420" fill="#fbbf24" fontSize="10.5" fontWeight="900" letterSpacing="0.15em">SOUTHEAST · MARITIME & FREIGHT</text>
          </g>

          {/* Parks & Greenery */}
          {MAP_DATA.parks.map((park) => (
            <g key={park.id} opacity="0.75">
              <rect x={park.x} y={park.y} width={park.width} height={park.height} rx="10" fill="#0f3923" stroke="#166534" strokeWidth="1" />
              <circle cx={park.x + 16} cy={park.y + 24} r="11" fill="#14532d" />
              <circle cx={park.x + 36} cy={park.y + 42} r="13" fill="#166534" />
              <circle cx={park.x + 22} cy={park.y + 70} r="10" fill="#15803d" />
              <circle cx={park.x + 32} cy={park.y + 110} r="12" fill="#14532d" />
              <circle cx={park.x + 18} cy={park.y + 145} r="11" fill="#166534" />
              {park.type === "water" && (
                <ellipse cx={park.x + park.width / 2} cy={park.y + park.height / 2} rx={park.width / 2.2} ry={park.height / 2.4} fill="#0284c7" stroke="#38bdf8" strokeWidth="1" opacity="0.85" />
              )}
            </g>
          ))}

          {/* Riverside Greenery */}
          <g opacity="0.55">
            <circle cx="538" cy="80" r="7" fill="#15803d" />
            <circle cx="536" cy="115" r="8" fill="#166534" />
            <circle cx="538" cy="150" r="7" fill="#14532d" />
            <circle cx="535" cy="270" r="8" fill="#15803d" />
            <circle cx="538" cy="305" r="7" fill="#166534" />
            <circle cx="536" cy="390" r="8" fill="#14532d" />
            <circle cx="538" cy="425" r="7" fill="#15803d" />
            <circle cx="535" cy="490" r="8" fill="#166534" />
            <circle cx="538" cy="620" r="8" fill="#15803d" />
            <circle cx="536" cy="660" r="7" fill="#14532d" />

            <circle cx="662" cy="80" r="7" fill="#15803d" />
            <circle cx="664" cy="115" r="8" fill="#166534" />
            <circle cx="662" cy="150" r="7" fill="#14532d" />
            <circle cx="665" cy="270" r="8" fill="#15803d" />
            <circle cx="662" cy="305" r="7" fill="#166534" />
            <circle cx="664" cy="390" r="8" fill="#14532d" />
            <circle cx="662" cy="425" r="7" fill="#15803d" />
            <circle cx="665" cy="490" r="8" fill="#166534" />
            <circle cx="662" cy="620" r="8" fill="#15803d" />
            <circle cx="664" cy="660" r="7" fill="#14532d" />
          </g>

          {/* City Buildings & Urban Fabric */}
          <g opacity="0.75">
            {MAP_DATA.buildings.map((bld) => (
              <g key={bld.id}>
                <rect x={bld.x + 3} y={bld.y + 4} width={bld.width} height={bld.height} rx="4" fill="#020617" opacity="0.75" />
                <rect x={bld.x} y={bld.y} width={bld.width} height={bld.height} rx="4" fill="#151f30" stroke="#25354d" strokeWidth="1" />
                <rect x={bld.x + 5} y={bld.y + 5} width={bld.width - 10} height={bld.height - 10} rx="2" fill="#0e1726" stroke="#1d2a3d" strokeWidth="0.8" />
                {bld.width > 80 && (
                  <g opacity="0.55">
                    <rect x={bld.x + 10} y={bld.y + 10} width="16" height="12" rx="1" fill="#1e293b" />
                    <rect x={bld.x + 32} y={bld.y + 10} width="20" height="12" rx="1" fill="#1e293b" />
                  </g>
                )}
              </g>
            ))}
          </g>

          {/* Rivermere River */}
          <g>
            <path d="M 550 0 C 565 150 540 300 550 450 C 560 580 545 680 550 780 L 650 780 C 645 680 660 580 650 450 C 640 300 665 150 650 0 Z" fill="url(#river-gradient)" />
            <path d="M 590 20 C 600 170 585 340 595 510 C 605 630 590 710 595 760" fill="none" stroke="#7dd3fc" strokeWidth="2.5" strokeDasharray="20 30" opacity="0.4" />
            <path d="M 612 40 C 622 190 607 360 617 530 C 627 650 612 730 617 770" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeDasharray="14 24" opacity="0.3" />
            <text x="600" y="370" textAnchor="middle" fill="#bae6fd" fontSize="12" fontWeight="900" letterSpacing="0.25em" transform="rotate(90 600 370)" className="select-none opacity-85">
              RIVERMERE RIVER
            </text>
            {MAP_DATA.river.boats.map((boat) => (
              <g key={boat.id} transform={`translate(${boat.x}, ${boat.y}) rotate(${boat.angle})`}>
                <path d="M -8 -16 L 0 0 L 8 -16" fill="none" stroke="#bae6fd" strokeWidth="1.2" opacity="0.45" strokeDasharray="3 3" />
                <path d="M 0 14 L 6 8 L 5 -12 L -5 -12 L -6 8 Z" fill="#e2e8f0" stroke="#475569" strokeWidth="1" />
                <rect x="-3" y="-6" width="6" height="10" rx="1" fill="#0284c7" />
              </g>
            ))}
          </g>

          {/* Elevated Highway Overpass - Clean solid design without yellow stripes */}
          <g>
            {MAP_DATA.highwayOverpass.map((hw) => (
              <g key={hw.id}>
                <path d={hw.path} fill="none" stroke="#020617" strokeWidth={hw.width + 6} strokeLinecap="round" opacity="0.8" />
                <path d={hw.path} fill="none" stroke="#253245" strokeWidth={hw.width} strokeLinecap="round" />
                <path d={hw.path} fill="none" stroke="#3b4d66" strokeWidth={hw.width - 4} strokeLinecap="round" opacity="0.4" />
              </g>
            ))}
          </g>

          {/* Roads Network - CLEAN ASPHALT WITHOUT WHITE MARKINGS */}
          <g>
            {MAP_DATA.roads.map((road) => {
              const from = pointById[road.from];
              const to = pointById[road.to];
              if (!from || !to) return null;
              const style = roadStyles[road.type] || roadStyles.local;
              const isBlocked = blockedSet.has(road.id);
              const isRoadSelected = selectedItem?.type === "road" && selectedItem?.id === road.id;
              const midX = (from.x + to.x) / 2;
              const midY = (from.y + to.y) / 2;

              return (
                <g key={road.id} className="cursor-pointer" onClick={(e) => handleRoadClick(e, road)}>
                  {/* Wide invisible hit area for easy clicking */}
                  <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="transparent" strokeWidth="24" strokeLinecap="round" />

                  {/* Outer asphalt edge for subtle depth */}
                  <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={style.border} strokeWidth={style.width + 3} strokeLinecap="round" />

                  {isRoadSelected && (
                    <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#38bdf8" strokeWidth={style.width + 6} strokeLinecap="round" opacity="0.9" />
                  )}
                  {isBlocked ? (
                    <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="url(#hazard-pattern)" strokeWidth={style.width + 2} strokeLinecap="round" />
                  ) : (
                    <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={style.base} strokeWidth={style.width} strokeLinecap="round" />
                  )}

                  {isBlocked && (
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect x="-24" y="-8" width="48" height="16" rx="3" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1.5" />
                      <text x="0" y="3.5" textAnchor="middle" fill="#fecaca" fontSize="8" fontWeight="900">BLOCKED</text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* Clean Roundabouts - Solid dark asphalt without white stripes */}
          <g>
            <circle cx="100" cy="340" r="30" fill="#080e1a" />
            <circle cx="100" cy="340" r="26" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
            <circle cx="100" cy="340" r="14" fill="#14532d" stroke="#16a34a" strokeWidth="1.5" />

            <circle cx="1110" cy="340" r="30" fill="#080e1a" />
            <circle cx="1110" cy="340" r="26" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
            <circle cx="1110" cy="340" r="14" fill="#14532d" stroke="#16a34a" strokeWidth="1.5" />
          </g>

          {/* Bridges across Rivermere River - Clean solid deck without yellow stripes */}
          {MAP_DATA.bridges.map((bridge) => {
            const isBlocked = blockedSet.has(bridge.id);
            const isBridgeSelected = selectedItem?.id === bridge.id;
            return (
              <g key={bridge.id} className="cursor-pointer outline-none" onClick={(e) => handleBridgeClick(e, bridge)}>
                {/* Bridge piers in river */}
                <rect x={bridge.x + 35} y={bridge.y - 4} width="14" height={bridge.height + 8} rx="2" fill="#0b1726" stroke="#1e293b" strokeWidth="1" />
                <rect x={bridge.x + bridge.width - 49} y={bridge.y - 4} width="14" height={bridge.height + 8} rx="2" fill="#0b1726" stroke="#1e293b" strokeWidth="1" />

                <rect x={bridge.x} y={bridge.y + 4} width={bridge.width} height={bridge.height} rx="4" fill="#020617" opacity="0.75" />
                <rect x={bridge.x} y={bridge.y} width={bridge.width} height={bridge.height} rx="4"
                  fill={isBlocked ? "url(#hazard-pattern)" : isBridgeSelected ? "#1e3a8a" : "#243245"}
                  stroke={isBlocked ? "#ef4444" : isBridgeSelected ? "#ffffff" : "#475569"}
                  strokeWidth={isBlocked || isBridgeSelected ? 3 : 2}
                />
                {/* Clean parapet rails */}
                <line x1={bridge.x} y1={bridge.y + 3} x2={bridge.x + bridge.width} y2={bridge.y + 3} stroke="#64748b" strokeWidth="1" />
                <line x1={bridge.x} y1={bridge.y + bridge.height - 3} x2={bridge.x + bridge.width} y2={bridge.y + bridge.height - 3} stroke="#64748b" strokeWidth="1" />

                {/* Wide hit area */}
                <rect x={bridge.x} y={bridge.y} width={bridge.width} height={bridge.height} rx="4" fill="transparent" strokeWidth="0" />

                <rect x={bridge.x + bridge.width / 2 - 48} y={bridge.y - 13} width="96" height="18" rx="3" fill={isBlocked ? "#7f1d1d" : "#0f172a"} stroke={isBlocked ? "#ef4444" : "#475569"} strokeWidth="1" />
                <text x={bridge.x + bridge.width / 2} y={bridge.y - 1} textAnchor="middle" fill={isBlocked ? "#fecaca" : "#f8fafc"} fontSize="9.5" fontWeight="800" className="select-none">
                  {isBlocked ? `${bridge.label} [CLOSED]` : bridge.label}
                </text>
              </g>
            );
          })}

          {/* Warehouse */}
          <g className="cursor-pointer outline-none" onClick={(e) => { e.stopPropagation(); onSelect({ type: "warehouse", id: MAP_DATA.warehouse.id, label: MAP_DATA.warehouse.label }); }}>
            <rect x="60" y="540" width="210" height="140" rx="8" fill="#0c1524" stroke={selectedItem?.type === "warehouse" ? "#38bdf8" : "#24344d"} strokeWidth={selectedItem?.type === "warehouse" ? 3 : 1.5} />
            <rect x={MAP_DATA.warehouse.building.x} y={MAP_DATA.warehouse.building.y} width={MAP_DATA.warehouse.building.width} height={MAP_DATA.warehouse.building.height} rx="4" fill="#182438" stroke="#475569" strokeWidth="1.8" />
            {MAP_DATA.warehouse.bays.map((bay, i) => (<rect key={i} x={bay.x} y={bay.y} width={bay.width} height={bay.height} rx="2" fill="#2d3f59" stroke="#94a3b8" strokeWidth="1" />))}
            {MAP_DATA.warehouse.dockedTrucks.map((dt, i) => (
              <g key={i}>
                <rect x={dt.x} y={dt.y} width={dt.width} height={dt.height} rx="2" fill="#e2e8f0" stroke="#475569" strokeWidth="1" />
                <rect x={dt.x + 18} y={dt.y + 2} width="6" height="10" rx="1" fill="#0284c7" />
              </g>
            ))}
            {/* Drone Launch Pad */}
            <circle cx="110" cy="590" r="14" fill="#111c2e" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
            <text x="110" y="594" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="900">H</text>

            <text x="175" y="625" textAnchor="middle" fill="#f8fafc" fontSize="12.5" fontWeight="900">LOGISTICS HUB</text>
            <text x="175" y="640" textAnchor="middle" fill="#94a3b8" fontSize="8.5" fontWeight="700">CENTRAL DISPATCH</text>
          </g>

          {/* Spatial City Landmarks for Orientation */}
          <g opacity="0.8" className="pointer-events-none select-none">
            <g transform="translate(230, 48)">
              <rect x="-38" y="-9" width="76" height="18" rx="4" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
              <text x="0" y="3.5" textAnchor="middle" fill="#a7f3d0" fontSize="8" fontWeight="800">✚ CITY HOSPITAL</text>
            </g>
            <g transform="translate(960, 48)">
              <rect x="-44" y="-9" width="88" height="18" rx="4" fill="#4c0519" stroke="#f43f5e" strokeWidth="1" />
              <text x="0" y="3.5" textAnchor="middle" fill="#fecdd3" fontSize="8" fontWeight="800">★ MARKET PLAZA</text>
            </g>
            <g transform="translate(100, 390)">
              <rect x="-38" y="-9" width="76" height="18" rx="4" fill="#172554" stroke="#3b82f6" strokeWidth="1" />
              <text x="0" y="3.5" textAnchor="middle" fill="#bfdbfe" fontSize="8" fontWeight="800">◆ WEST TERMINAL</text>
            </g>
            <g transform="translate(840, 715)">
              <rect x="-42" y="-9" width="84" height="18" rx="4" fill="#451a03" stroke="#f59e0b" strokeWidth="1" />
              <text x="0" y="3.5" textAnchor="middle" fill="#fde68a" fontSize="8" fontWeight="800">⚓ EAST DOCKS</text>
            </g>
          </g>

          {/* Clusters */}
          {MAP_DATA.clusters.map((cluster) => {
            const isClusterSelected = selectedItem?.id === cluster.id;
            return (
              <g key={cluster.id} className="cursor-pointer outline-none" onClick={(e) => { e.stopPropagation(); onSelect({ type: "cluster", id: cluster.id, label: `${cluster.name} (${cluster.subtitle})` }); }}>
                <rect x={cluster.bounds.x} y={cluster.bounds.y} width={cluster.bounds.width} height={cluster.bounds.height} rx="10" fill="none" stroke={cluster.color} strokeWidth={isClusterSelected ? 2.5 : 1} strokeDasharray="6 6" opacity={isClusterSelected ? 0.9 : 0.35} />
                <g transform={`translate(${cluster.badgeX}, ${cluster.badgeY})`}>
                  <rect x="-60" y="-15" width="120" height="30" rx="6" fill={cluster.badgeColor} stroke={isClusterSelected ? "#ffffff" : cluster.color} strokeWidth={isClusterSelected ? 2 : 1} />
                  <text x="0" y="-1" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900">{cluster.name}</text>
                  <text x="0" y="9" textAnchor="middle" fill="#f8fafc" fontSize="7.5" fontWeight="700" opacity="0.9">{cluster.subtitle}</text>
                </g>
              </g>
            );
          })}

          {/* Ambient Traffic Cars */}
          <g opacity="0.8">
            {MAP_DATA.trafficVehicles.map((car, i) => (
              <g key={i} transform={`translate(${car.x}, ${car.y}) rotate(${car.angle})`}>
                <rect x={-car.width / 2} y={-car.height / 2} width={car.width} height={car.height} rx="2" fill={car.color} stroke="#020617" strokeWidth="0.8" />
              </g>
            ))}
          </g>

          {/* Vehicle Routes */}
          <g>
            {vehicles.map((vehicle) => {
              if (vehicle.status === "DISABLED" || vehicle.status === "WAITING") return null;
              const points = getVehicleRoutePoints(vehicle);
              if (points.length < 2) return null;
              const arrowId = vehicle.color === "#22c55e" ? "arrow-green" : vehicle.color === "#3b82f6" ? "arrow-blue" : "arrow-red";
              return (
                <g key={`${vehicle.id}-route`}>
                  <path d={routeToPath(points)} fill="none" stroke="#020617" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
                  <path d={routeToPath(points)} fill="none" stroke={vehicle.color} strokeWidth="3.5" strokeDasharray="14 10" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" markerMid={`url(#${arrowId})`} />
                </g>
              );
            })}
          </g>

          {/* Locations */}
          <g>
            {MAP_DATA.locations.map((location) => (
              <LocationMarker
                key={location.id}
                location={location}
                delivery={deliveriesByNodeId[location.nodeId]}
                isSelected={selectedItem?.type === "location" && selectedItem?.id === location.id}
                onSelect={onSelect}
                onMouseEnter={(e) => handleLocationMouseEnter(e, location, deliveriesByNodeId[location.nodeId])}
                onMouseLeave={() => setHoveredLocation(null)}
              />
            ))}
          </g>

          {/* Vehicles */}
          <g>
            {vehicles.map((vehicle) => {
              const isVehicleSelected = selectedItem?.id === vehicle.id;
              const isMoving = vehicle.status === "MOVING";
              const isDisabled = vehicle.status === "DISABLED";
              const isWaiting = vehicle.status === "WAITING" || vehicle.status === "NO ROUTE";
              const isDelayed = vehicle.status === "DELAYED";
              const iconColor = isDisabled ? "#64748b" : isDelayed ? "#f97316" : isWaiting ? "#f59e0b" : vehicle.color;

              return (
                <g
                  key={vehicle.id}
                  transform={`translate(${vehicle.position.x}, ${vehicle.position.y})`}
                  className="cursor-pointer outline-none"
                  tabIndex="0"
                  role="button"
                  aria-label={`Vehicle ${vehicle.id}`}
                  onClick={(e) => { e.stopPropagation(); onSelect({ type: "vehicle", id: vehicle.id, label: vehicle.label }); }}
                  onMouseEnter={() => setHoveredVehicle(vehicle)}
                  onMouseLeave={() => setHoveredVehicle(null)}
                >
                  {isVehicleSelected && <circle cx="0" cy="0" r="22" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="5 4" className="animate-spin" />}
                  {isMoving && !isDisabled && !isWaiting && !isDelayed && <circle cx="0" cy="0" r="16" fill={vehicle.color} opacity="0.25" className="animate-ping" />}
                  <VehicleIcon type={vehicle.type} color={iconColor} />
                  <g transform="translate(0, -17)">
                    <rect x="-26" y="-7" width="52" height="14" rx="3" fill={isDisabled ? "#7f1d1d" : isWaiting ? "#78350f" : isDelayed ? "#7c2d12" : "#020617"} stroke={isDisabled ? "#ef4444" : isWaiting ? "#f59e0b" : isDelayed ? "#f97316" : vehicle.color} strokeWidth={1.2} />
                    <text x="0" y="2.5" textAnchor="middle" fill={isDisabled ? "#fecaca" : isWaiting ? "#fde68a" : isDelayed ? "#ffedd5" : "#f8fafc"} fontSize="7" fontWeight="900">
                      {isDisabled ? `${vehicle.id} [OFF]` : isWaiting ? `${vehicle.id} [WAIT]` : isDelayed ? `${vehicle.id} [DELAY]` : vehicle.id}
                    </text>
                  </g>
                  {isDisabled && (
                    <g transform="translate(12, -18)">
                      <circle cx="0" cy="0" r="6" fill="#dc2626" stroke="#ffffff" strokeWidth="1" />
                      <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="900">!</text>
                    </g>
                  )}
                  {isWaiting && (
                    <g transform="translate(12, -18)">
                      <circle cx="0" cy="0" r="6" fill="#d97706" stroke="#ffffff" strokeWidth="1" />
                      <text x="0" y="2.5" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900">⏸</text>
                    </g>
                  )}
                  {isDelayed && (
                    <g transform="translate(0, 22)">
                      <rect x="-30" y="-7" width="60" height="14" rx="4" fill="#7c2d12" stroke="#f97316" strokeWidth="1.5" />
                      <text x="0" y="3" textAnchor="middle" fill="#ffedd5" fontSize="9" fontWeight="900" fontFamily="monospace">
                        ⏱ {Math.ceil(vehicle.delayRemaining || 0)}s
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* Legend */}
          <g transform="translate(0, 730)">
            <rect x="0" y="0" width="1200" height="50" fill="#040711" stroke="#1e293b" strokeWidth="1" />
            <g transform="translate(40, 12)">
              <text x="0" y="10" fill="#94a3b8" fontSize="9" fontWeight="900" letterSpacing="0.1em" className="uppercase">Vehicles (3)</text>
              <g transform="translate(0, 22)">
                <circle cx="6" cy="-2" r="4.5" fill="none" stroke="#22c55e" strokeWidth="2" />
                <text x="16" y="1" fill="#e2e8f0" fontSize="9" fontWeight="700">V-01 Bike</text>
                <rect x="120" y="-7" width="14" height="9" rx="2" fill="#3b82f6" />
                <text x="140" y="1" fill="#e2e8f0" fontSize="9" fontWeight="700">V-02 Van</text>
                <rect x="240" y="-8" width="14" height="10" rx="2" fill="#ef4444" />
                <text x="260" y="1" fill="#e2e8f0" fontSize="9" fontWeight="700">V-03 Truck</text>
              </g>
            </g>
            <g transform="translate(480, 12)">
              <text x="0" y="10" fill="#94a3b8" fontSize="9" fontWeight="900" letterSpacing="0.1em" className="uppercase">Click road/bridge to Block • Hover vehicle or delivery for ETA & Status</text>
            </g>
            <g transform="translate(1040, 15)">
              <line x1="0" y1="16" x2="60" y2="16" stroke="#64748b" strokeWidth="1.5" />
              <line x1="0" y1="12" x2="0" y2="20" stroke="#64748b" strokeWidth="1.5" />
              <line x1="60" y1="12" x2="60" y2="20" stroke="#64748b" strokeWidth="1.5" />
              <text x="0" y="10" fill="#64748b" fontSize="7.5" fontWeight="700">0</text>
              <text x="52" y="10" fill="#64748b" fontSize="7.5" fontWeight="700">2 km</text>
              <g transform="translate(90, 14)">
                <circle cx="0" cy="0" r="11" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                <path d="M 0 -8 L 3 0 L 0 -1.5 L -3 0 Z" fill="#ef4444" />
                <text x="0" y="-10" textAnchor="middle" fill="#f8fafc" fontSize="7.5" fontWeight="900">N</text>
              </g>
            </g>
          </g>
        </svg>

        {/* Vehicle Hover Tooltip (HTML overlay) */}
        {hoveredVehicle && (
          <VehicleTooltip vehicle={hoveredVehicle} position={tooltipPos} />
        )}

        {/* Delivery Location Hover Tooltip (HTML overlay) */}
        {hoveredLocation && (
          <DeliveryTooltip
            delivery={hoveredLocation.delivery}
            location={hoveredLocation.location}
            vehicle={hoveredLocation.delivery ? vehicles.find((v) => v.id === hoveredLocation.delivery.assignedVehicleId) : null}
            position={tooltipPos}
          />
        )}
      </div>
    </div>
  );
}
