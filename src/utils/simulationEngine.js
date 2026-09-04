/**
 * Simulation Engine - Phase 4
 *
 * Authoritative source of truth for:
 *   - Road graph (adjacency + Dijkstra)
 *   - Blocked road set
 *   - Vehicle position, route (remaining legs), status
 *   - Delivery assignments and statuses
 *   - Metrics: reroutes, criticalOnTime, optimizationScore
 *
 * This module owns ONLY graph/pathfinding primitives + the simulation tick.
 * Incident handlers live in src/simulation/incidentHandlers.js
 * Assignment optimization lives in src/utils/fleetOptimizer.js
 */

import { MAP_DATA, VEHICLE_TYPES } from "../data/simulationData.js";
import { globalOptimize, computeOptimizationScore, computeVehicleETA } from "./fleetOptimizer.js";

// ---------------------------------------------------------------------------
// Authoritative lookups (exported for use by other modules)
// ---------------------------------------------------------------------------
export const pointById = Object.fromEntries(
  MAP_DATA.intersections.map((p) => [p.id, p])
);

export const locationByNodeId = Object.fromEntries(
  MAP_DATA.locations.map((loc) => [loc.nodeId, loc])
);

export const clusterById = Object.fromEntries(
  MAP_DATA.clusters.map((c) => [c.id, c])
);

export const roadById = Object.fromEntries(
  MAP_DATA.roads.map((r) => [r.id, r])
);

export function distanceBetween(a, b) {
  if (!a || !b) return 0;
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function findNearestNode(position) {
  if (!position) return MAP_DATA.warehouse.id;
  let nearest = MAP_DATA.warehouse.id;
  let minDist = Infinity;
  Object.values(pointById).forEach((point) => {
    const d = distanceBetween(position, point);
    if (d < minDist) { minDist = d; nearest = point.id; }
  });
  return nearest;
}

// ---------------------------------------------------------------------------
// Authoritative graph construction
// ---------------------------------------------------------------------------
function buildGraph() {
  const g = {};
  Object.keys(pointById).forEach((id) => { g[id] = []; });
  MAP_DATA.roads.forEach((road) => {
    const fromP = pointById[road.from];
    const toP = pointById[road.to];
    if (!fromP || !toP) return;
    const dist = distanceBetween(fromP, toP);
    g[road.from].push({ to: road.to, distance: dist, roadId: road.id });
    g[road.to].push({ to: road.from, distance: dist, roadId: road.id });
  });
  return g;
}

export const graph = buildGraph();

// ---------------------------------------------------------------------------
// Dijkstra - strictly excludes blocked roads
// ---------------------------------------------------------------------------
export function dijkstra(startNodeId, endNodeId, blockedRoadSet = new Set()) {
  if (startNodeId === endNodeId) {
    return { success: true, nodeIds: [startNodeId], legs: [], distance: 0 };
  }

  const distances = {};
  const previous = {};
  const unvisited = new Set(Object.keys(graph));

  Object.keys(graph).forEach((id) => {
    distances[id] = id === startNodeId ? 0 : Infinity;
    previous[id] = null;
  });

  while (unvisited.size > 0) {
    let current = null;
    let minDist = Infinity;
    unvisited.forEach((id) => {
      if (distances[id] < minDist) { minDist = distances[id]; current = id; }
    });

    if (!current || distances[current] === Infinity) break;
    if (current === endNodeId) break;

    unvisited.delete(current);
    (graph[current] || []).forEach((edge) => {
      if (!unvisited.has(edge.to)) return;
      if (blockedRoadSet.has(edge.roadId)) return;  // STRICT: never enter blocked edge
      const nextDist = distances[current] + edge.distance;
      if (nextDist < distances[edge.to]) {
        distances[edge.to] = nextDist;
        previous[edge.to] = { fromNode: current, roadId: edge.roadId, distance: edge.distance };
      }
    });
  }

  if (distances[endNodeId] === Infinity || !previous[endNodeId]) {
    return { success: false, nodeIds: [], legs: [], distance: Infinity };
  }

  const legs = [];
  let cursor = endNodeId;
  while (previous[cursor]) {
    const edge = previous[cursor];
    legs.unshift({ fromNode: edge.fromNode, toNode: cursor, roadId: edge.roadId, distance: edge.distance });
    cursor = edge.fromNode;
  }

  return {
    success: true,
    nodeIds: [startNodeId, ...legs.map((l) => l.toNode)],
    legs,
    distance: distances[endNodeId],
  };
}

// ---------------------------------------------------------------------------
// Multi-stop route builder
// ---------------------------------------------------------------------------
export function buildRouteForStops(startNodeId, pendingDeliveries, blockedRoadSet = new Set()) {
  let currentNode = startNodeId;
  const allLegs = [];

  for (const delivery of pendingDeliveries) {
    const legResult = dijkstra(currentNode, delivery.destination, blockedRoadSet);

    if (!legResult.success) {
      return { success: false, failedDelivery: delivery, legs: allLegs };
    }

    if (legResult.legs.length > 0) {
      legResult.legs[legResult.legs.length - 1].deliveryId = delivery.id;
      allLegs.push(...legResult.legs);
      currentNode = delivery.destination;
    } else if (currentNode === delivery.destination) {
      allLegs.push({ fromNode: currentNode, toNode: currentNode, roadId: null, distance: 0, deliveryId: delivery.id });
    }
  }

  return { success: true, legs: allLegs };
}

export function routeToPath(points) {
  if (!points || points.length === 0) return "";
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
}

export function getVehicleRoutePoints(vehicle) {
  if (!vehicle.remainingLegs || vehicle.remainingLegs.length === 0) return [];
  const pts = [vehicle.position];
  vehicle.remainingLegs.forEach((leg) => {
    const p = pointById[leg.toNode];
    if (p) pts.push(p);
  });
  return pts;
}

// ---------------------------------------------------------------------------
// Timestamp helper for logs
// ---------------------------------------------------------------------------
function ts() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  return `[${h}:${m}:${s}]`;
}

