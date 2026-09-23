import React, { useState, useEffect } from 'react';
import {
  Atom,
  Cpu,
  Zap,
  Play,
  Layers,
  Terminal,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Download
} from 'lucide-react';
import { fetchQuantumCircuit, runQuantumSimulation, getReportPdfUrl } from '../api';
import { CircuitVisualizer } from '../components/CircuitVisualizer';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

export const QuantumLabPage: React.FC = () => {
  const [qubits, setQubits] = useState(4);
  const [depth, setDepth] = useState(2);
  const [shots, setShots] = useState(512);
  const [circuitData, setCircuitData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simulationOutput, setSimulationOutput] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadCircuit();
  }, [qubits, depth]);

  async function loadCircuit() {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchQuantumCircuit(qubits, depth);
      setCircuitData(data);
    } catch (err: any) {
      console.error('Failed to load quantum circuit:', err);
      setErrorMessage('LOCAL COMPUTATION OFFLINE — Backend API unreachable. Real quantum circuit metadata cannot be retrieved.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRunSimulatorExperiment() {
    setSimulationRunning(true);
    setErrorMessage(null);
    try {
      const res = await runQuantumSimulation(qubits, depth, shots);
      setSimulationOutput(res);
      setTimeout(() => {
        const el = document.getElementById('simulation-output-panel');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      console.error('Simulation experiment failed:', err);
      setSimulationOutput(null);
      setErrorMessage(
        'LOCAL COMPUTATION OFFLINE — Failed to reach local backend at http://localhost:8000. ' +
        'No simulated fallback predictions are generated when the backend is offline.'
      );
    } finally {
      setSimulationRunning(false);
    }
  }

  return (
    <div className="space-y-6 min-w-0 max-w-full">
      <MedicalDisclaimer compact />

      {/* Header */}
      <div className="glass-panel-elevated rounded-2xl p-6 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
              PENNYLANE default.qubit RUNTIME
            </span>
            <span className="text-xs text-slate-400">Local CPU Simulation</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">Quantum Machine Learning Circuit Lab</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Configure variational quantum classifiers (VQC), inspect gate counts, feature encoding parameters, and test execution on the local PennyLane simulator.
          </p>
        </div>

        <button
          onClick={handleRunSimulatorExperiment}
          disabled={simulationRunning}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white shadow-lg shadow-purple-600/25 transition-all cursor-pointer"
        >
          <Play className={`w-3.5 h-3.5 ${simulationRunning ? 'animate-spin' : ''}`} />
          <span>{simulationRunning ? 'Executing PennyLane Circuit...' : 'Run Simulation Test'}</span>
        </button>
      </div>

      {/* Offline Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-3 animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-rose-200">LOCAL COMPUTATION OFFLINE</div>
            <div className="mt-1 text-rose-300/90">{errorMessage}</div>
          </div>
        </div>
      )}

      {/* Controls & Circuit Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <label className="block text-slate-400 text-[11px] font-medium mb-1.5">Qubit Register (Width):</label>
          <select
            value={qubits}
            onChange={(e) => setQubits(Number(e.target.value))}
            className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none"
          >
            <option value={4}>4 Qubits — Baseline</option>
            <option value={6}>6 Qubits — Extended</option>
            <option value={8}>8 Qubits — High Capacity</option>
            <option value={20}>20 Qubits — Experimental Multi-Omics</option>
          </select>
        </div>

        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <label className="block text-slate-400 text-[11px] font-medium mb-1.5">Circuit Depth (Layers):</label>
          <select
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
            className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none"
          >
            <option value={1}>Depth 1 (Single Entanglement)</option>
            <option value={2}>Depth 2 (Standard RealAmplitudes)</option>
            <option value={3}>Depth 3 (High Expressibility)</option>
            <option value={4}>Depth 4 (Complex Variational Space)</option>
          </select>
        </div>

        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <label className="block text-slate-400 text-[11px] font-medium mb-1.5">Simulation Shots:</label>
          <select
            value={shots}
            onChange={(e) => setShots(Number(e.target.value))}
            className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none"
          >
            <option value={256}>256 Shots (Fast Local)</option>
            <option value={512}>512 Shots (Balanced)</option>
            <option value={1024}>1024 Shots (High Statistical Precision)</option>
          </select>
        </div>

        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <label className="block text-slate-400 text-[11px] font-medium mb-1.5">Active Simulator Backend:</label>
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-emerald-400 text-xs flex items-center justify-between">
            <span>PennyLane default.qubit</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Interactive Circuit Diagram Visualizer */}
      <CircuitVisualizer
        numQubits={qubits}
        depth={depth}
        shots={shots}
        backendName="PennyLane default.qubit"
      />

      {/* Simulation Experiment Output Panel */}
      {simulationOutput && (
        <div id="simulation-output-panel" className="glass-panel-elevated rounded-2xl p-5 border border-purple-500/30 bg-purple-950/10 space-y-4">
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-purple-500/20 gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>PennyLane Simulator Execution Output ({simulationOutput.record_id})</span>
              </h3>
              <p className="text-xs text-purple-300 mt-0.5">
                Monte Carlo shot sampling across {simulationOutput.shots_executed || shots} shots • Depth {simulationOutput.circuit_depth || depth} • {simulationOutput.qubit_count || qubits} Qubits ({simulationOutput.device_name || 'default.qubit'})
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-purple-300">
                Executed in {simulationOutput.execution_time_ms} ms
              </span>
              <a
                href={getReportPdfUrl('DEMO-HIGH-03')}
                download={`quantum_simulation_${simulationOutput.record_id}.pdf`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Report</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-slate-400">Classical Risk (XGBoost):</div>
              <div className="text-lg font-bold text-indigo-400 mt-1">
                {(simulationOutput.classical_risk * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-slate-400">Quantum VQC Risk:</div>
              <div className="text-lg font-bold text-purple-400 mt-1">
                {(simulationOutput.quantum_risk * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-slate-400">Hybrid Risk Score:</div>
              <div className="text-lg font-bold text-emerald-400 mt-1">
                {(simulationOutput.hybrid_risk * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="text-slate-400">Sim Latency (CPU):</div>
              <div className="text-lg font-bold text-sky-400 mt-1">
                {simulationOutput.execution_time_ms} ms
              </div>
            </div>
          </div>

          {simulationOutput.measurement_counts && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
              <div className="text-slate-400 text-[11px] mb-2 font-semibold">
                Genuine PennyLane Computational Basis Measurement Counts (Bitstrings |b₁b₂...bₙ⟩):
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {Object.entries(simulationOutput.measurement_counts).map(([state, count]) => (
                  <div key={state} className="p-2 rounded bg-slate-900 border border-slate-800 text-center">
                    <div className="text-purple-400 font-bold">{state}</div>
                    <div className="text-white text-xs mt-0.5">{String(count)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ASCII Circuit Representation */}
      {circuitData?.circuit_info?.ascii_diagram && (
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 min-w-0 max-w-full overflow-hidden">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span>Quantum Circuit ASCII Diagram ({qubits} Wires, Depth {depth})</span>
          </div>
          <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-indigo-200 overflow-x-auto max-w-full">
            {circuitData.circuit_info.ascii_diagram}
          </pre>
        </div>
      )}
    </div>
  );
};

