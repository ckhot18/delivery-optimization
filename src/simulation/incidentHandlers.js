/**
 * Incident Handlers - Phase 4
 *
 * Authoritative incident response functions.
 * All handlers:
 *   1. Update blocked/unblocked state
 *   2. Validate/reroute every affected vehicle
 *   3. Run global re-optimization where required
 *   4. Emit concise timestamped logs
 *   5. Never stop the simulation - running continues
 */

import { MAP_DATA } from "../data/simulationData.js";
import { findNearestNode, buildRouteForStops, graph } from "../utils/simulationEngine.js";
import { globalReOptimize, globalOptimize } from "../utils/fleetOptimizer.js";
import { validateRoute, rebuildRoute, evaluateReroute } from "../utils/routeValidator.js";

function ts() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  return `[${h}:${m}:${s}]`;
}

function log(text, tone = "slate") {
  return { id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text: `${ts()} ${text}`, tone };
}

function takeSnapshot(simulation) {
  return {
    completedCount: simulation.deliveries.filter((d) => d.status === "COMPLETED").length,
    blockedRoads: simulation.blockedRoadIds.length,
    activeVehicles: simulation.vehicles.filter((v) => v.status !== "DISABLED").length,
    reroutes: simulation.metrics?.totalReroutes || 0,
    optimizationScore: simulation.metrics?.optimizationScore || 100,
    timestamp: ts(),
  };
}

/**
 * BLOCK ROAD
 * Blocks a specific road. Updates graph, reroutes all affected vehicles.
 * Marks unreachable deliveries as UNREACHABLE (Edge Case A + B).
 */
export function handleBlockRoad(simulation, targetRoadId) {
  const candidateRoads = ["ROAD-BR-N", "RW-02", "RA-07", "ROAD-BR-S", "RE-02"];
  const roadId = targetRoadId || candidateRoads.find((r) => !simulation.blockedRoadIds.includes(r)) || candidateRoads[0];

  if (simulation.blockedRoadIds.includes(roadId)) {
    // Already blocked - delegate to unblock handler
    return handleUnblockRoad(simulation, roadId);
  }

  const newBlockedIds = [...simulation.blockedRoadIds, roadId];
  const blockedSet = new Set(newBlockedIds);
  const logsToAdd = [log(`${roadId} BLOCKED`, "amber")];
  let rerouteCount = 0;

  const nextVehicles = simulation.vehicles.map((vehicle) => {
    if (vehicle.status === "DISABLED" || vehicle.status === "COMPLETE") return vehicle;

    const validation = validateRoute(vehicle, blockedSet);
    if (validation.valid) return vehicle;

    logsToAdd.push(log(`${vehicle.id} ROUTE INVALIDATED`, "amber"));
    logsToAdd.push(log("GLOBAL REOPTIMIZATION", "cyan"));

    const result = rebuildRoute(vehicle, simulation.deliveries, blockedSet);
    rerouteCount += 1;

    if (result.success && result.legs.length > 0) {
      logsToAdd.push(log(`NEW ROUTE DEPLOYED ? ${vehicle.id}`, "emerald"));
      return {
        ...vehicle,
        remainingLegs: result.legs,
        legProgress: 0,
        status: simulation.running ? "MOVING" : "READY",
        noRouteReason: null,
        currentDecision: `Rerouted: ${roadId} blocked`,
      };
    }

    // Edge Case B: Destination unreachable
    logsToAdd.push(log(`${vehicle.id} DESTINATION UNREACHABLE`, "red"));
    return {
      ...vehicle,
      remainingLegs: [],
      legProgress: 0,
      status: "WAITING",
      noRouteReason: `All routes blocked. Waiting for road clearance.`,
      currentDecision: `Waiting: no path through blocked network`,
    };
  });

  // Mark deliveries for vehicles that went WAITING as UNREACHABLE
  const nextDeliveries = simulation.deliveries.map((d) => {
    const assignedV = nextVehicles.find((v) => v.id === d.assignedVehicleId);
    if (assignedV && assignedV.status === "WAITING" && d.status !== "COMPLETED") {
      logsToAdd.push(log(`${d.id} UNREACHABLE`, "red"));
      return { ...d, status: "UNREACHABLE" };
    }
    return d;
  });

  const prevMetrics = simulation.metrics || {};
  const beforeSnapshot = prevMetrics.beforeSnapshot || takeSnapshot(simulation);

  return {
    ...simulation,
    blockedRoadIds: newBlockedIds,
    vehicles: nextVehicles,
    deliveries: nextDeliveries,
    metrics: {
      ...prevMetrics,
      totalReroutes: (prevMetrics.totalReroutes || 0) + rerouteCount,
      beforeSnapshot,
    },
    logs: [...logsToAdd, ...simulation.logs].slice(0, 50),
  };
}

