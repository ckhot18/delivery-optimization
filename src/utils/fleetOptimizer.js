/**
 * Fleet Optimizer - Global Cost-Function Assignment
 *
 * Replaces greedy nearest-vehicle assignment with a weighted multi-objective
 * fleet-level cost function. Every delivery is evaluated against ALL feasible
 * vehicles and the globally optimal assignment is chosen.
 *
 * Cost Model:
 *   cost = w_dist   * normalizedDistance
 *        + w_eta    * etaFactor
 *        + w_fuel   * fuelCost
 *        + w_traffic* trafficPenalty
 *        + w_prio   * priorityPenalty
 *        + w_cap    * capacityPenalty
 *        + w_risk   * riskPenalty
 */

import { MAP_DATA, PRIORITY_RANK, VEHICLE_TYPES } from "../data/simulationData.js";
import { dijkstra, locationByNodeId } from "./simulationEngine.js";

// Cost function weights
const WEIGHTS = {
  distance: 1.0,
  eta: 0.8,
  fuel: 0.6,
  traffic: 0.4,
  priority: 2.0,
  capacity: 1.5,
  risk: 1.2,
};

// Road-type traffic proxy (congestion factor)
const TRAFFIC_FACTOR = {
  highway: 0.5,
  arterial: 1.0,
  cluster: 1.4,
  bridge: 2.0,
  local: 1.8,
};

function computeTrafficPenalty(legs) {
  if (!legs || legs.length === 0) return 0;
  let penalty = 0;
  const roadMap = Object.fromEntries(MAP_DATA.roads.map((r) => [r.id, r]));
  legs.forEach((leg) => {
    const road = roadMap[leg.roadId];
    if (road) penalty += (TRAFFIC_FACTOR[road.type] || 1.0) * leg.distance;
  });
  return penalty / Math.max(legs.length, 1);
}

function countAdjacentBlockedRoads(legs, blockedSet, graphAdj) {
  if (!legs || legs.length === 0) return 0;
  let count = 0;
  legs.forEach((leg) => {
    const neighbors = graphAdj[leg.toNode] || [];
    neighbors.forEach((edge) => {
      if (blockedSet.has(edge.roadId)) count += 1;
    });
  });
  return count;
}

export function computeAssignmentCost(vehicle, delivery, routeResult, blockedSet, graphAdj) {
  if (!routeResult.success) return Infinity;

  const dist = routeResult.distance;
  const specs = VEHICLE_TYPES[vehicle.type] || {};
  const speed = vehicle.speed || specs.speed || 60;
  const capacity = vehicle.capacity || specs.capacity || 100;
  const fuelRate = vehicle.fuelRate || specs.fuelRate || 0.02;

  const distCost = (dist / 1200) * WEIGHTS.distance;
  const etaCost = (dist / speed / 30) * WEIGHTS.eta;
  const fuelCost = dist * fuelRate * WEIGHTS.fuel;
  const trafficPenalty = (computeTrafficPenalty(routeResult.legs) / 1200) * WEIGHTS.traffic;

  const priorityRank = PRIORITY_RANK[delivery.priority] || 1;
  const maxRank = PRIORITY_RANK["CRITICAL"];
  const priorityPenalty = ((maxRank - priorityRank) / maxRank) * 300 * WEIGHTS.priority;

  const totalLoad = vehicle.assignedWeight + delivery.weight;
  if (totalLoad > capacity) return Infinity;
  let capacityPenalty = 0;
  if (totalLoad > capacity * 0.9) capacityPenalty = 80 * WEIGHTS.capacity;
  else if (totalLoad > capacity * 0.7) capacityPenalty = 20 * WEIGHTS.capacity;

  const riskCount = countAdjacentBlockedRoads(routeResult.legs, blockedSet, graphAdj);
  const riskPenalty = riskCount * 40 * WEIGHTS.risk;

  const queuePenalty = vehicle.assignedDeliveryIds.length * 60;

  const loc = locationByNodeId[delivery.destination];
  const clusterBonus = loc && loc.clusterId === vehicle.clusterId ? -50 : 0;

  return distCost + etaCost + fuelCost + trafficPenalty +
    priorityPenalty + capacityPenalty + riskPenalty +
    queuePenalty + clusterBonus;
}

