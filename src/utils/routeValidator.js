/**
 * Route Validator
 *
 * Authoritative edge validation + safe reroute helper.
 * Called at every tick and by every incident handler.
 * Implements anti-oscillation logic for road unblock events.
 */

import { buildRouteForStops, findNearestNode } from "./simulationEngine.js";

// Minimum improvement ratio before switching routes on road unblock (anti-oscillation)
const MIN_IMPROVEMENT_RATIO = 0.05;

/**
 * Validate a vehicle's current remaining legs against the blocked set.
 * Returns { valid: true } if all edges are clear.
 * Returns { valid: false, reason } if any blocked edge is found.
 */
export function validateRoute(vehicle, blockedSet) {
  if (!vehicle.remainingLegs || vehicle.remainingLegs.length === 0) {
    return { valid: true };
  }
  const blockedLeg = vehicle.remainingLegs.find(
    (leg) => leg.roadId && blockedSet.has(leg.roadId)
  );
  if (blockedLeg) {
    return { valid: false, reason: `Road ${blockedLeg.roadId} on route is blocked` };
  }
  return { valid: true };
}

/**
 * Rebuild route for a vehicle from its current position.
 * Returns the new leg array on success or null on failure.
 *
 * @param {object}   vehicle          - Current vehicle state
 * @param {object[]} allDeliveries    - Full delivery list (for lookup)
 * @param {Set}      blockedSet       - Blocked road IDs
 * @returns {{ success, legs, reason }}
 */
export function rebuildRoute(vehicle, allDeliveries, blockedSet) {
  const pendingDeliveries = vehicle.assignedDeliveryIds
    .map((id) => allDeliveries.find((d) => d.id === id))
    .filter(Boolean)
    .filter((d) => d.status !== "COMPLETED");

  if (pendingDeliveries.length === 0) {
    return { success: true, legs: [], reason: "No pending deliveries" };
  }

  const safeNode = findNearestNode(vehicle.position);
  const result = buildRouteForStops(safeNode, pendingDeliveries, blockedSet);

  if (result.success) {
    return { success: true, legs: result.legs, reason: null };
  }

  return {
    success: false,
    legs: [],
    reason: `Cannot reach destination(s) from ${safeNode}`,
  };
}

/**
 * Evaluate whether a vehicle should switch to a newly available route
 * after a road unblock event.
 *
 * Only recommends switching if improvement is >= MIN_IMPROVEMENT_RATIO (5%).
 * Prevents route oscillation when two routes are nearly equivalent.
 *
 * @param {object}   vehicle       - Current vehicle state
 * @param {object[]} allDeliveries - Full delivery list
 * @param {Set}      blockedSet    - Updated blocked road set (road already removed)
 * @returns {{ shouldSwitch: boolean, newLegs: array|null, improvement: number }}
 */
export function evaluateReroute(vehicle, allDeliveries, blockedSet) {
  if (!vehicle.remainingLegs || vehicle.remainingLegs.length === 0) {
    return { shouldSwitch: false, newLegs: null, improvement: 0 };
  }

  // Current remaining route total distance
  const currentDist = vehicle.remainingLegs.reduce((s, l) => s + (l.distance || 0), 0);

  // Try rebuilding with unblocked road available
  const result = rebuildRoute(vehicle, allDeliveries, blockedSet);
  if (!result.success || !result.legs || result.legs.length === 0) {
    return { shouldSwitch: false, newLegs: null, improvement: 0 };
  }

  const newDist = result.legs.reduce((s, l) => s + (l.distance || 0), 0);

  if (currentDist <= 0) {
    return { shouldSwitch: false, newLegs: null, improvement: 0 };
  }

  const improvement = (currentDist - newDist) / currentDist;

  if (improvement >= MIN_IMPROVEMENT_RATIO) {
    return { shouldSwitch: true, newLegs: result.legs, improvement };
  }

  return { shouldSwitch: false, newLegs: null, improvement };
}
