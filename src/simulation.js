export const VEHICLE_TYPES = {
  BIKE: { speed: 82, capacity: 18, fuel: 100, fuelRate: 0.012 },
  VAN: { speed: 62, capacity: 90, fuel: 180, fuelRate: 0.018 },
  TRUCK: { speed: 46, capacity: 260, fuel: 260, fuelRate: 0.026 },
};

export const PRIORITY_RANK = {
  CRITICAL: 3,
  HIGH: 2,
  NORMAL: 1,
};

export const SIMULATION_DATA = {
  warehouse: { id: "HUB", label: "Central Hub", x: 420, y: 302 },
  nodes: [
    { id: "HUB", label: "Central Hub", x: 420, y: 302, kind: "warehouse" },
    { id: "A1", label: "Clinic", x: 150, y: 142, kind: "delivery" },
    { id: "A2", label: "Shelter", x: 260, y: 88, kind: "delivery" },
    { id: "B1", label: "Block 8", x: 492, y: 104, kind: "delivery" },
    { id: "B2", label: "Depot", x: 688, y: 138, kind: "delivery" },
    { id: "C1", label: "Ward 5", x: 168, y: 298, kind: "delivery" },
    { id: "C2", label: "School", x: 288, y: 272, kind: "delivery" },
    { id: "C3", label: "Tower", x: 620, y: 262, kind: "delivery" },
    { id: "D1", label: "Market", x: 120, y: 468, kind: "delivery" },
    { id: "D2", label: "Camp", x: 350, y: 505, kind: "delivery" },
    { id: "D3", label: "Station", x: 545, y: 465, kind: "delivery" },
    { id: "D4", label: "Harbor", x: 735, y: 515, kind: "delivery" },
  ],
  intersections: [
    { id: "V1", label: "South Junction", x: 337, y: 399 },
    { id: "V2", label: "North Bridge", x: 548, y: 232 },
    { id: "V3", label: "East Ramp", x: 661, y: 387 },
  ],
  roads: [
    ["D1", "C1"], ["C1", "A1"], ["A1", "A2"], ["A2", "B1"], ["B1", "B2"],
    ["C1", "C2"], ["C2", "HUB"], ["HUB", "V2"], ["V2", "C3"], ["C3", "B2"],
    ["D1", "V1"], ["V1", "D2"], ["D2", "D3"], ["D3", "D4"],
    ["C2", "D2"], ["B1", "V2"], ["V2", "V3"], ["V3", "D4"], ["HUB", "D3"],
  ],
  vehicles: [
    { id: "V-01", driver: "Aarav", type: "BIKE", color: "#22c55e" },
    { id: "V-02", driver: "Meera", type: "VAN", color: "#38bdf8" },
    { id: "V-03", driver: "Kabir", type: "BIKE", color: "#f59e0b" },
    { id: "V-04", driver: "Isha", type: "TRUCK", color: "#a78bfa" },
  ],
  deliveries: [
    { id: "DEL-01", destination: "D4", weight: 82, priority: "CRITICAL" },
    { id: "DEL-02", destination: "A1", weight: 9, priority: "CRITICAL" },
    { id: "DEL-03", destination: "C2", weight: 14, priority: "HIGH" },
    { id: "DEL-04", destination: "B2", weight: 40, priority: "HIGH" },
    { id: "DEL-05", destination: "D2", weight: 64, priority: "HIGH" },
    { id: "DEL-06", destination: "C3", weight: 30, priority: "NORMAL" },
    { id: "DEL-07", destination: "A2", weight: 12, priority: "NORMAL" },
    { id: "DEL-08", destination: "D1", weight: 24, priority: "NORMAL" },
    { id: "DEL-09", destination: "D3", weight: 48, priority: "NORMAL" },
  ],
};

export const pointById = Object.fromEntries(
  [...SIMULATION_DATA.nodes, ...SIMULATION_DATA.intersections].map((point) => [point.id, point]),
);

export const deliveryNodes = SIMULATION_DATA.nodes.filter((node) => node.kind === "delivery");

