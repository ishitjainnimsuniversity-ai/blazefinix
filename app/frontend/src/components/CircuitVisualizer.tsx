import React from 'react';
import { Cpu } from 'lucide-react';

interface CircuitVisualizerProps {
  numQubits: number;
  depth: number;
  selectedFeatures?: string[];
  backendName?: string;
  shots?: number;
}

export const CircuitVisualizer: React.FC<CircuitVisualizerProps> = ({
  numQubits = 4,
  depth = 2,
  selectedFeatures = ['systolic_bp', 'fasting_glucose', 'hba1c', 'hs_crp'],
  backendName = 'Qiskit AerSimulator',
  shots = 512
}) => {
  const qubitIndices = Array.from({ length: numQubits }, (_, i) => i);
  const rowHeight = 44;
  const svgHeight = numQubits * rowHeight + 30;

  return (
    <div className="clinical-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-700" />
            <span>Variational Quantum Classifier Circuit Architecture</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Top informative biomarkers encoded via angle embedding into parameterized ansatz register
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="px-2.5 py-1 rounded bg-cyan-50 text-cyan-900 border border-cyan-200 font-mono font-semibold">
            {numQubits} Qubits
          </span>
          <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono font-medium">
            Depth: {depth}
          </span>
          <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-medium">
            {shots} Shots
          </span>
          <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono">
            {backendName}
          </span>
        </div>
      </div>

      {/* SVG Interactive Circuit Layout */}
      <div className="overflow-x-auto py-4 min-w-0 bg-slate-50 rounded border border-slate-200 my-4 px-2">
        <svg viewBox={`0 0 780 ${svgHeight}`} width="100%" className="w-full max-w-[780px] h-auto select-none font-mono min-w-[580px]">
          {/* Qubit Wire Tracks */}
          {qubitIndices.map((q) => {
            const y = 30 + q * rowHeight;
            const feat = selectedFeatures[q] || `x_${q}`;
            return (
              <g key={`wire-${q}`}>
                {/* Qubit Label and Feature Name */}
                <text x="10" y={y + 4} fill="#0369a1" fontSize="11" fontWeight="bold">
                  |q{q}⟩
                </text>
                <text x="44" y={y + 4} fill="#64748b" fontSize="10">
                  ({feat.slice(0, 11)})
                </text>

                {/* Wire Line */}
                <line x1="145" y1={y} x2="750" y2={y} stroke="#cbd5e1" strokeWidth="2" />

                {/* Layer 1: Hadamard Superposition */}
                <rect x="165" y={y - 14} width="28" height="28" rx="4" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1.5" />
                <text x="179" y={y + 4} fill="#0369a1" fontSize="11" fontWeight="bold" textAnchor="middle">
                  H
                </text>

                {/* Layer 2: Rz Feature Encoding */}
                <rect x="220" y={y - 14} width="40" height="28" rx="4" fill="#f3e8ff" stroke="#9333ea" strokeWidth="1.5" />
                <text x="240" y={y + 4} fill="#6b21a8" fontSize="9" fontWeight="bold" textAnchor="middle">
                  Rz(x)
                </text>

                {/* Layer 3: Parameterized Ry Ansatz */}
                <rect x="360" y={y - 14} width="44" height="28" rx="4" fill="#ccfbf1" stroke="#0d9488" strokeWidth="1.5" />
                <text x="382" y={y + 4} fill="#115e59" fontSize="9" fontWeight="bold" textAnchor="middle">
                  Ry(θ₁)
                </text>

                {/* Layer 4: Parameterized Ry Layer 2 */}
                <rect x="520" y={y - 14} width="44" height="28" rx="4" fill="#ccfbf1" stroke="#0d9488" strokeWidth="1.5" />
                <text x="542" y={y + 4} fill="#115e59" fontSize="9" fontWeight="bold" textAnchor="middle">
                  Ry(θ₂)
                </text>

                {/* Measurement Gate */}
                <rect x="680" y={y - 14} width="32" height="28" rx="4" fill="#f1f5f9" stroke="#475569" strokeWidth="1.5" />
                <path d={`M ${688} ${y + 6} Q ${696} ${y - 6} ${704} ${y + 6} M ${696} ${y + 6} L ${702} ${y - 4}`} stroke="#0284c7" strokeWidth="1.5" fill="none" />
              </g>
            );
          })}

          {/* Entanglement CNOT Bridges */}
          {qubitIndices.slice(0, numQubits - 1).map((q) => {
            const y1 = 30 + q * rowHeight;
            const y2 = 30 + (q + 1) * rowHeight;
            const xOffset = 300 + q * 18;
            const xOffset2 = 450 + q * 18;

            return (
              <g key={`entangle-${q}`}>
                {/* Stage 1 Entanglement */}
                <line x1={xOffset} y1={y1} x2={xOffset} y2={y2} stroke="#0284c7" strokeWidth="2" strokeDasharray="2 2" />
                <circle cx={xOffset} cy={y1} r="4" fill="#0284c7" />
                <circle cx={xOffset} cy={y2} r="9" fill="#ffffff" stroke="#0284c7" strokeWidth="2" />
                <line x1={xOffset - 5} y1={y2} x2={xOffset + 5} y2={y2} stroke="#0284c7" strokeWidth="1.5" />
                <line x1={xOffset} y1={y2 - 5} x2={xOffset} y2={y2 + 5} stroke="#0284c7" strokeWidth="1.5" />

                {/* Stage 2 Entanglement */}
                <line x1={xOffset2} y1={y1} x2={xOffset2} y2={y2} stroke="#0d9488" strokeWidth="2" strokeDasharray="2 2" />
                <circle cx={xOffset2} cy={y1} r="4" fill="#0d9488" />
                <circle cx={xOffset2} cy={y2} r="9" fill="#ffffff" stroke="#0d9488" strokeWidth="2" />
                <line x1={xOffset2 - 5} y1={y2} x2={xOffset2 + 5} y2={y2} stroke="#0d9488" strokeWidth="1.5" />
                <line x1={xOffset2} y1={y2 - 5} x2={xOffset2} y2={y2 + 5} stroke="#0d9488" strokeWidth="1.5" />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-sky-600" />
            <span>H: Superposition</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-purple-600" />
            <span>Rz(x): Feature Encoding</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-teal-600" />
            <span>Ry(θ): Variational Ansatz</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-slate-600" />
            <span>⟨Z⟩: Pauli Expectation</span>
          </div>
        </div>

        <div className="italic text-slate-500 text-[11px]">
          Targeted quantum dimensionality reduction for high-impact biomarker resolution.
        </div>
      </div>
    </div>
  );
};

export default CircuitVisualizer;
