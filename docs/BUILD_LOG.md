# Build Log - Phase 1 and 2

## What I created

- Dark command-center dashboard for the AI Logistics Delivery prototype.
- Header with title, phase label, and LIVE status indicator.
- Synthetic SVG city map with a central warehouse, connected road network, bridge corridor, delivery nodes, and vehicle markers.
- Right-side AI placeholder panel for future model and decision support features.
- Fleet cards, metric placeholders, and START / PAUSE / RESET controls.
- Phase 2 working simulation with deterministic assignment, shortest-path routing, vehicle movement, completion tracking, and live metrics.

## Important files and components

- `src/App.jsx`
  - `Header`
  - `ControlBar`
  - `CityMap`
  - `AiPanel`
  - `FleetPanel`
  - `MetricsPanel`
- `src/simulation.js`
  - Centralized warehouse, road, vehicle, and delivery data.
  - Vehicle type specs for `BIKE`, `VAN`, and `TRUCK`.
  - Dijkstra route calculation on the SVG road graph.
  - Greedy priority-aware delivery assignment.
  - Simulation stepping, vehicle interpolation, and metric calculation.
- `src/index.css`
  - Global page background and base font setup.
- `docs/BUILD_LOG.md`
  - Phase 1 implementation notes.
  - Phase 2 simulation notes.

## How the map is structured

- The map is a single inline SVG inside the `CityMap` React component.
- Delivery locations are stored in `SIMULATION_DATA.nodes`.
- Vehicle markers read from simulation vehicle state after assignment and routing.
- Roads are stored as graph edges in `SIMULATION_DATA.roads`.
- The central warehouse is drawn near the middle of the SVG viewbox.
- A highlighted bridge route crosses the river-like corridor to make the city visually distinct.
- In Phase 2, roads are centralized as graph edges in `SIMULATION_DATA.roads`.
- The SVG draws those same road edges, and Dijkstra uses them for route calculation.
- Each vehicle route is rendered as a colored overlay path, then the marker position is interpolated along the route by traveled distance.

## How the simulation works

- Deliveries are sorted by priority: `CRITICAL`, then `HIGH`, then `NORMAL`.
- A greedy assignment chooses the feasible vehicle with the lowest simple score based on current route distance and number of assigned stops.
- Vehicle capacity is enforced using each delivery weight and each vehicle type capacity.
- Dijkstra calculates the shortest route from the vehicle's current graph node to the next delivery destination.
- START sets `running` to true, PAUSE stops the interval, and RESET recreates the initial deterministic simulation.
- Every tick advances vehicles by their type speed, updates fuel usage, marks reached deliveries as completed, and refreshes metrics.
- The simulation stops automatically after all deliveries are completed.

## Decisions and assumptions

- This phase is visual-only and uses synthetic static data.
- START, PAUSE, and RESET now control the local simulation only.
- Routing is local graph routing only; no AI logic, incidents, backend, APIs, persistence, or new dependencies were added.
- The UI remains close to the Phase 1 dashboard; the main change is simulation behavior under the existing layout.
- Tailwind is used through the existing CDN setup in `index.html`.
- Distances, speed, ETA, and fuel are synthetic map units for prototype demonstration.

## What remains to build

- AI recommendation behavior.
- Incident overlays and disruption handling.
- Backend/API integration.
- Real data ingestion and persistence.
- More realistic route sequencing and multi-trip capacity handling.
- Pause/resume polish such as timeline scrubbers or per-vehicle controls.
