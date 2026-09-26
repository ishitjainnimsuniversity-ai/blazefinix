import React from 'react';
import { X, ShieldCheck, Cpu, Info, CheckCircle2, AlertTriangle, RefreshCw, Terminal } from 'lucide-react';
import { SystemCapabilities, setModeOverride, getModeOverride } from '../api';

interface DemoInfoModalProps {
  isOpen: boolean;
  capabilities: SystemCapabilities | null;
  onClose: () => void;
  onRefresh: () => void;
}

export const DemoInfoModal: React.FC<DemoInfoModalProps> = ({
  isOpen,
  capabilities,
  onClose,
  onRefresh
}) => {
  if (!isOpen) return null;

  const currentOverride = getModeOverride();
  const isReal = capabilities?.mode === 'real';

  function handleSetOverride(mode: 'real' | 'demo' | null) {
    setModeOverride(mode);
    onRefresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-bold text-base tracking-tight text-white">System Architecture & Execution Mode</h3>
              <p className="text-xs text-slate-400">BlazeFinix Runtime Capability & Deployment Audit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-slate-800 text-xs max-h-[80vh] overflow-y-auto">
          {/* Status Alert Banner */}
          <div
            className={`p-4 rounded border flex items-start gap-3 ${
              isReal
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}
          >
            {isReal ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold text-sm tracking-tight">
                {isReal ? 'REAL INFERENCE ENGINE ACTIVE' : 'DEMONSTRATION MODE — PUBLIC DEPLOYMENT'}
              </div>
              <p className="mt-1 leading-relaxed text-xs">
                {isReal
                  ? 'Connected to live Python FastAPI backend. Model predictions, PennyLane QML circuits, and XGBoost models are executing live.'
                  : 'This hosted demo uses simulated results because the full local ML/QML inference environment is not deployed with this Vercel demo. The complete hybrid classical-quantum pipeline is fully implemented and can be executed locally.'}
              </p>
            </div>
          </div>

          {/* Capability Matrix */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
              Deployment Capability Matrix
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded border border-slate-200 bg-slate-50 flex flex-col justify-between">
                <span className="text-slate-500 text-[11px] font-medium">Risk Inference</span>
                <span className={`font-bold font-mono text-xs ${capabilities?.inference ? 'text-emerald-700' : 'text-amber-800'}`}>
                  {capabilities?.inference ? '● Live Backend' : '○ Deterministic Demo'}
                </span>
              </div>
              <div className="p-3 rounded border border-slate-200 bg-slate-50 flex flex-col justify-between">
                <span className="text-slate-500 text-[11px] font-medium">QML Circuits</span>
                <span className={`font-bold font-mono text-xs ${capabilities?.quantum ? 'text-emerald-700' : 'text-amber-800'}`}>
                  {capabilities?.quantum ? '● PennyLane Live' : '○ Client QNN Engine'}
                </span>
              </div>
              <div className="p-3 rounded border border-slate-200 bg-slate-50 flex flex-col justify-between">
                <span className="text-slate-500 text-[11px] font-medium">Model Retraining</span>
                <span className={`font-bold font-mono text-xs ${capabilities?.training ? 'text-emerald-700' : 'text-amber-800'}`}>
                  {capabilities?.training ? '● Cross-Validation' : '○ Pre-computed Baseline'}
                </span>
              </div>
              <div className="p-3 rounded border border-slate-200 bg-slate-50 flex flex-col justify-between">
                <span className="text-slate-500 text-[11px] font-medium">Clinical Reports</span>
                <span className="font-bold font-mono text-xs text-emerald-700">● Interactive Export</span>
              </div>
              <div className="p-3 rounded border border-slate-200 bg-slate-50 flex flex-col justify-between">
                <span className="text-slate-500 text-[11px] font-medium">Genomic Cross-Ref</span>
                <span className="font-bold font-mono text-xs text-emerald-700">● Interactive DB</span>
              </div>
              <div className="p-3 rounded border border-slate-200 bg-slate-50 flex flex-col justify-between">
                <span className="text-slate-500 text-[11px] font-medium">Vision Derm AI</span>
                <span className="font-bold font-mono text-xs text-emerald-700">● Active Simulator</span>
              </div>
            </div>
          </div>

          {/* Architecture Concept */}
          <div className="p-3.5 rounded bg-slate-100 border border-slate-200 font-mono text-[11px] space-y-1 text-slate-700">
            <div className="font-bold text-slate-900 font-sans mb-1 text-xs">Architecture Topology:</div>
            <div>LOCAL / FULL SYSTEM : FastAPI + Classical ML + PennyLane QML</div>
            <div>VERCEL / PUBLIC DEMO : React SPA + Deterministic Execution Adapter</div>
          </div>

          {/* How to run locally */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-slate-600" />
              <span>How to Run Real Pipeline Locally</span>
            </h4>
            <div className="p-3 rounded bg-slate-900 text-slate-200 font-mono text-[11px] space-y-1">
              <div className="text-slate-400"># 1. Start Python FastAPI backend (Port 8000)</div>
              <div className="text-emerald-400">python app/backend/main.py</div>
              <div className="text-slate-400 pt-1"># 2. Start Vite Frontend (Port 3000)</div>
              <div className="text-emerald-400">cd app/frontend && npm run dev</div>
            </div>
          </div>

          {/* Mode Override Controls */}
          <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-slate-700 text-xs block">Execution Mode Override:</span>
              <span className="text-slate-500 text-[11px]">Active Override: {currentOverride ? currentOverride.toUpperCase() : 'None (Auto-Detect)'}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSetOverride(null)}
                className={`px-2.5 py-1 rounded text-xs font-medium border cursor-pointer ${
                  !currentOverride ? 'bg-cyan-700 text-white border-cyan-800' : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                Auto-Detect
              </button>
              <button
                onClick={() => handleSetOverride('real')}
                className={`px-2.5 py-1 rounded text-xs font-medium border cursor-pointer ${
                  currentOverride === 'real' ? 'bg-emerald-700 text-white border-emerald-800' : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                Force REAL
              </button>
              <button
                onClick={() => handleSetOverride('demo')}
                className={`px-2.5 py-1 rounded text-xs font-medium border cursor-pointer ${
                  currentOverride === 'demo' ? 'bg-amber-700 text-white border-amber-800' : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                Force DEMO
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs cursor-pointer"
          >
            Close Info Modal
          </button>
        </div>
      </div>
    </div>
  );
};