/**
 * UNBLOCK ROAD
 * Reopens road. Evaluates whether each vehicle should switch routes.
 * Only switches if improvement >= 5% (anti-oscillation, Edge Case E).
 * Retries UNREACHABLE deliveries.
 */
export function handleUnblockRoad(simulation, roadId) {
  if (!simulation.blockedRoadIds.includes(roadId)) return simulation;

  const newBlockedIds = simulation.blockedRoadIds.filter((r) => r !== roadId);
  const blockedSet = new Set(newBlockedIds);
  const logsToAdd = [log(`${roadId} REOPENED`, "emerald")];

  const nextVehicles = simulation.vehicles.map((vehicle) => {
    if (vehicle.status === "DISABLED" || vehicle.status === "COMPLETE") return vehicle;

    // Vehicles that were WAITING — try to find a route now
    if (vehicle.status === "WAITING") {
      const result = rebuildRoute(vehicle, simulation.deliveries, blockedSet);
      if (result.success && result.legs.length > 0) {
        logsToAdd.push(log(`${vehicle.id} ROUTE RESTORED`, "emerald"));
        return {
          ...vehicle,
          remainingLegs: result.legs,
          legProgress: 0,
          status: simulation.running ? "MOVING" : "READY",
          noRouteReason: null,
          currentDecision: `Route restored via ${roadId}`,
        };
      }
      return vehicle;
    }

    // Active vehicles — check if new route is meaningfully better (5% threshold)
    const evalResult = evaluateReroute(vehicle, simulation.deliveries, blockedSet);
    if (evalResult.shouldSwitch) {
      logsToAdd.push(log(`${vehicle.id} SWITCHING TO SHORTER ROUTE (+${(evalResult.improvement * 100).toFixed(1)}%)`, "cyan"));
      return {
        ...vehicle,
        remainingLegs: evalResult.newLegs,
        legProgress: 0,
        status: simulation.running ? "MOVING" : "READY",
        noRouteReason: null,
        currentDecision: `Route optimized after ${roadId} reopened`,
      };
    }

    return vehicle;
  });

  // Retry UNREACHABLE deliveries
  const unreachableDeliveries = simulation.deliveries.filter(
    (d) => d.status === "UNREACHABLE"
  );

  let nextDeliveries = [...simulation.deliveries];
  if (unreachableDeliveries.length > 0) {
    logsToAdd.push(log("RETRYING UNREACHABLE DELIVERIES", "cyan"));
    const activeVehicles = nextVehicles.filter((v) => v.status !== "DISABLED" && v.status !== "COMPLETE");
    if (activeVehicles.length > 0) {
      const { deliveries: reassigned } = globalReOptimize(activeVehicles, unreachableDeliveries, blockedSet, graph);
      reassigned.forEach((rd) => {
        if (rd.status === "QUEUED" && rd.assignedVehicleId) {
          logsToAdd.push(log(`${rd.id} ? ${rd.assignedVehicleId}`, "emerald"));
          nextDeliveries = nextDeliveries.map((d) => (d.id === rd.id ? rd : d));
        }
      });
    }
  }

  return {
    ...simulation,
    blockedRoadIds: newBlockedIds,
    vehicles: nextVehicles,
    deliveries: nextDeliveries,
    logs: [...logsToAdd, ...simulation.logs].slice(0, 50),
  };
}

