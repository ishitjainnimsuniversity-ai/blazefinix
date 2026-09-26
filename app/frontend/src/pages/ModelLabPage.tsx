import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Award,
  TrendingUp,
  Clock,
  ShieldCheck,
  RefreshCw,
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { BenchmarkResult } from '../types';
import { fetchBenchmark, trainPipeline } from '../api';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

export const ModelLabPage: React.FC = () => {
  const [benchmark, setBenchmark] = useState<BenchmarkResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [topK, setTopK] = useState(4);
  const [datasetName, setDatasetName] = useState('cardiometabolic_cohort.csv');
  const [trainingMessage, setTrainingMessage] = useState<string | null>(null);
  const [trainingError, setTrainingError] = useState<string | null>(null);

  useEffect(() => {
    loadBenchmark();
  }, []);

  async function loadBenchmark() {
    setLoading(true);
    try {
      const data = await fetchBenchmark(topK);
      setBenchmark(data);
    } catch (err) {
      console.error('Failed to load benchmark:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRetrain(e: React.FormEvent) {
    e.preventDefault();
    setRetraining(true);
    setTrainingMessage(null);
    setTrainingError(null);
    try {
      const res = await trainPipeline({
        dataset_name: datasetName,
        selected_features_count: topK,
        cv_folds: 5
      });
      if (res && res.message) {
        setTrainingMessage(res.message);
      } else {
        setTrainingMessage('Research pipeline trained and evaluated on fresh cross-validation splits.');
      }
      await loadBenchmark();
    } catch (err: any) {
      console.error(err);
      setTrainingError(err?.message || 'Benchmark execution failed. Check backend connectivity or dataset structure.');
    } finally {
      setRetraining(false);
    }
  }

  return (
    <div className="space-y-5 min-w-0 max-w-full">
      <MedicalDisclaimer compact />

      {/* Header & Controls */}
      <div className="clinical-card p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
              RESEARCH BENCHMARK LAB
            </span>
            {benchmark?.is_demo ? (
              <span className="text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                DEMONSTRATION BENCHMARK
              </span>
            ) : (
              <span className="text-xs text-slate-500">Strict Identical Split Evaluation</span>
            )}
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-1 tracking-tight">
            Classical vs Quantum vs Hybrid Benchmark Suite
          </h1>
          <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
            Empirical evaluation across linear, ensemble tree, and variational quantum circuits on identical test partitions.
          </p>
        </div>

        {/* Retraining Configuration Form */}
        <form onSubmit={handleRetrain} className="flex flex-wrap items-center gap-2.5 text-xs">
          <div>
            <label className="block text-slate-500 text-[11px] mb-1 font-medium">Cohort:</label>
            <select
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              className="px-3 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-800 text-xs focus:outline-none"
            >
              <option value="cardiometabolic_cohort.csv">Cardiometabolic (600 pts)</option>
              <option value="oncology_genomic_cohort.csv">Oncology & Genomic (500 pts)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 text-[11px] mb-1 font-medium">Qubits (Features):</label>
            <select
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="px-3 py-1.5 rounded bg-slate-50 border border-slate-300 text-slate-800 text-xs focus:outline-none font-mono"
            >
              <option value={4}>4 Features (4 Qubits)</option>
              <option value={6}>6 Features (6 Qubits)</option>
              <option value={8}>8 Features (8 Qubits)</option>
            </select>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={retraining}
              className="px-4 py-1.5 rounded bg-cyan-700 hover:bg-cyan-800 disabled:opacity-50 text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${retraining ? 'animate-spin' : ''}`} />
              <span>{retraining ? 'Executing...' : 'Execute Benchmark'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Error Message Display with Rose Red Styling */}
      {trainingError && (
        <div className="p-3.5 rounded bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold text-rose-950">EXECUTION ERROR: </strong>
            <span>{trainingError}</span>
          </div>
        </div>
      )}

      {/* Success or Demo Notice Display */}
      {trainingMessage && !trainingError && (
        <div className={`p-3.5 rounded text-xs flex items-center gap-2.5 border ${
          benchmark?.is_demo
            ? 'bg-amber-50 border-amber-300 text-amber-950'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          {benchmark?.is_demo ? (
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{trainingMessage}</span>
        </div>
      )}

      {/* Scientific Summary Statement */}
      {benchmark && (
        <div className="p-3.5 rounded bg-slate-100 border border-slate-300 text-slate-800 text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-700 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold text-slate-900">EVALUATION FINDING: </strong>
            <span>{benchmark.scientific_summary}</span>
          </div>
        </div>
      )}

      {/* Main Benchmark Metrics Table */}
      {benchmark && (
        <div className="clinical-card p-5 space-y-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Metric Performance Table</h2>
            <p className="text-xs text-slate-500">Evaluated on test partition (n = {benchmark.test_samples})</p>
          </div>

          <div className="overflow-x-auto rounded border border-slate-200">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr>
                  <th className="clinical-table-header">Model Architecture</th>
                  <th className="clinical-table-header">Accuracy</th>
                  <th className="clinical-table-header">Sensitivity (Recall)</th>
                  <th className="clinical-table-header">Specificity</th>
                  <th className="clinical-table-header">F1 Score</th>
                  <th className="clinical-table-header">ROC-AUC</th>
                  <th className="clinical-table-header">Train Time</th>
                  <th className="clinical-table-header">Latency</th>
                  <th className="clinical-table-header">Generalization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {benchmark.models_comparison.map((m) => (
                  <tr key={m.model_name} className={`hover:bg-slate-50 transition-colors ${m.is_winner ? 'bg-cyan-50/50' : ''}`}>
                    <td className="clinical-table-cell font-bold text-slate-900 flex items-center gap-2">
                      {m.is_winner && <Award className="w-4 h-4 text-amber-600 shrink-0" />}
                      <span>{m.model_name}</span>
                    </td>
                    <td className="clinical-table-cell font-mono text-slate-800 font-semibold">
                      {(m.accuracy * 100).toFixed(1)}%
                    </td>
                    <td className="clinical-table-cell font-mono text-cyan-800 font-semibold">
                      {(m.sensitivity * 100).toFixed(1)}%
                    </td>
                    <td className="clinical-table-cell font-mono text-slate-700">
                      {(m.specificity * 100).toFixed(1)}%
                    </td>
                    <td className="clinical-table-cell font-mono text-slate-700">
                      {m.f1_score.toFixed(3)}
                    </td>
                    <td className="clinical-table-cell font-mono text-slate-900 font-bold">
                      {m.roc_auc.toFixed(3)}
                    </td>
                    <td className="clinical-table-cell font-mono text-slate-500">{m.training_time}s</td>
                    <td className="clinical-table-cell font-mono text-slate-500">{m.inference_time_ms}ms</td>
                    <td className="clinical-table-cell">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {m.overfitting_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
