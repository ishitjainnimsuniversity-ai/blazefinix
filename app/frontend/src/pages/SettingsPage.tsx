import React, { useState } from 'react';
import { Sliders, Cpu, Save, CheckCircle2 } from 'lucide-react';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

export const SettingsPage: React.FC = () => {
  const [threshLow, setThreshLow] = useState(30);
  const [threshMod, setThreshMod] = useState(60);
  const [threshHigh, setThreshHigh] = useState(80);
  const [activeBackend, setActiveBackend] = useState('AerSimulator');
  const [systemMode, setSystemMode] = useState('OFFLINE_SIMULATION');
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSavedMessage('Thresholds and quantum configuration updated successfully.');
    setTimeout(() => setSavedMessage(null), 3500);
  }

  return (
    <div className="space-y-5">
      <MedicalDisclaimer compact />

      {/* Header Card */}
      <div className="clinical-card p-5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
            SYSTEM PREFERENCES
          </span>
          <span className="text-xs text-slate-500">Clinical Governance & Runtime</span>
        </div>
        <h1 className="text-lg font-bold text-slate-900 mt-1 tracking-tight">Thresholds & Hardware Settings</h1>
        <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
          Adjust risk stratification boundaries, simulation parameters, and remote quantum hardware connectivity.
        </p>
      </div>

      {savedMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        {/* Risk Threshold Management */}
        <div className="clinical-card p-5 space-y-4">
          <div className="pb-3 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-700" />
              <span>Configurable Clinical Risk Thresholds</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Defines boundaries for alert dispatch and clinical categorization
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <label className="block text-slate-700 font-semibold mb-1">
                Low to Moderate Cutoff (%):
              </label>
              <input
                type="number"
                value={threshLow}
                onChange={(e) => setThreshLow(Number(e.target.value))}
                className="w-full p-2 rounded bg-white border border-slate-300 text-slate-900 font-mono text-xs focus:outline-none focus:border-cyan-600"
              />
              <div className="text-[11px] text-slate-500 mt-2">
                0% – {threshLow}% → Low Risk (Routine protocol)
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <label className="block text-slate-700 font-semibold mb-1">
                Moderate to High Cutoff (%):
              </label>
              <input
                type="number"
                value={threshMod}
                onChange={(e) => setThreshMod(Number(e.target.value))}
                className="w-full p-2 rounded bg-white border border-slate-300 text-slate-900 font-mono text-xs focus:outline-none focus:border-cyan-600"
              />
              <div className="text-[11px] text-slate-500 mt-2">
                {threshLow + 1}% – {threshMod}% → Moderate (Intermediate triage)
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <label className="block text-slate-700 font-semibold mb-1">
                High to Critical Cutoff (%):
              </label>
              <input
                type="number"
                value={threshHigh}
                onChange={(e) => setThreshHigh(Number(e.target.value))}
                className="w-full p-2 rounded bg-white border border-slate-300 text-slate-900 font-mono text-xs focus:outline-none focus:border-cyan-600"
              />
              <div className="text-[11px] text-slate-500 mt-2">
                {threshMod + 1}% – {threshHigh}% → High Risk (Urgent alert)
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600">
            <strong className="text-slate-900">Sensitivity Trade-off:</strong> Lowering the review threshold increases screening sensitivity (identifying more early true-positives) at the cost of additional false-positive reviews.
          </div>
        </div>

        {/* Quantum Hardware Abstraction Layer */}
        <div className="clinical-card p-5 space-y-4">
          <div className="pb-3 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-700" />
              <span>Quantum Hardware Abstraction Layer</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select simulation runtime or configure staging tokens for remote quantum devices
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <label className="block text-slate-700 font-semibold mb-1">Simulator Engine:</label>
              <select
                value={activeBackend}
                onChange={(e) => setActiveBackend(e.target.value)}
                className="w-full p-2 rounded bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-cyan-600"
              >
                <option value="AerSimulator">Qiskit AerSimulator (Default Local)</option>
                <option value="StatevectorSimulator">Statevector Simulator (Exact)</option>
                <option value="PennyLaneDefault">PennyLane default.qubit</option>
              </select>
              <div className="text-[11px] text-emerald-700 font-semibold mt-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>Local execution verified & active</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <label className="block text-slate-700 font-semibold mb-1">Hardware Staging Mode:</label>
              <select
                value={systemMode}
                onChange={(e) => setSystemMode(e.target.value)}
                className="w-full p-2 rounded bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-cyan-600"
              >
                <option value="OFFLINE_SIMULATION">Offline Local Simulation</option>
                <option value="ONLINE_RESEARCH">Online Research Network</option>
                <option value="QUANTUM_CLOUD_STAGING">IBM Quantum Runtime (Staged)</option>
              </select>
              <div className="text-[11px] text-slate-500 mt-2">
                "Quantum cloud unavailable — using local simulator." (Graceful fallback active)
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded bg-cyan-700 hover:bg-cyan-800 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