/**
 * VEHICLE BREAKDOWN
 * Disables vehicle, returns all unfinished deliveries to pool.
 * Runs full global re-optimization across remaining vehicles. (Edge Case C)
 */
export function handleVehicleBreakdown(simulation, targetVehicleId) {
  const vehicleToDisable = simulation.vehicles.find(
    (v) => targetVehicleId
      ? v.id === targetVehicleId
      : (v.status !== "DISABLED" && v.status !== "COMPLETE")
  );

  if (!vehicleToDisable) return simulation;

  const returnedIds = [...vehicleToDisable.assignedDeliveryIds];
  const blockedSet = new Set(simulation.blockedRoadIds);

  const logsToAdd = [
    log(`${vehicleToDisable.id} BREAKDOWN`, "red"),
    log(`${returnedIds.length} deliveries returned to pool`, "amber"),
    log("GLOBAL REOPTIMIZATION", "cyan"),
  ];

  // First pass: disable the vehicle
  const disabledVehicle = {
    ...vehicleToDisable,
    status: "DISABLED",
    remainingLegs: [],
    legProgress: 0,
    assignedDeliveryIds: [],
    noRouteReason: "Vehicle disabled: mechanical breakdown",
    currentDecision: "Vehicle offline",
  };

  // Active vehicles (excluding the broken one)
  const activeVehicles = simulation.vehicles
    .filter((v) => v.id !== vehicleToDisable.id && v.status !== "DISABLED" && v.status !== "COMPLETE")
    .map((v) => ({ ...v }));

  // Pending deliveries that need redistribution
  const pendingDeliveries = simulation.deliveries.filter(
    (d) => returnedIds.includes(d.id) && d.status !== "COMPLETED"
  );

  let nextDeliveries = [...simulation.deliveries];
  let nextVehicles = simulation.vehicles.map((v) => (v.id === vehicleToDisable.id ? disabledVehicle : v));

  if (activeVehicles.length > 0 && pendingDeliveries.length > 0) {
    const { vehicles: reoptVehicles, deliveries: reoptDeliveries, assignmentLog } = globalReOptimize(
      activeVehicles,
      pendingDeliveries,
      blockedSet,
      graph
    );

    // Log each reassignment
    assignmentLog.forEach((entry) => {
      if (entry.vehicleId) {
        logsToAdd.push(log(`${entry.deliveryId} ? ${entry.vehicleId}`, "emerald"));
      } else {
        logsToAdd.push(log(`${entry.deliveryId} UNREACHABLE (no route)`, "red"));
      }
    });

    // Apply new assignments — rebuild routes for receiving vehicles
    reoptVehicles.forEach((rv) => {
      if (rv.assignedDeliveryIds.length === 0) return;
      const currentV = nextVehicles.find((v) => v.id === rv.id);
      if (!currentV) return;

      const combinedIds = [
        ...currentV.assignedDeliveryIds.filter((id) => !returnedIds.includes(id)),
        ...rv.assignedDeliveryIds,
      ];

      const combinedDeliveries = combinedIds
        .map((id) => {
          const updated = reoptDeliveries.find((d) => d.id === id) || nextDeliveries.find((d) => d.id === id);
          return updated;
        })
        .filter(Boolean);

      const safeNode = findNearestNode(currentV.position);
      const routeRes = buildRouteForStops(safeNode, combinedDeliveries, blockedSet);

      nextVehicles = nextVehicles.map((v) => {
        if (v.id !== rv.id) return v;
        if (routeRes.success) {
          logsToAdd.push(log(`NEW ROUTE DEPLOYED ? ${v.id}`, "emerald"));
          return {
            ...v,
            assignedDeliveryIds: combinedIds,
            remainingLegs: routeRes.legs,
            legProgress: 0,
            status: simulation.running ? "MOVING" : "READY",
            noRouteReason: null,
            currentDecision: `Took over deliveries from ${vehicleToDisable.id}`,
          };
        }
        return {
          ...v,
          assignedDeliveryIds: combinedIds,
          status: "WAITING",
          noRouteReason: "Cannot reach reassigned destinations",
          currentDecision: "Waiting: routes blocked",
        };
      });

      // Update delivery assignments
      rv.assignedDeliveryIds.forEach((id) => {
        nextDeliveries = nextDeliveries.map((d) =>
          d.id === id ? { ...d, assignedVehicleId: rv.id, status: "QUEUED" } : d
        );
      });
    });

    // Mark unassigned deliveries as UNREACHABLE
    reoptDeliveries.filter((d) => !d.assignedVehicleId).forEach((d) => {
      nextDeliveries = nextDeliveries.map((nd) =>
        nd.id === d.id ? { ...nd, status: "UNREACHABLE" } : nd
      );
    });
  }

  const prevMetrics = simulation.metrics || {};
  const beforeSnapshot = prevMetrics.beforeSnapshot || takeSnapshot(simulation);

  return {
    ...simulation,
    vehicles: nextVehicles,
    deliveries: nextDeliveries,
    metrics: { ...prevMetrics, beforeSnapshot, activeVehicles: activeVehicles.length },
    logs: [...logsToAdd, ...simulation.logs].slice(0, 50),
  };
}

