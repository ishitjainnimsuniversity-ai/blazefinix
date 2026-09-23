import React, { useState, useEffect } from 'react';
import {
  fetchSamplePatientsList,
  uploadPatientReportPdfApi,
  evaluateQmlCmlApi,
  downloadQmlCmlPdfApi
} from '../api';

export const PatientReportUploaderPage: React.FC = () => {
  const [sampleList, setSampleList] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState<string>('TCGA-BH-A0B2');
  const [numQubits, setNumQubits] = useState<number>(20);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showRawText, setShowRawText] = useState<boolean>(false);

  useEffect(() => {
    fetchSamplePatientsList()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSampleList(data);
          loadSample(data[0].id, 20);
        }
      })
      .catch((err) => {
        setErrorMsg('LOCAL COMPUTATION OFFLINE: Could not reach backend sample service.');
      });
  }, []);

  async function loadSample(sampleId: string, qubits: number) {
    setSelectedSampleId(sampleId);
    setSelectedFile(null);
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await uploadPatientReportPdfApi(undefined, sampleId, qubits);
      setAnalysisResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load sample patient.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setSelectedSampleId('');
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await uploadPatientReportPdfApi(file, undefined, numQubits);
      setAnalysisResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse uploaded PDF.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleQubitCountChange(newQubits: number) {
    setNumQubits(newQubits);
    if (!analysisResult?.features_20q) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const evalRes = await evaluateQmlCmlApi(analysisResult.features_20q, newQubits);
      setAnalysisResult((prev: any) => ({
        ...prev,
        cml_metrics: evalRes.cml_metrics,
        qml_metrics: evalRes.qml_metrics,
        hybrid_metrics: evalRes.hybrid_metrics,
        qubit_diagnostics: evalRes.qubit_diagnostics,
        shap_attributions: evalRes.shap_attributions
      }));
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to re-evaluate with new qubits.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDownloadPdf() {
    if (!analysisResult) return;
    setIsDownloadingPdf(true);
    try {
      const blob = await downloadQmlCmlPdfApi(analysisResult);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dual_qml_cml_report_${analysisResult.patient_id || 'PATIENT'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to generate PDF. Make sure backend ReportLab service is active.');
    } finally {
      setIsDownloadingPdf(false);
    }
  }

  const p = analysisResult;
  const cml = analysisResult?.cml_metrics;
  const qml = analysisResult?.qml_metrics;
  const hybrid = analysisResult?.hybrid_metrics;
  const qubits = analysisResult?.qubit_diagnostics || [];
  const mutations = analysisResult?.detected_mutations || [];
  const shapList = analysisResult?.shap_attributions || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Biomedical Extraction
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              PennyLane default.qubit (20Q)
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-100 mt-2">
            Patient Report PDF Uploader &amp; Multi-Omics Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Parses patient clinical PDFs via <code>pypdf</code>, extracts somatic drivers into 20 standardized biomarkers, and executes genuine dual classical ML and PennyLane 20-qubit quantum simulation.
          </p>
        </div>

        {/* Action Button */}
        {analysisResult && (
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isDownloadingPdf ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <span>📄</span>
                <span>Download Clinical Dossier PDF</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Offline / Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => loadSample(selectedSampleId || 'TCGA-BH-A0B2', numQubits)}
            className="px-3 py-1 bg-red-900 hover:bg-red-800 text-white rounded-lg font-semibold cursor-pointer"
          >
            Retry Local Server
          </button>
        </div>
      )}

      {/* Upload and Sample Selection Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sample Patient Dossiers Picker */}
        <div className="md:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Select Verified Clinical Dossier
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sampleList.map((s) => (
                <button
                  key={s.id}
                  onClick={() => loadSample(s.id, numQubits)}
                  className={`text-left p-2.5 rounded-xl text-xs transition-all border cursor-pointer ${
                    selectedSampleId === s.id
                      ? 'bg-indigo-600/30 border-indigo-500 text-white font-medium shadow-md shadow-indigo-500/10'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="font-semibold text-slate-200 truncate">{s.title.split('—')[0]}</div>
                  <div className="text-[11px] text-slate-400 truncate">{s.diagnosis}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Upload Custom Medical PDF */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Upload Patient PDF Report
            </label>
            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-xl p-4 text-center transition-colors">
              <input
                type="file"
                accept=".pdf"
                id="pdf-upload-input"
                className="hidden"
                onChange={handleFileUpload}
              />
              <label htmlFor="pdf-upload-input" className="cursor-pointer block">
                <span className="text-2xl block mb-1">📁</span>
                <span className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 block">
                  Click to select medical PDF
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">
                  Extracts genomics &amp; labs via <code>pypdf</code>
                </span>
              </label>
            </div>
            {selectedFile && (
              <div className="mt-2 text-xs text-emerald-400 truncate flex items-center gap-1">
                <span>✓</span> {selectedFile.name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Analysis Output */}
      {isLoading ? (
        <div className="p-16 text-center bg-slate-900/60 border border-slate-800 rounded-2xl">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-200">Executing PennyLane 20Q Quantum Simulation &amp; Classical ML...</p>
          <p className="text-xs text-slate-400 mt-1">Calculating 2<sup>{numQubits}</sup> state amplitudes and exact Pauli-Z expectations</p>
        </div>
      ) : analysisResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Bar: Dual Engine Consensus Banner */}
          <div className="lg:col-span-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              {/* Hybrid Score Card */}
              <div className="md:col-span-1 bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Dual-Engine Consensus</div>
                <div className={`text-2xl font-black mt-0.5 ${
                  hybrid?.risk_tier === 'Very High Risk' || hybrid?.risk_tier === 'High Risk'
                    ? 'text-red-400'
                    : 'text-emerald-400'
                }`}>
                  {Math.round((hybrid?.hybrid_risk_score || 0) * 100)}%
                </div>
                <div className="text-[11px] font-semibold text-slate-300">{hybrid?.risk_tier}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  &plusmn;{hybrid?.epistemic_uncertainty} Uncertainty
                </div>
              </div>

              {/* Classical vs Quantum Breakdown */}
              <div className="md:col-span-1 bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Classical ML (XGB/Ada):</span>
                  <span className="font-bold text-indigo-400">{Math.round((cml?.classical_risk_score || 0) * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{numQubits}-Qubit PennyLane:</span>
                  <span className="font-bold text-purple-400">{Math.round((qml?.quantum_risk_score || 0) * 100)}%</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Execution Time:</span>
                  <span>{qml?.execution_time_ms} ms</span>
                </div>
              </div>

              {/* Dynamic Qubit Register Slider */}
              <div className="md:col-span-1 bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-slate-400 font-semibold">Active Qubits:</span>
                  <span className="font-mono font-bold text-purple-400">{numQubits} Wires</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="2"
                    max="20"
                    step="1"
                    value={numQubits}
                    onChange={(e) => handleQubitCountChange(Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {Math.pow(2, numQubits).toLocaleString()} Hilbert States | {qml?.execution_mode || 'FORWARD_EVAL'}
                </div>
              </div>

              {/* Patient Core Summary */}
              <div className="md:col-span-1 bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs">
                <div className="font-bold text-slate-200 mb-1 truncate">{p?.patient_id}</div>
                <div className="text-slate-400">{p?.age} y/o {p?.sex} • {p?.stage}</div>
                <div className="text-slate-400 mt-1">
                  VAF: <span className="text-emerald-400 font-bold">{p?.vaf_pct}%</span> • TMB: <span className="text-amber-400 font-bold">{p?.tmb_score} mut/Mb</span>
                </div>
              </div>
            </div>
          </div>

          {/* Left Column: CML & SHAP Attribution Analysis */}
          <div className="lg:col-span-1 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>📊</span> CML Feature Attributions (SHAP)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Local impact of extracted clinical biomarkers on risk elevation.
              </p>
            </div>

            <div className="space-y-3">
              {shapList.map((s: any, idx: number) => (
                <div key={idx} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-200">{s.feature}</span>
                    <span className="font-mono font-bold text-red-400">+{s.shap_value}</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-red-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, s.shap_value * 350)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                    <span>Target: {s.gene}</span>
                    <span className="text-red-400/80">{s.direction}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Extracted Driver Mutations List */}
            <div className="pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Extracted Somatic Drivers ({mutations.length})
              </h4>
              <div className="space-y-1.5">
                {mutations.length === 0 ? (
                  <div className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/60 text-xs text-slate-400">
                    No pathogenic somatic mutations found in text (wild-type).
                  </div>
                ) : (
                  mutations.map((m: any, idx: number) => (
                    <div key={idx} className="p-2 rounded-lg bg-slate-950/40 border border-slate-800/60 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-indigo-300">{m.gene}</span>{' '}
                        <span className="text-slate-400">({m.mutation})</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-semibold">{m.vaf}% VAF</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: 20-Qubit Quantum Diagnostics Grid */}
          <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>⚛️</span> {numQubits}-Qubit Quantum Diagnostics
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Analytical Pauli expectations &lang;Z&rang;, projective shots, and Bloch coordinates from PennyLane.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="bg-purple-950/60 border border-purple-800/40 px-3 py-1 rounded-lg">
                  Mode: <strong className="text-purple-300 font-mono">{qml?.execution_mode || 'FORWARD_EVAL'}</strong>
                </div>
                <div className="bg-indigo-950/60 border border-indigo-800/40 px-3 py-1 rounded-lg">
                  Observed States: <strong className="text-indigo-300 font-mono">{qml?.total_observed_states || 0}</strong>
                </div>
              </div>
            </div>

            {/* Qubit Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
              {qubits.map((q: any) => {
                const isHighRisk = q.pauli_z < 0;
                return (
                  <div
                    key={q.qubit_index}
                    className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-purple-500/50 transition-colors text-xs flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-purple-400 font-mono text-[11px]">
                        q<sub>{q.qubit_index}</sub>
                      </span>
                      <span className="text-[10px] px-1 rounded bg-slate-800 text-slate-300 font-semibold truncate max-w-[60px]">
                        {q.gene}
                      </span>
                    </div>

                    <div className="my-1">
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>&lang;Z&rang;:</span>
                        <span className={`font-mono font-bold ${isHighRisk ? 'text-red-400' : 'text-emerald-400'}`}>
                          {q.pauli_z}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>P(|1&rang;):</span>
                        <span className="font-mono text-slate-200">{Math.round(q.prob_state_1 * 100)}%</span>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-slate-800/60 text-[9px] font-mono text-slate-500 truncate">
                      ({q.bloch_coords.x}, {q.bloch_coords.y}, {q.bloch_coords.z})
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quantum Circuit Specs Footer */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
              <span>Circuit Depth: <strong className="text-slate-200">{qml?.circuit_depth}</strong></span>
              <span>Entangling Gates: <strong className="text-slate-200">{qml?.entangling_gates_count} CNOT</strong></span>
              <span>Backend: <strong className="text-purple-400 font-mono">{qml?.backend}</strong></span>
              <button
                onClick={() => setShowRawText(!showRawText)}
                className="text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
              >
                {showRawText ? 'Hide Source Snippet' : 'View Source Text'}
              </button>
            </div>

            {showRawText && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
                {analysisResult.raw_text_snippet}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