export function distanceBetween(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function buildGraph() {
  const graph = {};
  Object.keys(pointById).forEach((id) => {
    graph[id] = [];
  });

  SIMULATION_DATA.roads.forEach(([from, to]) => {
    const distance = distanceBetween(pointById[from], pointById[to]);
    graph[from].push({ to, distance });
    graph[to].push({ to: from, distance });
  });

  return graph;
}

export const graph = buildGraph();

export function dijkstra(start, end) {
  const distances = {};
  const previous = {};
  const unvisited = new Set(Object.keys(graph));

  Object.keys(graph).forEach((id) => {
    distances[id] = id === start ? 0 : Infinity;
    previous[id] = null;
  });

  while (unvisited.size > 0) {
    const current = [...unvisited].sort((a, b) => distances[a] - distances[b])[0];
    if (!current || distances[current] === Infinity) break;
    if (current === end) break;

    unvisited.delete(current);
    graph[current].forEach((edge) => {
      if (!unvisited.has(edge.to)) return;
      const nextDistance = distances[current] + edge.distance;
      if (nextDistance < distances[edge.to]) {
        distances[edge.to] = nextDistance;
        previous[edge.to] = current;
      }
    });
  }

  const ids = [];
  let cursor = end;
  while (cursor) {
    ids.unshift(cursor);
    cursor = previous[cursor];
  }

  return {
    ids,
    points: ids.map((id) => pointById[id]),
    distance: distances[end],
  };
}

export function pathDistance(points) {
  return points.slice(1).reduce((total, point, index) => {
    return total + distanceBetween(points[index], point);
  }, 0);
}

function mergeRoute(existingPoints, nextPoints) {
  if (existingPoints.length === 0) return nextPoints;
  return [...existingPoints, ...nextPoints.slice(1)];
}

export function getPointAtDistance(points, distance) {
  if (points.length === 0) return SIMULATION_DATA.warehouse;
  if (distance <= 0) return points[0];

  let remaining = distance;
  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1];
    const to = points[index];
    const segment = distanceBetween(from, to);
    if (remaining <= segment) {
      const ratio = remaining / segment;
      return {
        x: from.x + (to.x - from.x) * ratio,
        y: from.y + (to.y - from.y) * ratio,
      };
    }
    remaining -= segment;
  }

  return points[points.length - 1];
}

export function routeToPath(points) {
  if (points.length === 0) return "";
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");
}

export function assignDeliveries() {
  const vehicles = SIMULATION_DATA.vehicles.map((vehicle) => ({
    ...vehicle,
    ...VEHICLE_TYPES[vehicle.type],
    assignedDeliveryIds: [],
    assignedWeight: 0,
    routeDistance: 0,
    cursorNode: SIMULATION_DATA.warehouse.id,
  }));

  const deliveries = [...SIMULATION_DATA.deliveries].sort((a, b) => {
    return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] || a.id.localeCompare(b.id);
  });

  const assignedDeliveries = deliveries.map((delivery) => {
    const candidates = vehicles
      .filter((vehicle) => vehicle.assignedWeight + delivery.weight <= vehicle.capacity)
      .map((vehicle) => {
        const nextLeg = dijkstra(vehicle.cursorNode, delivery.destination);
        return { vehicle, score: vehicle.assignedDeliveryIds.length * 140 + nextLeg.distance };
      })
      .sort((a, b) => a.score - b.score || a.vehicle.id.localeCompare(b.vehicle.id));

    const selected = candidates[0]?.vehicle;
    if (!selected) {
      return {
        ...delivery,
        assignedVehicleId: null,
        status: "UNASSIGNED",
      };
    }

    const leg = dijkstra(selected.cursorNode, delivery.destination);

    selected.assignedDeliveryIds.push(delivery.id);
    selected.assignedWeight += delivery.weight;
    selected.routeDistance += leg.distance;
    selected.cursorNode = delivery.destination;

    return {
      ...delivery,
      assignedVehicleId: selected.id,
      status: "QUEUED",
    };
  });

  return { vehicles, deliveries: assignedDeliveries };
}