/**
 * EMERGENCY DELIVERY
 * Injects a CRITICAL delivery. Runs global optimizer to assign it
 * (not just nearest vehicle - Edge Case D).
 */
export function handleEmergencyDelivery(simulation, targetLocationId) {
  const targetLoc =
    MAP_DATA.locations.find((l) => targetLocationId ? l.id === targetLocationId : l.id === "LOC-A1") ||
    MAP_DATA.locations[0];

  const newDeliveryId = `SOS-${Date.now().toString().slice(-4)}`;
  const emergencyOrder = {
    id: newDeliveryId,
    destination: targetLoc.nodeId,
    locationId: targetLoc.id,
    weight: 10,
    priority: "CRITICAL",
    title: "Critical Emergency Supply",
    recipient: `${targetLoc.label} (Emergency Drop)`,
    status: "QUEUED",
    assignedVehicleId: null,
  };

  const blockedSet = new Set(simulation.blockedRoadIds);
  const activeVehicles = simulation.vehicles.filter(
    (v) => v.status !== "DISABLED" && v.status !== "COMPLETE"
  );

  const logsToAdd = [
    log("CRITICAL DELIVERY DETECTED", "red"),
    log("GLOBAL REOPTIMIZATION", "cyan"),
  ];

  if (activeVehicles.length === 0) return simulation;

  // Use global optimizer (not nearest vehicle) to assign CRITICAL order
  const { deliveries: [assigned] } = globalOptimize(
    activeVehicles,
    [emergencyOrder],
    blockedSet,
    graph
  );

  const selectedVehicleId = assigned.assignedVehicleId;

  if (!selectedVehicleId) {
    logsToAdd.push(log(`${newDeliveryId} UNREACHABLE (all paths blocked)`, "red"));
    return {
      ...simulation,
      deliveries: [{ ...emergencyOrder, status: "UNREACHABLE" }, ...simulation.deliveries],
      logs: [...logsToAdd, ...simulation.logs].slice(0, 50),
    };
  }

  logsToAdd.push(log(`${newDeliveryId} ? ${selectedVehicleId}`, "emerald"));

  const nextDeliveries = [{ ...emergencyOrder, assignedVehicleId: selectedVehicleId }, ...simulation.deliveries];

  const nextVehicles = simulation.vehicles.map((v) => {
    if (v.id !== selectedVehicleId) return v;

    // Prepend emergency delivery to the vehicle's queue
    const reorderedIds = [newDeliveryId, ...v.assignedDeliveryIds];
    const pendingDeliveries = reorderedIds
      .map((id) => nextDeliveries.find((d) => d.id === id))
      .filter(Boolean);

    const safeNode = findNearestNode(v.position);
    const routeRes = buildRouteForStops(safeNode, pendingDeliveries, blockedSet);

    if (routeRes.success) {
      logsToAdd.push(log("NEW ROUTE DEPLOYED", "emerald"));
      return {
        ...v,
        assignedDeliveryIds: reorderedIds,
        remainingLegs: routeRes.legs,
        legProgress: 0,
        status: simulation.running ? "MOVING" : "READY",
        noRouteReason: null,
        currentDecision: `Emergency pickup at ${targetLoc.label}`,
      };
    }

    logsToAdd.push(log(`${v.id} NO ROUTE to emergency location`, "amber"));
    return {
      ...v,
      assignedDeliveryIds: reorderedIds,
      status: "WAITING",
      noRouteReason: "Roads to emergency location blocked",
      currentDecision: "Waiting: emergency route blocked",
    };
  });

  const prevMetrics = simulation.metrics || {};
  const beforeSnapshot = prevMetrics.beforeSnapshot || takeSnapshot(simulation);

  return {
    ...simulation,
    vehicles: nextVehicles,
    deliveries: nextDeliveries,
    metrics: {
      ...prevMetrics,
      beforeSnapshot,
      criticalTotal: (prevMetrics.criticalTotal || 0) + 1,
    },
    logs: [...logsToAdd, ...simulation.logs].slice(0, 50),
  };
}

