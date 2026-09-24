import React, { useState, useEffect } from 'react';
import {
  Atom,
  Cpu,
  Play,
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
      setErrorMessage('LOCAL COMPUTATION OFFLINE — Backend API unreachable.');
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
      setErrorMessage('LOCAL COMPUTATION OFFLINE — Backend unreachable.');
    } finally {
      setSimulationRunning(false);
    }
  }

  return (
    <div className="space-y-5 min-w-0 max-w-full">
      <MedicalDisclaimer compact />

      {/* Header */}
      <div className="clinical-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 font-mono">
              PENNYLANE default.qubit RUNTIME
            </span>
            <span className="text-xs text-slate-500 font-mono">Local Simulator</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-1 tracking-tight">Quantum Machine Learning Circuit Lab</h1>
          <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
            Configure variational quantum classifiers (VQC), inspect gate counts, and test execution on the local simulator.
          </p>
        </div>

        <button
          onClick={handleRunSimulatorExperiment}
          disabled={simulationRunning}
          className="flex items-center gap-2 px-4 py-2 rounded bg-cyan-700 hover:bg-cyan-800 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Play className={`w-3.5 h-3.5 ${simulationRunning ? 'animate-spin' : ''}`} />
          <span>{simulationRunning ? 'Executing Circuit...' : 'Run Simulation Test'}</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Controls */}
      <div className="clinical-card p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="block text-slate-600 font-semibold mb-1">Qubits (Features):</label>
          <select
            value={qubits}
            onChange={(e) => setQubits(Number(e.target.value))}
            className="w-full p-2 rounded bg-slate-50 border border-slate-300 text-slate-900 font-mono"
          >
            <option value={4}>4 Qubits</option>
            <option value={6}>6 Qubits</option>
            <option value={8}>8 Qubits</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-600 font-semibold mb-1">Circuit Depth:</label>
          <select
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
            className="w-full p-2 rounded bg-slate-50 border border-slate-300 text-slate-900 font-mono"
          >
            <option value={1}>1 Layer</option>
            <option value={2}>2 Layers</option>
            <option value={3}>3 Layers</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-600 font-semibold mb-1">Shots:</label>
          <select
            value={shots}
            onChange={(e) => setShots(Number(e.target.value))}
            className="w-full p-2 rounded bg-slate-50 border border-slate-300 text-slate-900 font-mono"
          >
            <option value={256}>256 Shots</option>
            <option value={512}>512 Shots</option>
            <option value={1024}>1024 Shots</option>
          </select>
        </div>
      </div>

      {/* Circuit Visualization */}
      {circuitData && (
        <div className="space-y-3">
          <CircuitVisualizer numQubits={qubits} depth={depth} />
        </div>
      )}

    </div>
  );
};

