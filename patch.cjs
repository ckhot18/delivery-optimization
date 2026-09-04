const fs = require('fs');

function patchFile(path, replacements) {
    let content = fs.readFileSync(path, 'utf8');
    for (const {from, to} of replacements) {
        content = content.replace(from, to);
    }
    fs.writeFileSync(path, content, 'utf8');
}

patchFile('src/App.jsx', [
    {
        from: `function onVehicleBreakdownAction(vehicleId) {\n    setSimulation((current) => handleVehicleBreakdown(current, vehicleId));\n  }`,
        to: `function onVehicleBreakdownAction(vehicleId, severity = "MAJOR") {\n    setSimulation((current) => handleVehicleBreakdown(current, vehicleId, severity));\n  }`
    }
]);

patchFile('src/simulation/incidentHandlers.js', [
    {
        from: `export function handleVehicleBreakdown(simulation, targetVehicleId) {\n  const vehicleToDisable = simulation.vehicles.find(\n    (v) => targetVehicleId\n      ? v.id === targetVehicleId\n      : (v.status !== "DISABLED" && v.status !== "COMPLETE")\n  );\n\n  if (!vehicleToDisable) return simulation;\n\n  const returnedIds = [...vehicleToDisable.assignedDeliveryIds];\n  const blockedSet = new Set(simulation.blockedRoadIds);\n\n  const logsToAdd = [\n    log(\`\${vehicleToDisable.id} BREAKDOWN\`, "red"),`,
        to: `export function handleVehicleBreakdown(simulation, targetVehicleId, severity = "MAJOR") {\n  const vehicleToDisable = simulation.vehicles.find(\n    (v) => targetVehicleId\n      ? v.id === targetVehicleId\n      : (v.status !== "DISABLED" && v.status !== "COMPLETE")\n  );\n\n  if (!vehicleToDisable) return simulation;\n\n  if (severity === "MINOR") {\n    const logsToAdd = [\n      log(\`\${vehicleToDisable.id} MINOR BREAKDOWN\`, "amber"),\n      log(\`\${vehicleToDisable.id} delayed for quick repairs\`, "amber"),\n    ];\n\n    const nextVehicles = simulation.vehicles.map((v) => {\n      if (v.id === vehicleToDisable.id) {\n        return {\n          ...v,\n          status: "DELAYED",\n          delayRemaining: 5,\n          currentDecision: "Minor breakdown - repairing",\n          noRouteReason: "Vehicle issue",\n        };\n      }\n      return v;\n    });\n\n    return {\n      ...simulation,\n      vehicles: nextVehicles,\n      logs: [...logsToAdd, ...simulation.logs].slice(0, 50),\n    };\n  }\n\n  const returnedIds = [...vehicleToDisable.assignedDeliveryIds];\n  const blockedSet = new Set(simulation.blockedRoadIds);\n\n  const logsToAdd = [\n    log(\`\${vehicleToDisable.id} MAJOR BREAKDOWN\`, "red"),`
    }
]);

patchFile('src/utils/fleetOptimizer.js', [
    {
        from: `export function computeVehicleETA(vehicle) {\n  if (!vehicle.remainingLegs || vehicle.remainingLegs.length === 0) return 0;\n  const totalDist = vehicle.remainingLegs.reduce((s, l) => s + (l.distance || 0), 0);\n  return Math.round(totalDist / (vehicle.speed || 60));\n}`,
        to: `export function computeVehicleETA(vehicle) {\n  if (!vehicle.remainingLegs || vehicle.remainingLegs.length === 0) return 0;\n  const totalDist = vehicle.remainingLegs.reduce((s, l) => s + (l.distance || 0), 0);\n  let base = totalDist / (vehicle.speed || 60);\n  if (vehicle.status === "DELAYED") base += (vehicle.delayRemaining || 0);\n  return Math.round(base);\n}`
    }
]);

patchFile('src/components/VehicleTooltip.jsx', [
    {
        from: `    WAITING: "bg-amber-500/20 text-amber-300 border-amber-500/40",\n    COMPLETE:`,
        to: `    WAITING: "bg-amber-500/20 text-amber-300 border-amber-500/40",\n    DELAYED: "bg-orange-500/20 text-orange-300 border-orange-500/40",\n    COMPLETE:`
    }
]);