/**
 * MOVE DELIVERY LOCATION
 * Relocates a pending delivery and recalculates the assigned vehicle route.
 */
export function handleMoveDelivery(simulation, targetDeliveryId) {
  const delivery = simulation.deliveries.find(
    (d) => targetDeliveryId ? d.id === targetDeliveryId : (d.status !== "COMPLETED" && d.status !== "UNREACHABLE")
  );

  if (!delivery) return simulation;

  const alternateDestinations = ["B_R1_C2", "D_R2_C3", "A_R2_C2", "C_R1_C2"];
  const newDestNode = alternateDestinations.find((n) => n !== delivery.destination) || "B_R1_C2";
  const newLoc = MAP_DATA.locations.find((l) => l.nodeId === newDestNode);

  const updatedDelivery = {
    ...delivery,
    destination: newDestNode,
    locationId: newLoc ? newLoc.id : delivery.locationId,
    recipient: newLoc ? `${newLoc.label} (Rerouted)` : delivery.recipient,
  };

  const nextDeliveries = simulation.deliveries.map((d) => (d.id === delivery.id ? updatedDelivery : d));
  const assignedVehicle = simulation.vehicles.find((v) => v.id === delivery.assignedVehicleId);
  const blockedSet = new Set(simulation.blockedRoadIds);

  const logsToAdd = [
    log(`${delivery.id} DESTINATION MOVED`, "amber"),
  ];

  if (!assignedVehicle) {
    return { ...simulation, deliveries: nextDeliveries, logs: [...logsToAdd, ...simulation.logs].slice(0, 50) };
  }

  logsToAdd.push(log(`RECALCULATING ROUTE ? ${assignedVehicle.id}`, "cyan"));

  const nextVehicles = simulation.vehicles.map((v) => {
    if (v.id !== assignedVehicle.id) return v;

    const pendingDeliveries = v.assignedDeliveryIds
      .map((id) => nextDeliveries.find((d) => d.id === id))
      .filter(Boolean);

    const safeNode = findNearestNode(v.position);
    const routeRes = buildRouteForStops(safeNode, pendingDeliveries, blockedSet);

    if (routeRes.success) {
      logsToAdd.push(log("NEW ROUTE DEPLOYED", "emerald"));
      return {
        ...v,
        remainingLegs: routeRes.legs,
        legProgress: 0,
        status: simulation.running ? "MOVING" : "READY",
        noRouteReason: null,
        currentDecision: `Delivery ${delivery.id} relocated to ${newLoc?.label || newDestNode}`,
      };
    }

    logsToAdd.push(log(`${v.id} NO ROUTE to new location`, "amber"));
    return {
      ...v,
      status: "WAITING",
      noRouteReason: "Cannot reach relocated destination",
      currentDecision: "Waiting: relocated destination unreachable",
    };
  });

  return {
    ...simulation,
    vehicles: nextVehicles,
    deliveries: nextDeliveries,
    logs: [...logsToAdd, ...simulation.logs].slice(0, 50),
  };
}