// ---------------------------------------------------------------------------
// Initial simulation creation
// ---------------------------------------------------------------------------
export function createInitialSimulation() {
  const warehousePoint = pointById[MAP_DATA.warehouse.id];

  // Global cost-function assignment
  const { vehicles: assignedVehicles, deliveries: assignedDeliveries, assignmentLog } = globalOptimize(
    MAP_DATA.vehicles,
    MAP_DATA.deliveries,
    new Set(),
    graph
  );

  const routedVehicles = assignedVehicles.map((v) => {
    const pendingDeliveries = v.assignedDeliveryIds
      .map((id) => assignedDeliveries.find((d) => d.id === id))
      .filter(Boolean);

    const routeResult = buildRouteForStops(MAP_DATA.warehouse.id, pendingDeliveries, new Set());

    return {
      ...v,
      position: { ...warehousePoint },
      currentNodeId: MAP_DATA.warehouse.id,
      remainingLegs: routeResult.success ? routeResult.legs : [],
      legProgress: 0,
      completedDeliveryIds: [],
      fuelUsed: 0,
      status: v.assignedDeliveryIds.length > 0 ? (routeResult.success ? "READY" : "NO ROUTE") : "IDLE",
      noRouteReason: routeResult.success ? null : "No initial route",
      currentDecision: "Awaiting dispatch",
    };
  });

  const initLogs = [
    { id: "INIT-1", text: `${ts()} FLEET OPTIMIZER INITIALIZED`, tone: "cyan" },
    { id: "INIT-2", text: `${ts()} 3 VEHICLES STAGED AT HUB`, tone: "slate" },
    { id: "INIT-3", text: `${ts()} 7 DELIVERIES GLOBALLY OPTIMIZED`, tone: "emerald" },
    ...assignmentLog.slice(0, 5).map((e, i) => ({
      id: `ASSIGN-${i}`,
      text: `${ts()} ${e.deliveryId} ? ${e.vehicleId || "UNASSIGNED"}`,
      tone: e.vehicleId ? "slate" : "amber",
    })),
  ];

  return {
    vehicles: routedVehicles,
    deliveries: assignedDeliveries,
    blockedRoadIds: [],
    running: false,
    elapsedSeconds: 0,
    speedMultiplier: 1,
    logs: initLogs,
    metrics: {
      totalReroutes: 0,
      criticalOnTime: 0,
      criticalTotal: assignedDeliveries.filter((d) => d.priority === "CRITICAL").length,
      completedCount: 0,
      activeVehicles: 3,
      optimizationScore: 100,
      beforeSnapshot: null,
      afterSnapshot: null,
    },
  };
}

