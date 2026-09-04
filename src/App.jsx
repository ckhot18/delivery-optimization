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

  function onVehicleBreakdownAction(vehicleId, severity = "MAJOR") {
    setSimulation((current) => handleVehicleBreakdown(current, vehicleId, severity));
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f5f5f7] text-neutral-900 antialiased font-sans selection:bg-blue-600 selection:text-white">
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
      <main className="flex flex-1 overflow-hidden p-4 gap-4 flex-col lg:flex-row max-w-[1920px] mx-auto w-full">
        {/* Map + Metrics */}
        <div className="flex flex-col flex-1 h-full min-h-[400px] overflow-hidden rounded-[24px] bg-white shadow-sm ring-1 ring-black/5 border border-black/5">
          <MetricsPanel simulation={simulation} hasStarted={hasStarted} />
          <div className="flex-1 overflow-hidden relative">
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
        <div className="w-full lg:w-[400px] h-full flex flex-col shrink-0">
          <DispatcherLogs
            logs={simulation.logs}
            selectedItem={selectedItem}
            simulation={simulation}
            onBlockRoad={onBlockRoadAction}
            onVehicleBreakdown={onVehicleBreakdownAction}
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