patchFile('src/utils/simulationEngine.js', [
    {
        from: `    // Stopped states\n    if (vehicle.status === "DISABLED" || vehicle.status === "COMPLETE" || vehicle.status === "WAITING") {\n      return vehicle;\n    }`,
        to: `    // Stopped states\n    if (vehicle.status === "DISABLED" || vehicle.status === "COMPLETE" || vehicle.status === "WAITING") {\n      return vehicle;\n    }\n\n    if (vehicle.status === "DELAYED") {\n      const newDelay = (vehicle.delayRemaining || 0) - effectiveDelta;\n      if (newDelay <= 0) {\n        newlyGeneratedLogs.push({\n          id: \`RECOVER-\${vehicle.id}-\${Date.now()}\`,\n          text: \`\${ts()} \${vehicle.id} RECOVERED from minor breakdown\`,\n          tone: "emerald",\n        });\n        return {\n          ...vehicle,\n          status: "MOVING",\n          delayRemaining: 0,\n          currentDecision: "Resuming route after repairs",\n          noRouteReason: null,\n        };\n      }\n      return {\n        ...vehicle,\n        delayRemaining: newDelay,\n      };\n    }`
    },
    {
        from: `    if (!assignedV || assignedV.status === "DISABLED") {\n      return { ...delivery, status: "QUEUED" };\n    }\n    return {\n      ...delivery,\n      status: assignedV.status === "MOVING" ? "IN TRANSIT" : "QUEUED",\n    };`,
        to: `    if (!assignedV || assignedV.status === "DISABLED") {\n      return { ...delivery, status: "QUEUED" };\n    }\n    if (assignedV.status === "DELAYED") {\n      return { ...delivery, status: "DELAYED" };\n    }\n    return {\n      ...delivery,\n      status: assignedV.status === "MOVING" ? "IN TRANSIT" : "QUEUED",\n    };`
    },
    {
        from: `status: delivery ? delivery.status : "STANDBY",\n      badgeColor: loc?.type === "store" ? "#facc15" : "#38bdf8",`,
        to: `status: delivery ? (delivery.status === "DELAYED" ? "DELAYED (Vehicle Issue)" : delivery.status) : "STANDBY",\n      badgeColor: loc?.type === "store" ? "#facc15" : delivery?.status === "DELAYED" ? "#f97316" : "#38bdf8",`
    }
]);

