import { useEffect, useState } from "react";
import DispatcherLogs from "./components/DispatcherLogs";
import LogisticsMap from "./components/LogisticsMap";
import MetricsPanel from "./components/MetricsPanel";
import TopControls from "./components/TopControls";
import {
  createInitialSimulation,
  stepSimulation,
} from "./utils/simulationEngine";
import {
  handleBlockRoad,
  handleUnblockRoad,
  handleVehicleBreakdown,
  handleEmergencyDelivery,
  handleMoveDelivery,
} from "./simulation/incidentHandlers";

export default function App() {
  const [simulation, setSimulation] = useState(() => createInitialSimulation());
  const [selectedItem, setSelectedItem] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);

  const incompleteDeliveries = simulation.deliveries.filter(
    (d) => d.status !== "COMPLETED" && d.status !== "UNREACHABLE"
  ).length;

  // Simulation tick
  useEffect(() => {
    if (!simulation.running) return undefined;
    const interval = window.setInterval(() => {
      setSimulation((current) => stepSimulation(current));
    }, 120);
    return () => window.clearInterval(interval);
  }, [simulation.running]);

  // --- Controls ---
  function handleStart() {
    if (incompleteDeliveries === 0) return;
    setHasStarted(true);
    setSimulation((current) => ({
      ...current,
      running: true,
      logs: [
        { id: `START-${Date.now()}`, text: `[${hhmm()}] FLEET DISPATCH INITIATED`, tone: "emerald" },
        ...current.logs,
      ],
    }));
  }

  function handlePause() {
    setSimulation((current) => ({
      ...current,
      running: false,
      logs: [
        { id: `PAUSE-${Date.now()}`, text: `[${hhmm()}] SIMULATION PAUSED`, tone: "amber" },
        ...current.logs,
      ],
    }));
  }

  function handleResume() {
    if (incompleteDeliveries === 0) return;
    setSimulation((current) => ({
      ...current,
      running: true,
      logs: [
        { id: `RESUME-${Date.now()}`, text: `[${hhmm()}] SIMULATION RESUMED`, tone: "cyan" },
        ...current.logs,
      ],
    }));
  }

  function handleReset() {
    setHasStarted(false);
    setSelectedItem(null);
    setSimulation(createInitialSimulation());
  }

  function handleChangeSpeed(speedMultiplier) {
    setSimulation((current) => ({
      ...current,
      speedMultiplier,
      logs: [
        { id: `SPD-${Date.now()}`, text: `[${hhmm()}] SPEED SET TO ${speedMultiplier}x`, tone: "cyan" },
        ...current.logs,
      ],
    }));
  }

  // --- Road toggle (click road on map → block/unblock) ---
  function onRoadToggle(roadId) {
    if (!roadId) return;
    setSimulation((current) => {
      if (current.blockedRoadIds.includes(roadId)) {
        return handleUnblockRoad(current, roadId);
      }
      return handleBlockRoad(current, roadId);
    });
    // Also select the road for inspection
    setSelectedItem({ type: "road", id: roadId });
  }

  // --- Incident panel buttons ---
  function onBlockRoadAction(roadId) {
    setSimulation((current) => {
      if (roadId && current.blockedRoadIds.includes(roadId)) {
        return handleUnblockRoad(current, roadId);
      }
      return handleBlockRoad(current, roadId);
    });
  }

  function onVehicleBreakdownAction(vehicleId) {
    setSimulation((current) => handleVehicleBreakdown(current, vehicleId));
  }

  function onEmergencyDeliveryAction(locationId) {
    setSimulation((current) => handleEmergencyDelivery(current, locationId));
  }

  function onMoveDeliveryAction(deliveryId) {
    setSimulation((current) => handleMoveDelivery(current, deliveryId));
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#050811] text-slate-100 antialiased selection:bg-cyan-500 selection:text-black">
      {/* Header */}
      <TopControls
        running={simulation.running}
        hasStarted={hasStarted}
        incompleteDeliveries={incompleteDeliveries}
        totalDeliveries={simulation.deliveries.length}
        speedMultiplier={simulation.speedMultiplier || 1}
        onChangeSpeed={handleChangeSpeed}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onReset={handleReset}
        metrics={simulation.metrics}
      />

      {/* Main */}
      <main className="flex flex-1 overflow-hidden p-3 gap-3 flex-col lg:flex-row">
        {/* Map + Metrics */}
        <div className="flex flex-col flex-1 h-full min-h-[400px] overflow-hidden rounded-xl border border-slate-800/80">
          <MetricsPanel simulation={simulation} hasStarted={hasStarted} />
          <div className="flex-1 overflow-hidden">
            <LogisticsMap
              vehicles={simulation.vehicles}
              deliveries={simulation.deliveries}
              blockedRoadIds={simulation.blockedRoadIds}
              selectedItem={selectedItem}
              onSelect={setSelectedItem}
              onRoadToggle={onRoadToggle}
            />
          </div>
        </div>

        {/* Dispatcher Panel */}
        <div className="w-full lg:w-[340px] xl:w-[380px] h-full flex flex-col shrink-0">
          <DispatcherLogs
            logs={simulation.logs}
            selectedItem={selectedItem}
            simulation={simulation}
            onBlockRoad={onBlockRoadAction}
            onVehicleBreakdown={onVehicleBreakdownAction}
            onEmergencyDelivery={onEmergencyDeliveryAction}
            onMoveDelivery={onMoveDeliveryAction}
            onClearSelection={() => setSelectedItem(null)}
          />
        </div>
      </main>
    </div>
  );
}

function hhmm() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
}