export function buildVehicleRoutes(assignedVehicles, assignedDeliveries) {
  return assignedVehicles.map((vehicle) => {
    let currentNode = SIMULATION_DATA.warehouse.id;
    let routePoints = [SIMULATION_DATA.warehouse];
    const stops = [];

    vehicle.assignedDeliveryIds.forEach((deliveryId) => {
      const delivery = assignedDeliveries.find((item) => item.id === deliveryId);
      const leg = dijkstra(currentNode, delivery.destination);
      routePoints = mergeRoute(routePoints, leg.points);
      stops.push({
        deliveryId,
        destination: delivery.destination,
        distanceAtStop: pathDistance(routePoints),
      });
      currentNode = delivery.destination;
    });

    return {
      ...vehicle,
      position: SIMULATION_DATA.warehouse,
      progress: 0,
      totalDistance: pathDistance(routePoints),
      routePoints,
      stops,
      status: vehicle.assignedDeliveryIds.length > 0 ? "READY" : "IDLE",
      completedStops: [],
      fuelUsed: 0,
    };
  });
}

export function createInitialSimulation() {
  const { vehicles, deliveries } = assignDeliveries();
  return {
    vehicles: buildVehicleRoutes(vehicles, deliveries),
    deliveries,
    running: false,
    elapsedSeconds: 0,
  };
}

export function stepSimulation(current, deltaSeconds = 0.12) {
  const nextCompleted = new Set(
    current.deliveries.filter((delivery) => delivery.status === "COMPLETED").map((delivery) => delivery.id),
  );

  const vehicles = current.vehicles.map((vehicle) => {
    if (vehicle.status === "COMPLETE" || vehicle.totalDistance === 0) return vehicle;

    const nextProgress = Math.min(vehicle.progress + vehicle.speed * deltaSeconds, vehicle.totalDistance);
    const reachedStops = vehicle.stops.filter((stop) => stop.distanceAtStop <= nextProgress);
    reachedStops.forEach((stop) => nextCompleted.add(stop.deliveryId));

    return {
      ...vehicle,
      progress: nextProgress,
      position: getPointAtDistance(vehicle.routePoints, nextProgress),
      status: nextProgress >= vehicle.totalDistance ? "COMPLETE" : "MOVING",
      completedStops: reachedStops.map((stop) => stop.deliveryId),
      fuelUsed: nextProgress * vehicle.fuelRate,
    };
  });

  const deliveries = current.deliveries.map((delivery) => {
    if (nextCompleted.has(delivery.id)) return { ...delivery, status: "COMPLETED" };
    const assignedVehicle = vehicles.find((vehicle) => vehicle.id === delivery.assignedVehicleId);
    return {
      ...delivery,
      status: assignedVehicle?.status === "MOVING" ? "IN TRANSIT" : "QUEUED",
    };
  });

  const allComplete = deliveries.every((delivery) => delivery.status === "COMPLETED");

  return {
    ...current,
    vehicles,
    deliveries,
    elapsedSeconds: current.elapsedSeconds + deltaSeconds,
    running: allComplete ? false : current.running,
  };
}

export function getSimulationMetrics(simulation) {
  const activeVehicles = simulation.vehicles.filter((vehicle) => vehicle.status === "MOVING").length;
  const completedDeliveries = simulation.deliveries.filter((delivery) => delivery.status === "COMPLETED").length;
  const distance = simulation.vehicles.reduce((total, vehicle) => total + vehicle.progress, 0);
  const fuel = simulation.vehicles.reduce((total, vehicle) => total + vehicle.fuelUsed, 0);
  const longestRemaining = simulation.vehicles.reduce((max, vehicle) => {
    const remaining = Math.max(0, vehicle.totalDistance - vehicle.progress);
    return Math.max(max, remaining / vehicle.speed);
  }, 0);

  return [
    { label: "Active Vehicles", value: `${activeVehicles}/${simulation.vehicles.length}`, delta: `${completedDeliveries}/${simulation.deliveries.length} delivered` },
    { label: "Distance", value: `${Math.round(distance)}`, delta: "map units traveled" },
    { label: "Fuel Used", value: fuel.toFixed(1), delta: `ETA ${Math.ceil(longestRemaining)}s` },
  ];
}
