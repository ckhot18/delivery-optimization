import { useMemo, useRef, useState } from "react";
import { MAP_DATA } from "../data/simulationData.js";
import { getVehicleRoutePoints, pointById, routeToPath } from "../utils/simulationEngine.js";
import VehicleTooltip from "./VehicleTooltip.jsx";
import DeliveryTooltip from "./DeliveryTooltip.jsx";

const roadStyles = {
  bridge:   { base: "#E5E5EA", border: "#D1D1D6", width: 16 },
  highway:  { base: "#FFFFFF", border: "#D1D1D6", width: 17 },
  arterial: { base: "#FFFFFF", border: "#E5E5EA", width: 14 },
  cluster:  { base: "#FFFFFF", border: "#F2F2F7", width: 10 },
  local:    { base: "#FFFFFF", border: "#F2F2F7", width: 8 },
};

function VehicleIcon({ type, color }) {
  if (type === "TRUCK") {
    return (
      <g>
        {/* Drop shadow */}
        <rect x="-22" y="-12" width="44" height="24" rx="4" fill="#000000" opacity="0.15" filter="blur(2px)" />
        {/* Cargo Container */}
        <rect x="-20" y="-11" width="28" height="22" rx="3" fill={color} />
        {/* Truck Cabin */}
        <rect x="8" y="-9" width="13" height="18" rx="4" fill="#FFFFFF" />
        {/* Windshield */}
        <rect x="13" y="-6" width="6" height="12" rx="2" fill="#000000" opacity="0.8" />
      </g>
    );
  }
  if (type === "VAN") {
    return (
      <g>
        {/* Drop shadow */}
        <rect x="-18" y="-11" width="36" height="22" rx="6" fill="#000000" opacity="0.15" filter="blur(2px)" />
        {/* Van Main Body */}
        <rect x="-16" y="-10" width="32" height="20" rx="6" fill={color} />
        {/* Aerodynamic Windshield */}
        <path d="M 6 -7 L 11 -4 L 11 4 L 6 7 Z" fill="#000000" opacity="0.8" />
      </g>
    );
  }
  // Courier Bike
  return (
    <g>
      <ellipse cx="0" cy="2" rx="14" ry="8" fill="#000000" opacity="0.15" filter="blur(1px)" />
      <circle cx="0" cy="0" r="7" fill={color} />
      <circle cx="0" cy="0" r="4" fill="#FFFFFF" />
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

  let markerColor = "#007AFF"; // Apple Blue
  if (isStore) markerColor = "#5E5CE6"; // Purple
  if (isCritical) markerColor = "#FF3B30"; // Red
  if (isDelayed) markerColor = "#FF9500"; // Orange
  if (isUnreachable) markerColor = "#8E8E93"; // Gray
  if (isComplete) markerColor = "#34C759"; // Green

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
      opacity={isComplete ? 0.6 : 1}
    >
      {isSelected && (
        <circle cx={point.x} cy={point.y} r="26" fill="none" stroke={markerColor} strokeWidth="2" strokeDasharray="4 4" className="animate-spin" />
      )}

      {/* Map Pin Drop Shadow */}
      <ellipse cx={point.x} cy={point.y + 14} rx="12" ry="4" fill="#000000" opacity="0.15" filter="blur(1px)" />

      {/* Outer Marker Pin */}
      <circle cx={point.x} cy={point.y} r="14" fill={markerColor} stroke="#FFFFFF" strokeWidth="2" />

      {/* Inner Icon */}
      {isStore ? (
        <g transform={`translate(${point.x - 6}, ${point.y - 6})`}>
          <rect x="2" y="3" width="8" height="7" rx="1" fill="#FFFFFF" />
          <path d="M 3 3 L 6 0 L 9 3" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
        </g>
      ) : isCritical ? (
        <g transform={`translate(${point.x - 5}, ${point.y - 5})`}>
          <rect x="3.5" y="1" width="3" height="8" rx="0.5" fill="#FFFFFF" />
          <rect x="1" y="3.5" width="8" height="3" rx="0.5" fill="#FFFFFF" />
        </g>
      ) : isComplete ? (
        <g transform={`translate(${point.x - 5}, ${point.y - 5})`}>
          <path d="M 2 5 L 4 7 L 8 2" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ) : (
        <circle cx={point.x} cy={point.y} r="4" fill="#FFFFFF" />
      )}

      {/* Address Pill Label */}
      <g transform={`translate(${point.x}, ${point.y + 22})`}>
        <rect x="-36" y="-7" width="72" height="14" rx="7" fill="#FFFFFF" opacity="0.9" />
        <text x="0" y="3.5" textAnchor="middle" fill="#1C1C1E" fontSize="9" fontWeight="600" className="pointer-events-none select-none">
          {location.label}
        </text>
      </g>
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
      className="relative flex h-full min-h-[560px] flex-col overflow-hidden bg-[#F2F2F7]"
    >
      {/* SVG Canvas */}
      <div className="relative flex-1 w-full overflow-hidden" onClick={() => onSelect(null)}>
        <svg viewBox={MAP_DATA.viewBox} className="h-full w-full select-none" role="img" aria-label="Interactive city logistics map">
          <defs>
            <linearGradient id="river-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#A6C8F2" />
              <stop offset="50%" stopColor="#BCE0FD" />
              <stop offset="100%" stopColor="#A6C8F2" />
            </linearGradient>
            <marker id="arrow-green" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#34C759" />
            </marker>
            <marker id="arrow-blue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#007AFF" />
            </marker>
            <marker id="arrow-red" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#FF3B30" />
            </marker>
          </defs>

          {/* Base Map Background */}
          <rect width="1200" height="780" fill="#EFEFF4" />

          {/* City Buildings - Subtle blocks */}
          <g opacity="0.4">
            {MAP_DATA.buildings.map((bld) => (
              <rect key={bld.id} x={bld.x} y={bld.y} width={bld.width} height={bld.height} rx="6" fill="#D1D1D6" />
            ))}
          </g>

          {/* Rivermere River - Wide, natural, organic waterway */}
          <g>
            <path
              d="M 535 0 C 558 150 525 310 546 470 C 558 580 530 680 545 780 L 675 780 C 660 680 688 580 676 470 C 655 310 688 150 665 0 Z"
              fill="url(#river-gradient)"
            />
            <path
              d="M 535 0 C 558 150 525 310 546 470 C 558 580 530 680 545 780"
              fill="none"
              stroke="#8BB9EE"
              strokeWidth="2"
            />
            <path
              d="M 665 0 C 688 150 655 310 676 470 C 688 580 660 680 675 780"
              fill="none"
              stroke="#8BB9EE"
              strokeWidth="2"
            />
          </g>

          {/* Elevated Highway Overpass */}
          <g>
            {MAP_DATA.highwayOverpass.map((hw) => (
              <g key={hw.id}>
                <path d={hw.path} fill="none" stroke="#D1D1D6" strokeWidth={hw.width + 2} strokeLinecap="round" />
                <path d={hw.path} fill="none" stroke="#FFFFFF" strokeWidth={hw.width} strokeLinecap="round" />
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
                  <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="transparent" strokeWidth="26" strokeLinecap="round" />

                  {/* Outer road border for clean depth */}
                  <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={style.border} strokeWidth={style.width + 3.5} strokeLinecap="round" />

                  {isRoadSelected && (
                    <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#2563eb" strokeWidth={style.width + 6} strokeLinecap="round" opacity="0.9" />
                  )}
                  {isBlocked ? (
                    <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="url(#hazard-pattern)" strokeWidth={style.width + 2} strokeLinecap="round" />
                  ) : (
                    <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={style.base} strokeWidth={style.width} strokeLinecap="round" />
                  )}

                  {isBlocked && (
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect x="-26" y="-9" width="52" height="18" rx="3.5" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1.5" />
                      <text x="0" y="3.5" textAnchor="middle" fill="#fecaca" fontSize="8.5" fontWeight="900">BLOCKED</text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* Clean Roundabouts - Light Slate */}
          <g>
            <circle cx="100" cy="340" r="30" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" />
            <circle cx="100" cy="340" r="15" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />

            <circle cx="1110" cy="340" r="30" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" />
            <circle cx="1110" cy="340" r="15" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
          </g>

          {/* Distinct Suspension Bridges across Rivermere - Architecturally Distinct from Roads */}
          {MAP_DATA.bridges.map((bridge) => {
            const isBlocked = blockedSet.has(bridge.id);
            const isBridgeSelected = selectedItem?.id === bridge.id;
            const fromP = pointById[bridge.fromNode] || { x: 490, y: bridge.y };
            const toP = pointById[bridge.toNode] || { x: 710, y: bridge.y };
            const spanWidth = toP.x - fromP.x;
            const midX = (fromP.x + toP.x) / 2;
            const deckY = bridge.y;

            // Towers at 20% and 80% along the span
            const tower1X = fromP.x + spanWidth * 0.22;
            const tower2X = fromP.x + spanWidth * 0.78;

            return (
              <g key={bridge.id} className="cursor-pointer outline-none" onClick={(e) => handleBridgeClick(e, bridge)}>
                {/* Bridge Pier Shadow on River */}
                <rect x={fromP.x + 10} y={deckY + 6} width={spanWidth - 20} height="12" rx="4" fill="#0369a1" opacity="0.25" />

                {/* Reinforced Concrete Abutments on Shorelines */}
                <rect x={fromP.x - 4} y={deckY - 14} width="22" height="28" rx="3" fill="#64748b" stroke="#334155" strokeWidth="1.5" />
                <rect x={toP.x - 18} y={deckY - 14} width="22" height="28" rx="3" fill="#64748b" stroke="#334155" strokeWidth="1.5" />

                {/* Suspension Towers / Pylons rising above & below deck */}
                <g>
                  {/* West Pylon */}
                  <rect x={tower1X - 5} y={deckY - 26} width="10" height="48" rx="2" fill="#334155" stroke="#ffffff" strokeWidth="1" />
                  <rect x={tower1X - 3} y={deckY - 24} width="6" height="44" rx="1" fill="#475569" />
                  <line x1={tower1X - 5} y1={deckY - 10} x2={tower1X + 5} y2={deckY - 10} stroke="#cbd5e1" strokeWidth="1.5" />
                  <line x1={tower1X - 5} y1={deckY + 8} x2={tower1X + 5} y2={deckY + 8} stroke="#cbd5e1" strokeWidth="1.5" />

                  {/* East Pylon */}
                  <rect x={tower2X - 5} y={deckY - 26} width="10" height="48" rx="2" fill="#334155" stroke="#ffffff" strokeWidth="1" />
                  <rect x={tower2X - 3} y={deckY - 24} width="6" height="44" rx="1" fill="#475569" />
                  <line x1={tower2X - 5} y1={deckY - 10} x2={tower2X + 5} y2={deckY - 10} stroke="#cbd5e1" strokeWidth="1.5" />
                  <line x1={tower2X - 5} y1={deckY + 8} x2={tower2X + 5} y2={deckY + 8} stroke="#cbd5e1" strokeWidth="1.5" />
                </g>

                {/* Main Suspension Cables (Graceful swooping catenary) */}
                <path
                  d={`M ${fromP.x} ${deckY - 2} Q ${tower1X} ${deckY - 30} ${midX} ${deckY - 6} Q ${tower2X} ${deckY - 30} ${toP.x} ${deckY - 2}`}
                  fill="none"
                  stroke={isBlocked ? "#ef4444" : "#1e293b"}
                  strokeWidth="2.8"
                />
                {/* Secondary Lower Cable */}
                <path
                  d={`M ${fromP.x + 8} ${deckY + 2} Q ${tower1X} ${deckY - 25} ${midX} ${deckY - 2} Q ${tower2X} ${deckY - 25} ${toP.x - 8} ${deckY + 2}`}
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="1.2"
                  opacity="0.7"
                />

                {/* Vertical Steel Hanger Cables */}
                {[0.30, 0.36, 0.42, 0.50, 0.58, 0.64, 0.70].map((ratio, idx) => {
                  const hx = fromP.x + spanWidth * ratio;
                  return (
                    <line
                      key={idx}
                      x1={hx}
                      y1={deckY - 16 + Math.abs(ratio - 0.5) * 20}
                      x2={hx}
                      y2={deckY - 3}
                      stroke="#94a3b8"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Heavy Bridge Deck Roadway */}
                <rect
                  x={fromP.x}
                  y={deckY - 9}
                  width={spanWidth}
                  height="18"
                  rx="3"
                  fill={isBlocked ? "url(#hazard-pattern)" : isBridgeSelected ? "#dbeafe" : "#1e293b"}
                  stroke={isBlocked ? "#ef4444" : isBridgeSelected ? "#2563eb" : "#475569"}
                  strokeWidth={isBridgeSelected ? 2.5 : 1.5}
                />

                {/* Illuminated Deck Centerline */}
                {!isBlocked && (
                  <line
                    x1={fromP.x + 8}
                    y1={deckY}
                    x2={toP.x - 8}
                    y2={deckY}
                    stroke="#facc15"
                    strokeWidth="1.8"
                    strokeDasharray="10 8"
                  />
                )}

                {/* Parapet Safety Railings */}
                <line x1={fromP.x} y1={deckY - 8} x2={toP.x} y2={deckY - 8} stroke="#ffffff" strokeWidth="1" />
                <line x1={fromP.x} y1={deckY + 8} x2={toP.x} y2={deckY + 8} stroke="#ffffff" strokeWidth="1" />

                {/* Invisible wide hit area for easy clicking */}
                <rect x={fromP.x} y={deckY - 24} width={spanWidth} height="48" fill="transparent" />

                {/* High-Contrast Bridge Name & Status Pill */}
                <g transform={`translate(${midX}, ${deckY - 20})`}>
                  <rect
                    x="-68"
                    y="-9"
                    width="136"
                    height="18"
                    rx="4"
                    fill={isBlocked ? "#fee2e2" : "#ffffff"}
                    stroke={isBlocked ? "#ef4444" : isBridgeSelected ? "#2563eb" : "#cbd5e1"}
                    strokeWidth="1.5"
                    className="shadow-sm"
                  />
                  <text
                    x="0"
                    y="3.5"
                    textAnchor="middle"
                    fill={isBlocked ? "#dc2626" : "#0f172a"}
                    fontSize="9"
                    fontWeight="900"
                    className="select-none"
                  >
                    🌉 {isBlocked ? `${bridge.label.toUpperCase()} [BLOCKED]` : bridge.label.toUpperCase()}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Warehouse Hub */}
          <g className="cursor-pointer outline-none" onClick={(e) => { e.stopPropagation(); onSelect({ type: "warehouse", id: MAP_DATA.warehouse.id, label: MAP_DATA.warehouse.label }); }}>
            <rect x="60" y="540" width="210" height="140" rx="8" fill="#ffffff" stroke={selectedItem?.type === "warehouse" ? "#2563eb" : "#cbd5e1"} strokeWidth={selectedItem?.type === "warehouse" ? 2.5 : 1.5} />
            <rect x={MAP_DATA.warehouse.building.x} y={MAP_DATA.warehouse.building.y} width={MAP_DATA.warehouse.building.width} height={MAP_DATA.warehouse.building.height} rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
            {MAP_DATA.warehouse.bays.map((bay, i) => (<rect key={i} x={bay.x} y={bay.y} width={bay.width} height={bay.height} rx="2" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.8" />))}
            {MAP_DATA.warehouse.dockedTrucks.map((dt, i) => (
              <g key={i}>
                <rect x={dt.x} y={dt.y} width={dt.width} height={dt.height} rx="2" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />
                <rect x={dt.x + 18} y={dt.y + 2} width="6" height="10" rx="1" fill="#2563eb" />
              </g>
            ))}
            {/* Drone Launch Pad */}
            <circle cx="110" cy="590" r="14" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 3" />
            <text x="110" y="594" textAnchor="middle" fill="#2563eb" fontSize="10" fontWeight="900">H</text>

            <text x="175" y="625" textAnchor="middle" fill="#0f172a" fontSize="12" fontWeight="900">LOGISTICS HUB</text>
            <text x="175" y="640" textAnchor="middle" fill="#64748b" fontSize="8.5" fontWeight="700">CENTRAL DISPATCH</text>
          </g>

          {/* Spatial City Landmarks for Orientation */}
          <g opacity="0.85" className="pointer-events-none select-none">
            <g transform="translate(230, 48)">
              <rect x="-38" y="-9" width="76" height="18" rx="4" fill="#ecfdf5" stroke="#10b981" strokeWidth="1" />
              <text x="0" y="3.5" textAnchor="middle" fill="#047857" fontSize="8" fontWeight="800">✚ CITY HOSPITAL</text>
            </g>
            <g transform="translate(960, 48)">
              <rect x="-44" y="-9" width="88" height="18" rx="4" fill="#fff1f2" stroke="#f43f5e" strokeWidth="1" />
              <text x="0" y="3.5" textAnchor="middle" fill="#be123c" fontSize="8" fontWeight="800">★ MARKET PLAZA</text>
            </g>
            <g transform="translate(100, 390)">
              <rect x="-38" y="-9" width="76" height="18" rx="4" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1" />
              <text x="0" y="3.5" textAnchor="middle" fill="#1d4ed8" fontSize="8" fontWeight="800">◆ WEST TERMINAL</text>
            </g>
            <g transform="translate(840, 715)">
              <rect x="-42" y="-9" width="84" height="18" rx="4" fill="#fffbeb" stroke="#f59e0b" strokeWidth="1" />
              <text x="0" y="3.5" textAnchor="middle" fill="#b45309" fontSize="8" fontWeight="800">⚓ EAST DOCKS</text>
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

          {/* Vehicle Routes - High-Visibility Unobstructed Paths */}
          <g>
            {vehicles.map((vehicle) => {
              if (vehicle.status === "DISABLED" || vehicle.status === "WAITING") return null;
              const points = getVehicleRoutePoints(vehicle);
              if (points.length < 2) return null;
              const arrowId = vehicle.color === "#22c55e" ? "arrow-green" : vehicle.color === "#3b82f6" ? "arrow-blue" : "arrow-red";
              const pathD = routeToPath(points);
              return (
                <g key={`${vehicle.id}-route`}>
                  {/* High-contrast solid white underlay ensures routes never blend into roads */}
                  <path d={pathD} fill="none" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
                  {/* Outer subtle shadow for depth */}
                  <path d={pathD} fill="none" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" />
                  {/* Colored Active Route */}
                  <path d={pathD} fill="none" stroke={vehicle.color} strokeWidth="4" strokeDasharray="14 10" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" markerMid={`url(#${arrowId})`} />
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
                  {isVehicleSelected && <circle cx="0" cy="0" r="26" fill="none" stroke="#2563eb" strokeWidth="3" strokeDasharray="5 4" className="animate-spin" />}
                  {isMoving && !isDisabled && !isWaiting && !isDelayed && <circle cx="0" cy="0" r="20" fill={vehicle.color} opacity="0.3" className="animate-ping" />}
                  <VehicleIcon type={vehicle.type} color={iconColor} />

                  {/* Vehicle Status Tag (Large & High-Contrast for Presentation) */}
                  <g transform="translate(0, -20)">
                    <rect
                      x="-32"
                      y="-9"
                      width="64"
                      height="18"
                      rx="4"
                      fill={isDisabled ? "#7f1d1d" : isWaiting ? "#78350f" : isDelayed ? "#7c2d12" : "#0f172a"}
                      stroke={isDisabled ? "#ef4444" : isWaiting ? "#f59e0b" : isDelayed ? "#f97316" : "#ffffff"}
                      strokeWidth={1.5}
                      className="shadow-sm"
                    />
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fill={isDisabled ? "#fecaca" : isWaiting ? "#fde68a" : isDelayed ? "#ffedd5" : "#ffffff"}
                      fontSize="8.5"
                      fontWeight="900"
                    >
                      {isDisabled ? `${vehicle.id} [OFF]` : isWaiting ? `${vehicle.id} [WAIT]` : isDelayed ? `${vehicle.id} [DELAY]` : vehicle.id}
                    </text>
                  </g>

                  {isDisabled && (
                    <g transform="translate(16, -21)">
                      <circle cx="0" cy="0" r="7" fill="#dc2626" stroke="#ffffff" strokeWidth="1.5" />
                      <text x="0" y="3.5" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">!</text>
                    </g>
                  )}
                  {isWaiting && (
                    <g transform="translate(16, -21)">
                      <circle cx="0" cy="0" r="7" fill="#d97706" stroke="#ffffff" strokeWidth="1.5" />
                      <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="900">⏸</text>
                    </g>
                  )}
                  {isDelayed && (
                    <g transform="translate(0, 24)">
                      <rect x="-36" y="-9" width="72" height="18" rx="4" fill="#7c2d12" stroke="#f97316" strokeWidth="1.8" className="shadow-md" />
                      <text x="0" y="3.5" textAnchor="middle" fill="#ffedd5" fontSize="10" fontWeight="900" fontFamily="monospace">
                        ⏱ {Math.ceil(vehicle.delayRemaining || 0)}s DELAY
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* Presentation-Ready Clean Map Legend */}
          <g transform="translate(0, 726)">
            <rect x="0" y="0" width="1200" height="54" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
            <g transform="translate(40, 14)">
              <text x="0" y="10" fill="#475569" fontSize="10.5" fontWeight="900" letterSpacing="0.1em" className="uppercase">Fleet Vehicles (3)</text>
              <g transform="translate(0, 24)">
                {/* Bike */}
                <circle cx="6" cy="-2" r="6" fill="#16a34a" stroke="#ffffff" strokeWidth="1.5" />
                <text x="18" y="2" fill="#0f172a" fontSize="10" fontWeight="800">V-01 Courier Bike</text>
                {/* Van */}
                <rect x="150" y="-8" width="18" height="12" rx="3" fill="#2563eb" stroke="#ffffff" strokeWidth="1.2" />
                <text x="175" y="2" fill="#0f172a" fontSize="10" fontWeight="800">V-02 Delivery Van</text>
                {/* Truck */}
                <rect x="310" y="-9" width="20" height="14" rx="3" fill="#dc2626" stroke="#ffffff" strokeWidth="1.2" />
                <text x="338" y="2" fill="#0f172a" fontSize="10" fontWeight="800">V-03 Heavy Transport</text>
              </g>
            </g>
            <g transform="translate(560, 24)">
              <rect x="-10" y="-12" width="410" height="24" rx="6" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1" />
              <text x="195" y="4" textAnchor="middle" fill="#334155" fontSize="10" fontWeight="800">
                Click road or bridge to Block • Hover vehicle or address for live ETA
              </text>
            </g>
            <g transform="translate(1040, 16)">
              <line x1="0" y1="18" x2="60" y2="18" stroke="#64748b" strokeWidth="2" />
              <line x1="0" y1="13" x2="0" y2="23" stroke="#64748b" strokeWidth="2" />
              <line x1="60" y1="13" x2="60" y2="23" stroke="#64748b" strokeWidth="2" />
              <text x="0" y="10" fill="#475569" fontSize="9" fontWeight="800">0</text>
              <text x="48" y="10" fill="#475569" fontSize="9" fontWeight="800">2 km</text>
              <g transform="translate(90, 16)">
                <circle cx="0" cy="0" r="13" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
                <path d="M 0 -9 L 3.5 0 L 0 -2 L -3.5 0 Z" fill="#dc2626" />
                <text x="0" y="-11" textAnchor="middle" fill="#0f172a" fontSize="8.5" fontWeight="900">N</text>
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