// ---------------------------------------------------------------------------
// Authoritative simulation tick
// ---------------------------------------------------------------------------
export function stepSimulation(current, deltaSeconds = 0.12) {
  if (!current.running) return current;

  const speed = current.speedMultiplier || 1;
  const effectiveDelta = deltaSeconds * speed;
  const blockedSet = new Set(current.blockedRoadIds);

  const completedDeliveryIdsThisTick = [];
  const newlyGeneratedLogs = [];
  let newReroutes = 0;

  const nextVehicles = current.vehicles.map((vehicle) => {
    // Stopped states
    if (vehicle.status === "DISABLED" || vehicle.status === "COMPLETE" || vehicle.status === "WAITING") {
      return vehicle;
    }

    // No legs remaining — check if done or needs route
    if (!vehicle.remainingLegs || vehicle.remainingLegs.length === 0) {
      if (vehicle.assignedDeliveryIds.length === 0) {
        return { ...vehicle, status: "COMPLETE", currentDecision: "All deliveries completed" };
      }
      const pendingDeliveries = vehicle.assignedDeliveryIds
        .map((id) => current.deliveries.find((d) => d.id === id))
        .filter(Boolean);
      const safeNode = findNearestNode(vehicle.position);
      const routeRes = buildRouteForStops(safeNode, pendingDeliveries, blockedSet);
      if (!routeRes.success) {
        return {
          ...vehicle,
          status: "WAITING",
          noRouteReason: "Cannot reach assigned destination",
          currentDecision: "Waiting: all routes blocked",
        };
      }
      vehicle = {
        ...vehicle,
        remainingLegs: routeRes.legs,
        legProgress: 0,
        status: "MOVING",
        currentDecision: "Resuming route",
      };
    }

    let distanceToMove = vehicle.speed * effectiveDelta;
    let legs = [...vehicle.remainingLegs];
    let legProgress = vehicle.legProgress;
    let currentPos = { ...vehicle.position };
    let fuelUsed = vehicle.fuelUsed + distanceToMove * (vehicle.fuelRate || 0.02);
    let currentNodeId = vehicle.currentNodeId;
    let decision = vehicle.currentDecision || "Moving on route";

    while (distanceToMove > 0 && legs.length > 0) {
      const currentLeg = legs[0];

      // Pre-entry blocked edge check (Constraints 2 & 3)
      if (currentLeg.roadId && blockedSet.has(currentLeg.roadId)) {
        const safeNode = findNearestNode(currentPos);
        const pendingDeliveries = vehicle.assignedDeliveryIds
          .filter((id) => !completedDeliveryIdsThisTick.includes(id))
          .map((id) => current.deliveries.find((d) => d.id === id))
          .filter(Boolean);

        const rerouteRes = buildRouteForStops(safeNode, pendingDeliveries, blockedSet);
        newReroutes += 1;

        if (rerouteRes.success && rerouteRes.legs.length > 0) {
          legs = rerouteRes.legs;
          legProgress = 0;
          decision = `Rerouted: ${currentLeg.roadId} blocked`;
          newlyGeneratedLogs.push({
            id: `REROUTE-${vehicle.id}-${Date.now()}`,
            text: `${ts()} ${vehicle.id} REROUTED (${currentLeg.roadId})`,
            tone: "cyan",
          });
          break;
        } else {
          newlyGeneratedLogs.push({
            id: `NOROUTE-${vehicle.id}-${Date.now()}`,
            text: `${ts()} ${vehicle.id} WAITING: no valid path`,
            tone: "amber",
          });
          return {
            ...vehicle,
            position: currentPos,
            remainingLegs: [],
            legProgress: 0,
            status: "WAITING",
            noRouteReason: `Road ${currentLeg.roadId} blocked, no alternative`,
            currentDecision: `Waiting: ${currentLeg.roadId} blocked`,
            fuelUsed,
          };
        }
      }

      const legDistance = currentLeg.distance;
      const legRemaining = legDistance - legProgress;

      if (distanceToMove < legRemaining) {
        legProgress += distanceToMove;
        distanceToMove = 0;
        const fromP = pointById[currentLeg.fromNode];
        const toP = pointById[currentLeg.toNode];
        const ratio = legDistance === 0 ? 1 : legProgress / legDistance;
        currentPos = { x: fromP.x + (toP.x - fromP.x) * ratio, y: fromP.y + (toP.y - fromP.y) * ratio };
        decision = `En route to ${locationByNodeId[currentLeg.toNode]?.label || currentLeg.toNode}`;
      } else {
        distanceToMove -= legRemaining;
        legProgress = 0;
        currentNodeId = currentLeg.toNode;
        currentPos = { ...pointById[currentLeg.toNode] };

        if (currentLeg.deliveryId) {
          completedDeliveryIdsThisTick.push(currentLeg.deliveryId);
          const delivInfo = current.deliveries.find((d) => d.id === currentLeg.deliveryId);
          newlyGeneratedLogs.push({
            id: `DELIV-${currentLeg.deliveryId}-${Date.now()}`,
            text: `${ts()} ${currentLeg.deliveryId} DELIVERED by ${vehicle.id}`,
            tone: delivInfo?.priority === "CRITICAL" ? "amber" : "emerald",
          });
          decision = `Delivered ${currentLeg.deliveryId}`;
        }

        legs.shift();
      }
    }

    const nextAssignedIds = vehicle.assignedDeliveryIds.filter(
      (id) => !completedDeliveryIdsThisTick.includes(id)
    );
    const isDone = nextAssignedIds.length === 0 && legs.length === 0;

    return {
      ...vehicle,
      position: currentPos,
      currentNodeId,
      remainingLegs: legs,
      legProgress,
      assignedDeliveryIds: nextAssignedIds,
      completedDeliveryIds: [
        ...vehicle.completedDeliveryIds,
        ...completedDeliveryIdsThisTick.filter((id) => vehicle.assignedDeliveryIds.includes(id)),
      ],
      status: isDone ? "COMPLETE" : "MOVING",
      fuelUsed,
      currentDecision: decision,
    };
  });

  // Update delivery statuses
  const nextDeliveries = current.deliveries.map((delivery) => {
    if (delivery.status === "COMPLETED" || completedDeliveryIdsThisTick.includes(delivery.id)) {
      return { ...delivery, status: "COMPLETED" };
    }
    if (delivery.status === "UNREACHABLE") return delivery;
    const assignedV = nextVehicles.find((v) => v.id === delivery.assignedVehicleId);
    if (!assignedV || assignedV.status === "DISABLED") {
      return { ...delivery, status: "QUEUED" };
    }
    return {
      ...delivery,
      status: assignedV.status === "MOVING" ? "IN TRANSIT" : "QUEUED",
    };
  });

  const allComplete = nextDeliveries
    .filter((d) => d.status !== "UNREACHABLE")
    .every((d) => d.status === "COMPLETED");

  // Compute updated metrics
  const completedCount = nextDeliveries.filter((d) => d.status === "COMPLETED").length;
  const criticalCompleted = nextDeliveries.filter(
    (d) => d.status === "COMPLETED" && d.priority === "CRITICAL"
  ).length;

  const prevMetrics = current.metrics || {};
  const newTotalReroutes = (prevMetrics.totalReroutes || 0) + newReroutes;
  const criticalTotal = prevMetrics.criticalTotal || 0;
  const optimizationScore = computeOptimizationScore(newTotalReroutes, criticalCompleted, criticalTotal);

  const nextMetrics = {
    ...prevMetrics,
    totalReroutes: newTotalReroutes,
    criticalOnTime: criticalCompleted,
    completedCount,
    activeVehicles: nextVehicles.filter((v) => v.status !== "DISABLED").length,
    optimizationScore,
    afterSnapshot: allComplete
      ? {
          completedCount,
          blockedRoads: current.blockedRoadIds.length,
          reroutes: newTotalReroutes,
          optimizationScore,
          timestamp: ts(),
        }
      : prevMetrics.afterSnapshot,
  };

  return {
    ...current,
    vehicles: nextVehicles,
    deliveries: nextDeliveries,
    elapsedSeconds: current.elapsedSeconds + effectiveDelta,
    running: allComplete ? false : current.running,
    logs: [...newlyGeneratedLogs, ...current.logs].slice(0, 50),
    metrics: nextMetrics,
  };
}

