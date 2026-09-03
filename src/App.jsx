import { useEffect, useMemo, useState } from "react";
import {
  SIMULATION_DATA,
  createInitialSimulation,
  deliveryNodes,
  getSimulationMetrics,
  pointById,
  routeToPath,
  stepSimulation,
} from "./simulation";

function Header({ running }) {
  return (
    <header className="flex flex-col gap-4 border-b border-cyan-400/15 bg-slate-950/90 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300/80">
          Phase 2 Simulation
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-50 md:text-3xl">
          AI Logistics Delivery Command Center
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-2 rounded border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-200">
          <span className={`h-2 w-2 rounded-full ${running ? "bg-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.95)]" : "bg-slate-500"}`} />
          Live
        </span>
        <span className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-300">
          Synthetic city map
        </span>
      </div>
    </header>
  );
}

function ControlBar({ running, onStart, onPause, onReset }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/70 px-4 py-3 md:px-6">
      <div className="flex gap-2">
        <button onClick={onStart} className="rounded border border-emerald-400/40 bg-emerald-400/15 px-4 py-2 text-sm font-bold text-emerald-100 hover:bg-emerald-400/25">
          START
        </button>
        <button onClick={onPause} className="rounded border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-sm font-bold text-amber-100 hover:bg-amber-400/20">
          PAUSE
        </button>
        <button onClick={onReset} className="rounded border border-slate-600 bg-slate-900 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-800">
          RESET
        </button>
      </div>
      <p className="text-xs text-slate-400">{running ? "Simulation running" : "Simulation paused"}</p>
    </div>
  );
}