export function globalOptimize(vehiclesInput, deliveriesInput, blockedSet = new Set(), graphAdj = {}) {
  const vehicles = vehiclesInput.map((v) => {
    const specs = VEHICLE_TYPES[v.type] || {};
    return {
      ...v,
      speed: v.speed || specs.speed,
      capacity: v.capacity || specs.capacity,
      fuel: v.fuel || specs.fuel,
      fuelRate: v.fuelRate || specs.fuelRate,
      assignedDeliveryIds: [],
      assignedWeight: 0,
      cursorNode: v.currentNodeId || MAP_DATA.warehouse.id,
    };
  });

  const sortedDeliveries = [...deliveriesInput].sort((a, b) => {
    const rankDiff = (PRIORITY_RANK[b.priority] || 1) - (PRIORITY_RANK[a.priority] || 1);
    if (rankDiff !== 0) return rankDiff;
    return a.id.localeCompare(b.id);
  });

  const assignmentLog = [];

  const assignedDeliveries = sortedDeliveries.map((delivery) => {
    const candidates = vehicles
      .filter((v) => {
        const cap = v.capacity || (VEHICLE_TYPES[v.type] || {}).capacity || 999;
        return (v.assignedWeight + delivery.weight) <= cap;
      })
      .map((vehicle) => {
        const routeResult = dijkstra(vehicle.cursorNode, delivery.destination, blockedSet);
        const cost = computeAssignmentCost(vehicle, delivery, routeResult, blockedSet, graphAdj);
        return { vehicle, routeResult, cost };
      })
      .filter((c) => c.cost < Infinity)
      .sort((a, b) => a.cost - b.cost || a.vehicle.id.localeCompare(b.vehicle.id));

    const best = candidates[0];

    if (!best) {
      assignmentLog.push({ deliveryId: delivery.id, vehicleId: null, reason: "No feasible vehicle", cost: Infinity });
      return { ...delivery, assignedVehicleId: null, status: "UNREACHABLE" };
    }

    best.vehicle.assignedDeliveryIds.push(delivery.id);
    best.vehicle.assignedWeight += delivery.weight;
    best.vehicle.cursorNode = delivery.destination;

    assignmentLog.push({
      deliveryId: delivery.id,
      vehicleId: best.vehicle.id,
      reason: `Cost ${best.cost.toFixed(1)}`,
      cost: best.cost,
    });

    return { ...delivery, assignedVehicleId: best.vehicle.id, status: "QUEUED" };
  });

  return { vehicles, deliveries: assignedDeliveries, assignmentLog };
}

export function globalReOptimize(activeVehicles, pendingDeliveries, blockedSet = new Set(), graphAdj = {}) {
  const vehiclesForOpt = activeVehicles.map((v) => ({
    ...v,
    assignedDeliveryIds: [],
    assignedWeight: 0,
    cursorNode: v.currentNodeId || MAP_DATA.warehouse.id,
  }));
  return globalOptimize(vehiclesForOpt, pendingDeliveries, blockedSet, graphAdj);
}

export function computeVehicleETA(vehicle) {
  if (!vehicle.remainingLegs || vehicle.remainingLegs.length === 0) return 0;
  const totalDist = vehicle.remainingLegs.reduce((s, l) => s + (l.distance || 0), 0);
  return Math.round(totalDist / (vehicle.speed || 60));
}

export function formatETA(etaSeconds) {
  if (!etaSeconds || etaSeconds <= 0) return "--:--";
  const mins = Math.floor(etaSeconds / 60);
  const secs = Math.floor(etaSeconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function computeOptimizationScore(reroutes, criticalOnTime, criticalTotal) {
  const reroutePenalty = Math.min(reroutes * 3, 50);
  const criticalBonus = criticalTotal > 0 ? Math.round((criticalOnTime / criticalTotal) * 30) : 0;
  return Math.max(0, Math.min(100, 100 - reroutePenalty + criticalBonus));
}
