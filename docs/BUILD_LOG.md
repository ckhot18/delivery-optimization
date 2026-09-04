# Emergency Logistics Application - Build Log

## Phase 4: Dynamic Constraint-Aware Fleet Optimizer
**Status:** Completed

### 1. Global Optimization Engine (\leetOptimizer.js\)
Replaced basic nearest-vehicle assignment with a global cost-function solver.
Assignments are now evaluated against a multi-objective cost model:
\cost = w_dist*distance + w_eta*ETA + w_fuel*fuel + w_traffic*trafficPenalty + w_prio*priorityPenalty + w_cap*capacityPenalty + w_risk*riskPenalty\
This ensures critical deliveries get immediate attention and overloaded routes are avoided.

### 2. Route Validation & Anti-Oscillation (\outeValidator.js\)
- **Pre-entry check:** Vehicles recalculate route before entering a newly blocked edge.
- **Anti-oscillation:** On road unblock, vehicles only switch to the new path if improvement >= 5%.

### 3. Incident Control Upgrades (\incidentHandlers.js\)
- Added \handleUnblockRoad\ action.
- Upgraded Breakdown handling: Fully triggers global re-optimization of all orphaned deliveries to other active fleet members.
- Added timestamped logging (\[HH:MM:SS] \) for all incident events.

### 4. UI Polish & Metrics
- **LogisticsMap:** Added wide invisible hit areas on roads. Clicking a road directly toggles its blocked state.
- **VehicleTooltip:** Added detailed hover cards showing exact load, fuel, current destination, and system decision rationale.
- **MetricsPanel:** Top-level horizontal scoreboard showing fleet ETA, total fuel, total distance, critical deliveries completion, reroute counts, and an optimization score. Added a "Disruption Impact" diff-block after first disruption.

### Edge Cases Verified
- **Edge Case A (Blocked En Route):** Pre-entry check reroutes vehicle seamlessly.
- **Edge Case B (Unreachable Destination):** Vehicle switches to WAITING, delivery marked UNREACHABLE.
- **Edge Case C (Breakdown Redistribution):** Global optimizer successfully reallocates orders.
- **Edge Case D (SOS Delivery Injection):** Cost-function immediately pulls a vehicle from existing routes for CRITICAL priority.
- [x] Edge Case E (Oscillation Control): 5% improvement threshold prevents route flickering.

## Phase 5: Minor Breakdown & High-Fidelity Map Visuals
**Status:** Completed

### 1. Minor Breakdown Mechanics & Live Countdown
- **Behavior:** Vehicles pause for a 6-second repair countdown (`⏱ 6s`), holding their current route and assigned cargo.
- **Dynamic ETA:** All assigned deliveries have ETAs increased by the repair delay during the breakdown, returning to normal progression after automatic recovery.
- **Dispatcher Logging:** Emits structured logs:
  - `[HH:MM:SS] V-02 minor breakdown`
  - `[HH:MM:SS] Estimated recovery: 00:06`
  - `[HH:MM:SS] DEL-01 ETA updated: 00:15 → 00:21`
  - `[HH:MM:SS] Customer notification sent`
  - `[HH:MM:SS] V-02 recovered`
  - `[HH:MM:SS] Route resumed`

### 2. Rich Delivery Point Hover Tooltip (`DeliveryTooltip.jsx`)
- Hovering any delivery location displays a dedicated card:
  - Delivery ID, priority badge, order package description, recipient, weight.
  - Assigned vehicle and courier name.
  - Matrix showing Original ETA, Live Updated ETA, and breakdown delay.
  - Live customer notification status (e.g. `"Vehicle delayed due to vehicle issue. Expected arrival in 00:21."`).

### 3. Clean, Cohesive City Map Visuals (`LogisticsMap.jsx`)
- **Stripe Removal:** Removed all white and yellow road stripes, dashed lane dividers, roundabout dash circles, bridge center lines, and highway overpass stripes. Roads now render as clean, modern dark asphalt beds with maximum route line contrast.
- **City Blocks & Landmarks:** Added subtle district zoning tints (Northwest Health, Northeast Tech/Market, Southwest Logistics, Southeast Maritime), architectural building footprints with rooftop details, lush riverside tree belts, and landmarks (City Hospital, Market Plaza, West Terminal, East Docks).
- **Functionality Preserved:** Full road clicking/toggling, vehicle inspection, delivery hovers, and simulation mechanics remain fully interactive.