patchFile('src/components/LogisticsMap.jsx', [
    {
        from: `const isMoving = vehicle.status === "MOVING";\n              const isDisabled = vehicle.status === "DISABLED";\n              const isWaiting = vehicle.status === "WAITING" || vehicle.status === "NO ROUTE";\n              const iconColor = isDisabled ? "#64748b" : isWaiting ? "#f59e0b" : vehicle.color;`,
        to: `const isMoving = vehicle.status === "MOVING";\n              const isDisabled = vehicle.status === "DISABLED";\n              const isWaiting = vehicle.status === "WAITING" || vehicle.status === "NO ROUTE";\n              const isDelayed = vehicle.status === "DELAYED";\n              const iconColor = isDisabled ? "#64748b" : isDelayed ? "#f97316" : isWaiting ? "#f59e0b" : vehicle.color;`
    },
    {
        from: `<g transform="translate(0, -17)">\n                    <rect x="-26" y="-7" width="52" height="14" rx="3" fill={isDisabled ? "#7f1d1d" : isWaiting ? "#78350f" : "#020617"} stroke={isDisabled ? "#ef4444" : isWaiting ? "#f59e0b" : vehicle.color} strokeWidth={1.2} />\n                    <text x="0" y="2.5" textAnchor="middle" fill={isDisabled ? "#fecaca" : isWaiting ? "#fde68a" : "#f8fafc"} fontSize="7" fontWeight="900">\n                      {isDisabled ? \`\${vehicle.id} [OFF]\` : isWaiting ? \`\${vehicle.id} [WAIT]\` : vehicle.id}\n                    </text>\n                  </g>\n                  {isDisabled && (\n                    <g transform="translate(12, -18)">\n                      <circle cx="0" cy="0" r="6" fill="#dc2626" stroke="#ffffff" strokeWidth="1" />\n                      <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="900">!</text>\n                    </g>\n                  )}\n                  {isWaiting && (\n                    <g transform="translate(12, -18)">\n                      <circle cx="0" cy="0" r="6" fill="#d97706" stroke="#ffffff" strokeWidth="1" />\n                      <text x="0" y="2.5" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900">⏸</text>\n                    </g>\n                  )}`,
        to: `<g transform="translate(0, -17)">\n                    <rect x="-26" y="-7" width="52" height="14" rx="3" fill={isDisabled ? "#7f1d1d" : isWaiting ? "#78350f" : isDelayed ? "#7c2d12" : "#020617"} stroke={isDisabled ? "#ef4444" : isWaiting ? "#f59e0b" : isDelayed ? "#f97316" : vehicle.color} strokeWidth={1.2} />\n                    <text x="0" y="2.5" textAnchor="middle" fill={isDisabled ? "#fecaca" : isWaiting ? "#fde68a" : isDelayed ? "#ffedd5" : "#f8fafc"} fontSize="7" fontWeight="900">\n                      {isDisabled ? \`\${vehicle.id} [OFF]\` : isWaiting ? \`\${vehicle.id} [WAIT]\` : isDelayed ? \`\${vehicle.id} [DELAY]\` : vehicle.id}\n                    </text>\n                  </g>\n                  {isDisabled && (\n                    <g transform="translate(12, -18)">\n                      <circle cx="0" cy="0" r="6" fill="#dc2626" stroke="#ffffff" strokeWidth="1" />\n                      <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="900">!</text>\n                    </g>\n                  )}\n                  {isWaiting && (\n                    <g transform="translate(12, -18)">\n                      <circle cx="0" cy="0" r="6" fill="#d97706" stroke="#ffffff" strokeWidth="1" />\n                      <text x="0" y="2.5" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900">⏸</text>\n                    </g>\n                  )}\n                  {isDelayed && (\n                    <g transform="translate(12, -18)">\n                      <circle cx="0" cy="0" r="6" fill="#ea580c" stroke="#ffffff" strokeWidth="1" />\n                      <text x="0" y="2.5" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900">⏱</text>\n                    </g>\n                  )}`
    }
]);

patchFile('src/components/DispatcherLogs.jsx', [
    {
        from: `<button\n            onClick={() => onVehicleBreakdown(selectedVehicleId)}\n            className="flex flex-col items-center justify-center rounded-lg border border-amber-500/40 bg-amber-950/30 p-2 text-center text-amber-200 transition-all hover:bg-amber-900/40 hover:border-amber-400 active:scale-95"\n          >\n            <div className="flex items-center gap-1.5">\n              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">\n                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />\n                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />\n              </svg>\n              <span className="text-[10px] font-black uppercase tracking-wider">Breakdown</span>\n            </div>\n            <span className="text-[9px] text-slate-400 mt-0.5 font-mono truncate max-w-[120px]">\n              {selectedVehicleId || "Auto-select vehicle"}\n            </span>\n          </button>`,
        to: `<div className="flex flex-col justify-center rounded-lg border border-amber-500/40 bg-amber-950/30 p-1.5 text-center transition-all">\n            <div className="flex items-center gap-1.5 justify-center mb-1 text-amber-200">\n              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">\n                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />\n                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />\n              </svg>\n              <span className="text-[10px] font-black uppercase tracking-wider">Breakdown</span>\n            </div>\n            <div className="flex gap-1 w-full">\n              <button\n                onClick={() => onVehicleBreakdown(selectedVehicleId, "MINOR")}\n                className="flex-1 rounded border border-amber-500/30 bg-amber-900/40 py-1 text-[8px] font-bold text-amber-200 hover:bg-amber-800/60 active:scale-95"\n              >\n                MINOR\n              </button>\n              <button\n                onClick={() => onVehicleBreakdown(selectedVehicleId, "MAJOR")}\n                className="flex-1 rounded border border-red-500/30 bg-red-900/40 py-1 text-[8px] font-bold text-red-200 hover:bg-red-800/60 active:scale-95"\n              >\n                MAJOR\n              </button>\n            </div>\n          </div>`
    }
]);