function CityMap({ vehicles, deliveries }) {
  const completedDestinations = new Set(
    deliveries.filter((delivery) => delivery.status === "COMPLETED").map((delivery) => delivery.destination),
  );
  const criticalDestinations = new Set(
    deliveries.filter((delivery) => delivery.priority === "CRITICAL").map((delivery) => delivery.destination),
  );

  return (
    <section className="min-h-[520px] border border-cyan-400/15 bg-slate-950 shadow-2xl shadow-cyan-950/30">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-100">
            Synthetic City Grid
          </h2>
          <p className="text-xs text-slate-400">Warehouse, graph roads, assigned routes, live vehicles</p>
        </div>
        <span className="rounded bg-cyan-400/10 px-2 py-1 text-xs font-semibold text-cyan-200">
          Dijkstra routes
        </span>
      </div>

      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#07111f]">
        <svg viewBox="0 0 840 630" className="h-full w-full" role="img" aria-label="Synthetic logistics city simulation map">
          <defs>
            <pattern id="grid" width="42" height="42" patternUnits="userSpaceOnUse">
              <path d="M42 0H0V42" fill="none" stroke="#1e3a5f" strokeWidth="1" opacity="0.35" />
            </pattern>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="840" height="630" fill="url(#grid)" />
          <path d="M0 360 C150 315 225 385 350 350 C500 310 570 330 840 270" fill="none" stroke="#0f766e" strokeWidth="54" opacity="0.2" />
          <path d="M0 360 C150 315 225 385 350 350 C500 310 570 330 840 270" fill="none" stroke="#2dd4bf" strokeWidth="3" strokeDasharray="12 10" opacity="0.65" />

          <g opacity="0.45">
            <rect x="60" y="58" width="76" height="54" fill="#132238" />
            <rect x="610" y="60" width="86" height="56" fill="#132238" />
            <rect x="84" y="214" width="66" height="60" fill="#132238" />
            <rect x="452" y="176" width="94" height="56" fill="#132238" />
            <rect x="675" y="300" width="88" height="74" fill="#132238" />
            <rect x="200" y="432" width="82" height="68" fill="#132238" />
            <rect x="595" y="500" width="84" height="52" fill="#132238" />
          </g>

          {SIMULATION_DATA.roads.map(([from, to]) => (
            <path key={`${from}-${to}`} d={`M${pointById[from].x} ${pointById[from].y} L${pointById[to].x} ${pointById[to].y}`} fill="none" stroke="#334155" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {SIMULATION_DATA.roads.map(([from, to]) => (
            <path key={`${from}-${to}-line`} d={`M${pointById[from].x} ${pointById[from].y} L${pointById[to].x} ${pointById[to].y}`} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="10 12" strokeLinecap="round" opacity="0.65" />
          ))}

          {vehicles.map((vehicle) => (
            <path key={`${vehicle.id}-route`} d={routeToPath(vehicle.routePoints)} fill="none" stroke={vehicle.color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.35" />
          ))}

          <g>
            <path d="M502 330 C545 316 588 304 638 285" fill="none" stroke="#eab308" strokeWidth="26" strokeLinecap="round" />
            <path d="M502 330 C545 316 588 304 638 285" fill="none" stroke="#fef08a" strokeWidth="3" strokeDasharray="14 9" strokeLinecap="round" />
            <text x="552" y="300" fill="#fde68a" fontSize="13" fontWeight="700">North Bridge</text>
          </g>

          <g filter="url(#glow)">
            <rect x="384" y="266" width="72" height="72" rx="10" fill="#0891b2" stroke="#a5f3fc" strokeWidth="3" />
            <path d="M396 306 H444 M420 280 V328" stroke="#cffafe" strokeWidth="5" strokeLinecap="round" />
            <text x="420" y="358" textAnchor="middle" fill="#cffafe" fontSize="14" fontWeight="800">CENTRAL HUB</text>
          </g>

          {deliveryNodes.map((node) => {
            const isComplete = completedDestinations.has(node.id);
            const isCritical = criticalDestinations.has(node.id);
            return (
              <g key={node.id} opacity={isComplete ? 0.45 : 1}>
                <rect x={node.x - 17} y={node.y - 17} width="34" height="34" rx="6" fill="#0f172a" stroke={isCritical ? "#f87171" : "#67e8f9"} strokeWidth="2" />
                <path d={`M${node.x - 8} ${node.y + 8}V${node.y - 5}L${node.x} ${node.y - 12}L${node.x + 8} ${node.y - 5}V${node.y + 8}Z`} fill={isComplete ? "#64748b" : isCritical ? "#fca5a5" : "#bae6fd"} />
                {isComplete && <path d={`M${node.x - 8} ${node.y}L${node.x - 2} ${node.y + 7}L${node.x + 10} ${node.y - 8}`} fill="none" stroke="#86efac" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
                <text x={node.x} y={node.y + 33} textAnchor="middle" fill="#cbd5e1" fontSize="11" fontWeight="700">{node.id}</text>
              </g>
            );
          })}

          {vehicles.map((vehicle) => (
            <g key={vehicle.id} filter="url(#glow)">
              <circle cx={vehicle.position.x} cy={vehicle.position.y} r={vehicle.type === "TRUCK" ? 14 : 12} fill={vehicle.color} />
              <path d={`M${vehicle.position.x - 5} ${vehicle.position.y + 6}L${vehicle.position.x} ${vehicle.position.y - 8}L${vehicle.position.x + 8} ${vehicle.position.y + 6}Z`} fill="#020617" opacity="0.75" />
              <text x={vehicle.position.x} y={vehicle.position.y - 18} textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="800">{vehicle.id}</text>
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}

function AiPanel({ deliveries }) {
  const byPriority = ["CRITICAL", "HIGH", "NORMAL"].map((priority) => ({
    priority,
    total: deliveries.filter((delivery) => delivery.priority === priority).length,
    complete: deliveries.filter((delivery) => delivery.priority === priority && delivery.status === "COMPLETED").length,
  }));

  return (
    <aside className="border border-cyan-400/15 bg-slate-950">
      <div className="border-b border-slate-800 px-4 py-3">
        <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-cyan-100">AI Panel</h2>
        <p className="text-xs text-slate-400">Placeholder for future optimization logic</p>
      </div>
      <div className="space-y-3 p-4">
        {byPriority.map((item) => (
          <div key={item.priority} className="rounded border border-slate-800 bg-slate-900/70 p-3">
            <p className="text-sm font-semibold text-slate-100">{item.priority} priority queue</p>
            <div className="mt-2 h-2 rounded bg-slate-800">
              <div className="h-2 rounded bg-cyan-300/60" style={{ width: `${item.total === 0 ? 0 : (item.complete / item.total) * 100}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-400">{item.complete}/{item.total} completed</p>
          </div>
        ))}
      </div>
    </aside>
  );
}

function FleetPanel({ vehicles }) {
  return (
    <section className="border border-slate-800 bg-slate-950">
      <div className="border-b border-slate-800 px-4 py-3">
        <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-slate-100">Fleet</h2>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-1">
        {vehicles.map((vehicle) => (
          <article key={vehicle.id} className="rounded border border-slate-800 bg-slate-900 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: vehicle.color }} />
                <p className="font-bold text-slate-50">{vehicle.id}</p>
              </div>
              <span className="text-xs font-semibold uppercase text-slate-400">{vehicle.status}</span>
            </div>
            <p className="mt-2 text-sm text-slate-300">{vehicle.driver} - {vehicle.type}</p>
            <p className="mt-1 text-xs text-cyan-200">{vehicle.assignedDeliveryIds.length} drops - {vehicle.assignedWeight}/{vehicle.capacity} kg</p>
            <p className="mt-1 text-xs text-slate-400">Fuel {Math.max(0, vehicle.fuel - vehicle.fuelUsed).toFixed(1)} / {vehicle.fuel}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function MetricsPanel({ metrics }) {
  return (
    <section className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
      {metrics.map((metric) => (
        <div key={metric.label} className="border border-slate-800 bg-slate-950 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{metric.label}</p>
          <p className="mt-2 text-3xl font-black text-slate-50">{metric.value}</p>
          <p className="text-xs text-cyan-200">{metric.delta}</p>
        </div>
      ))}
    </section>
  );
}

function App() {
  const [simulation, setSimulation] = useState(() => createInitialSimulation());
  const incompleteDeliveries = simulation.deliveries.filter((delivery) => delivery.status !== "COMPLETED").length;

  useEffect(() => {
    if (!simulation.running) return undefined;

    const interval = window.setInterval(() => {
      setSimulation((current) => stepSimulation(current));
    }, 120);

    return () => window.clearInterval(interval);
  }, [simulation.running]);

  const metrics = useMemo(() => getSimulationMetrics(simulation), [simulation]);

  function handleStart() {
    if (incompleteDeliveries === 0) return;
    setSimulation((current) => ({ ...current, running: true }));
  }

  function handlePause() {
    setSimulation((current) => ({ ...current, running: false }));
  }

  function handleReset() {
    setSimulation(createInitialSimulation());
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <Header running={simulation.running} />
      <ControlBar running={simulation.running} onStart={handleStart} onPause={handlePause} onReset={handleReset} />
      <main className="grid gap-4 p-4 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <div className="space-y-4 xl:order-first">
          <FleetPanel vehicles={simulation.vehicles} />
          <MetricsPanel metrics={metrics} />
        </div>
        <CityMap vehicles={simulation.vehicles} deliveries={simulation.deliveries} />
        <AiPanel deliveries={simulation.deliveries} />
      </main>
    </div>
  );
}

export default App;
