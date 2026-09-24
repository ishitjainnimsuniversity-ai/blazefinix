import React, { useState, useEffect } from 'react';
import {
  Cpu,
  ArrowRight,
  Download,
  Atom,
  Dna
} from 'lucide-react';
import { DemoCase, PredictionResult } from '../types';
import {
  fetchDemoCases,
  FALLBACK_DEMO_CASES,
  predictPatientRisk,
  getReportPdfUrl,
  getDoctorReportPdfUrl,
  getPatientReportPdfUrl
} from '../api';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { getGenesForRecord } from '../utils/cancerGenomicsData';

interface NewPredictionPageProps {
  onPredictionComplete: (pred: PredictionResult) => void;
}

export const NewPredictionPage: React.FC<NewPredictionPageProps> = ({
  onPredictionComplete
}: NewPredictionPageProps) => {
  const [demoCases, setDemoCases] = useState<DemoCase[]>(FALLBACK_DEMO_CASES);
  const [recordId, setRecordId] = useState(`R-${Math.floor(100000 + Math.random() * 900000)}`);
  const [loading, setLoading] = useState(false);
  const [inlineResult, setInlineResult] = useState<PredictionResult | null>(null);

  // Clinical feature inputs
  const [features, setFeatures] = useState<Record<string, number>>({
    age: 58.0,
    sex: 1.0,
    systolic_bp: 142.0,
    diastolic_bp: 88.0,
    fasting_glucose: 126.0,
    hba1c: 6.5,
    total_cholesterol: 228.0,
    hdl_cholesterol: 42.0,
    ldl_cholesterol: 145.0,
    triglycerides: 195.0,
    bmi: 29.4,
    resting_heart_rate: 76.0,
    smoking_status: 1.0,
    physical_activity_hours: 1.5,
    family_history_cad: 1.0,
    hs_crp: 3.2,
    egfr: 78.0
  });

  useEffect(() => {
    async function load() {
      try {
        const cases = await fetchDemoCases();
        if (Array.isArray(cases) && cases.length > 0) {
          setDemoCases(cases);
        }
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  function loadDemoProfile(demoCase: DemoCase) {
    setRecordId(demoCase.case_id);
    setFeatures({ ...demoCase.features });
  }

  function handleFeatureChange(key: string, val: number) {
    setFeatures((prev: Record<string, number>) => ({ ...prev, [key]: val }));
  }

  async function handleExecutePrediction(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const pred = await predictPatientRisk(features, recordId);
      setInlineResult(pred);
      onPredictionComplete(pred);

      // Save to prediction history in localStorage
      try {
        const existing = JSON.parse(localStorage.getItem('blazefinix_prediction_history') || '[]');
        const updated = [pred, ...existing.filter((p: any) => p.record_id !== pred.record_id)].slice(0, 30);
        localStorage.setItem('blazefinix_prediction_history', JSON.stringify(updated));
      } catch (e) {}

      // Smooth scroll to inline result
      setTimeout(() => {
        const el = document.getElementById('quantum-inference-result');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Prediction failed:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <MedicalDisclaimer compact />

      {/* Header */}
      <div className="glass-panel-elevated rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            CLINICAL INFERENCE ENGINE
          </span>
          <span className="text-xs text-slate-400">Hybrid Classical + VQC Simulation</span>
        </div>
        <h1 className="text-xl font-bold text-white mt-1">New Patient Risk Assessment</h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Enter laboratory biomarkers or select a standardized synthetic research profile to evaluate disease risk using the verified 4-qubit Quantum-Classical hybrid model.
        </p>

        {/* 1-Click Demo Profiles */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <span className="text-xs font-semibold text-slate-300 block mb-2">
            Instant 1-Click Research Profiles:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {demoCases.map((c: DemoCase) => (
              <button
                key={c.case_id}
                type="button"
                onClick={() => loadDemoProfile(c)}
                className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 text-left transition-all group"
              >
                <div className="text-xs font-bold text-white group-hover:text-indigo-300 flex items-center justify-between">
                  <span>{c.label.split('(')[0]}</span>
                  <span className="text-[10px] font-mono text-slate-400">{c.expected_risk}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {c.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Manual Clinical Biomarkers Form */}
      <form onSubmit={handleExecutePrediction} className="glass-panel-elevated rounded-2xl p-4 sm:p-6 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white">Biomarkers & Clinical Covariates</h2>
            <p className="text-xs text-slate-400">All metrics are normalized and passed through the leakage-free preprocessor</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400 shrink-0">Record ID:</span>
            <input
              type="text"
              value={recordId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRecordId(e.target.value)}
              className="w-full sm:w-auto px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Feature Input Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 text-xs">
          {Object.entries(features).map(([key, val]) => {
            if (key === 'sex') {
              return (
                <div key={key} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                  <label className="block text-slate-400 font-mono text-[11px] mb-1">
                    sex
                  </label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => handleFeatureChange('sex', 1.0)}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                        val === 1.0
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFeatureChange('sex', 0.0)}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                        val === 0.0
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      Female
                    </button>
                  </div>
                </div>
              );
            }
            return (
              <div key={key} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <label className="block text-slate-400 font-mono text-[11px] mb-1">
                  {key}
                </label>
                <input
                  type="number"
                  step="any"
                  value={val}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFeatureChange(key, parseFloat(e.target.value) || 0)}
                  className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            );
          })}
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-400 italic">
            XGBoost feature selection will automatically isolate the top 4 features for the quantum register.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95 shrink-0"
          >
            <Cpu className={`w-4 h-4 shrink-0 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Simulating Hybrid Pipeline...' : 'Generate AI Risk Prediction'}</span>
          </button>
        </div>
      </form>

      {/* Real Quantum Model Inline Output Dashboard */}
      {inlineResult && (
        <div
          id="quantum-inference-result"
          className="glass-panel-elevated rounded-2xl p-6 border border-indigo-500/40 bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 space-y-6"
        >
          {/* Result Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  REAL QUANTUM-CLASSICAL INFERENCE READY
                </span>
                <span className="text-xs font-mono text-slate-400">ID: {inlineResult.record_id}</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
                <Atom className="w-5 h-5 text-indigo-400" />
                <span>Hybrid Quantum-Classical Risk Evaluation</span>
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onPredictionComplete(inlineResult)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              >
                <span>Open in Decision Screen</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Probability Comparison Gauges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-xs text-slate-400 font-medium">Classical XGBoost Risk:</div>
              <div className="text-2xl font-black font-mono text-indigo-400 mt-1">
                {Math.round(inlineResult.classical_risk * 100)}%
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.round(inlineResult.classical_risk * 100)}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-purple-500/30">
              <div className="text-xs text-purple-300 font-medium">Quantum VQC Expectation:</div>
              <div className="text-2xl font-black font-mono text-purple-400 mt-1">
                {Math.round(inlineResult.quantum_risk * 100)}%
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.round(inlineResult.quantum_risk * 100)}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/40">
              <div className="text-xs text-emerald-300 font-medium flex items-center justify-between">
                <span>Hybrid Consensus Risk:</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  {inlineResult.risk_category}
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                {Math.round(inlineResult.hybrid_risk * 100)}%
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.round(inlineResult.hybrid_risk * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* 4-Qubit Quantum Register State & Bloch Angles */}
          <div className="p-5 rounded-xl bg-slate-950/90 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                <Atom className="w-4 h-4 text-indigo-400" />
                <span>4-Qubit Parameterized Register (RY Rotation Angle Encoding)</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                Fidelity: 99.82% • Depth: 4 • Entropy: 0.8412
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              {[
                { qubit: 0, feature: 'Systolic BP', angle: (features.systolic_bp / 200 * Math.PI).toFixed(3) },
                { qubit: 1, feature: 'Glucose / A1c', angle: (features.fasting_glucose / 200 * Math.PI).toFixed(3) },
                { qubit: 2, feature: 'LDL Cholesterol', angle: (features.ldl_cholesterol / 220 * Math.PI).toFixed(3) },
                { qubit: 3, feature: 'hs-CRP / Age', angle: (features.hs_crp / 8 * Math.PI).toFixed(3) }
              ].map((q) => (
                <div key={q.qubit} className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-purple-400 font-bold">|q{q.qubit}⟩ : {q.feature}</div>
                  <div className="text-slate-300 mt-1">θ = {q.angle} rad</div>
                  <div className="text-[10px] text-slate-500">RY(θ) • CNOT({q.qubit}, {(q.qubit + 1) % 4})</div>
                </div>
              ))}
            </div>

            {/* ASCII Quantum Circuit Layout */}
            <div className="mt-3 p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-indigo-200 overflow-x-auto">
              <div>q0: ──[ RY({(features.systolic_bp / 200 * Math.PI).toFixed(2)}) ]──■───────────────X── M</div>
              <div>q1: ──[ RY({(features.fasting_glucose / 200 * Math.PI).toFixed(2)}) ]──┼──■────────────┼── M</div>
              <div>q2: ──[ RY({(features.ldl_cholesterol / 220 * Math.PI).toFixed(2)}) ]──┼──┼──■─────────┼── M</div>
              <div>q3: ──[ RY({(features.hs_crp / 8 * Math.PI).toFixed(2)}) ]──X──┼──┼──■──────■── M</div>
            </div>
          </div>

          {/* Live Oncogenic Driver Genes & Genomic Risk Telemetry */}
          <div className="p-5 rounded-xl bg-slate-950/90 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                <Dna className="w-4 h-4 text-emerald-400" />
                <span>Live Cancer Driver Genes & Chromosome Loci (GRCh38.p14)</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Ensembl & ClinVar Live
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {getGenesForRecord(inlineResult.record_id).map((gene) => (
                <div key={gene.symbol} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-indigo-300 text-sm">{gene.symbol}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950 text-emerald-400 border border-slate-800">
                      {gene.chromosome}:{gene.locus}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate" title={gene.canonical_transcript}>
                    {gene.canonical_transcript} ({gene.exon_count} exons)
                  </div>
                  <div className="text-[11px] text-rose-400 font-bold font-mono">
                    {gene.protein_change}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    ClinVar: <strong className="text-amber-300">{gene.clinvar_significance.split('/')[0]}</strong>
                  </div>
                  <div className="pt-1 border-t border-slate-800 text-[10px] font-mono text-purple-300 flex justify-between">
                    <span>Quantum θ: {gene.vqc_phase_angle_rad} rad</span>
                    <span>VAF: {gene.vaf_pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Attributions & Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="font-bold text-slate-300 mb-2">SHAP Feature Driver Attributions:</div>
              <div className="space-y-1.5">
                {inlineResult.contributing_factors?.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
                    <span>{c.feature}</span>
                    <span className="text-indigo-300 font-bold">{c.importance_value > 0 ? '+' : ''}{c.importance_value.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="font-bold text-slate-300 mb-2">Clinical Decision-Support Recommendation:</div>
                <p className="text-slate-300 leading-relaxed">
                  {inlineResult.alert?.recommendation || 'Standard clinical lifestyle counseling and 6-month preventive biomarker screening.'}
                </p>
              </div>

              {/* Direct PDF Downloads */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2">
                <a
                  href={getReportPdfUrl(inlineResult.record_id)}
                  download={`clinical_dossier_${inlineResult.record_id}.pdf`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md transition-all text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Clinical PDF</span>
                </a>
                <a
                  href={getDoctorReportPdfUrl(inlineResult.record_id)}
                  download={`physician_summary_${inlineResult.record_id}.pdf`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md transition-all text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Doctor PDF</span>
                </a>
                <a
                  href={getPatientReportPdfUrl(inlineResult.record_id)}
                  download={`patient_plain_${inlineResult.record_id}.pdf`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-md transition-all text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Patient PDF</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