// ---------------------------------------------------------------------------
// Selection details helper (used by DispatcherLogs and VehicleTooltip)
// ---------------------------------------------------------------------------
export function getSelectionDetails(selectedItem, simulation) {
  if (!selectedItem) return null;

  if (selectedItem.type === "vehicle") {
    const vehicle = simulation.vehicles.find((v) => v.id === selectedItem.id);
    if (!vehicle) return null;
    const specs = VEHICLE_TYPES[vehicle.type] || {};
    const fuelCapacity = vehicle.fuel || specs.fuel || 100;
    const fuelRemaining = Math.max(0, fuelCapacity - (vehicle.fuelUsed || 0));
    const fuelPct = Math.round((fuelRemaining / fuelCapacity) * 100);
    const etaSec = computeVehicleETA(vehicle);
    const etaMins = Math.floor(etaSec / 60);
    const etaSecs = Math.floor(etaSec % 60);

    return {
      title: `${vehicle.label} (${vehicle.id})`,
      category: "Fleet Vehicle",
      status: vehicle.status,
      badgeColor: vehicle.status === "DISABLED" ? "#ef4444" : vehicle.status === "WAITING" ? "#f59e0b" : vehicle.color,
      specs: [
        { label: "Driver", value: vehicle.driver },
        { label: "Type", value: specs.label || vehicle.type },
        { label: "Status", value: vehicle.status },
        { label: "Pending", value: `${vehicle.assignedDeliveryIds.length} orders` },
        { label: "Load", value: `${vehicle.assignedWeight || 0} / ${vehicle.capacity || specs.capacity || "?"} kg` },
        { label: "Fuel", value: `${fuelPct}% (${fuelRemaining.toFixed(1)} L)` },
        { label: "Speed", value: `${vehicle.speed || specs.speed || "?"} km/h` },
        { label: "ETA", value: etaSec > 0 ? `${String(etaMins).padStart(2,"0")}:${String(etaSecs).padStart(2,"0")}` : "--:--" },
        { label: "Decision", value: vehicle.currentDecision || vehicle.noRouteReason || "Operating normally" },
      ],
      actionTip: vehicle.status === "WAITING" ? "Unblock roads to restore route." : "Use Breakdown to test global reassignment.",
    };
  }

  if (selectedItem.type === "road" || selectedItem.type === "bridge") {
    const road = roadById[selectedItem.id] || MAP_DATA.bridges.find((b) => b.id === selectedItem.id);
    const isBlocked = simulation.blockedRoadIds.includes(selectedItem.id);
    return {
      title: road?.label || `Corridor ${selectedItem.id}`,
      category: `${(road?.type || "CORRIDOR").toUpperCase()} SEGMENT`,
      status: isBlocked ? "BLOCKED / CLOSED" : "OPEN / CLEAR",
      badgeColor: isBlocked ? "#ef4444" : "#38bdf8",
      specs: [
        { label: "ID", value: selectedItem.id },
        { label: "Type", value: road?.type || "arterial" },
        { label: "From", value: road?.from || road?.fromNode || "Junction" },
        { label: "To", value: road?.to || road?.toNode || "Junction" },
        { label: "Status", value: isBlocked ? "CLOSED" : "OPEN" },
      ],
      actionTip: isBlocked ? "Click road again to unblock." : "Click road on map to block it.",
    };
  }

  if (selectedItem.type === "location") {
    const loc = MAP_DATA.locations.find((l) => l.id === selectedItem.id);
    const delivery = simulation.deliveries.find((d) => d.locationId === selectedItem.id);
    return {
      title: loc?.label || selectedItem.id,
      category: loc?.type === "store" ? "Store Pickup Point" : "Customer Location",
      status: delivery ? delivery.status : "STANDBY",
      badgeColor: loc?.type === "store" ? "#facc15" : "#38bdf8",
      specs: [
        { label: "Location ID", value: selectedItem.id },
        { label: "Cluster", value: loc?.clusterId },
        { label: "Order", value: delivery ? delivery.id : "None" },
        { label: "Priority", value: delivery?.priority || "N/A" },
        { label: "Carrier", value: delivery?.assignedVehicleId || "Unassigned" },
      ],
      actionTip: "Use Emergency or Move Delivery to target this drop-off.",
    };
  }

  return null;
}
