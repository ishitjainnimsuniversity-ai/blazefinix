import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Cpu,
  FileText,
  ShieldAlert,
  Download,
  ChevronDown,
  ChevronUp,
  Info,
  UserCheck
} from 'lucide-react';
import { PredictionResult, DemoCase } from '../types';
import {
  fetchDemoCases,
  FALLBACK_DEMO_CASES,
  FALLBACK_CLINICAL_REPORTS,
  predictPatientRisk,
  acknowledgeAlert,
  submitDoctorFeedback,
  getReportHtmlUrl,
  getReportPdfUrl,
  getDoctorReportPdfUrl,
  getPatientReportPdfUrl
} from '../api';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

interface ClinicalDecisionPageProps {
  initialRecordId?: string;
}

export const ClinicalDecisionPage: React.FC<ClinicalDecisionPageProps> = ({
  initialRecordId
}) => {
  const [demoCases, setDemoCases] = useState<DemoCase[]>(FALLBACK_DEMO_CASES);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(initialRecordId || 'DEMO-HIGH-03');
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Doctor feedback inline modal state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [agreement, setAgreement] = useState<'AGREE' | 'PARTIAL' | 'DISAGREE' | 'NEEDS_REVIEW'>('AGREE');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [clinicianName, setClinicianName] = useState('Dr. Clinical Attending');

  // Load demo cases on mount or when initialRecordId changes
  useEffect(() => {
    async function init() {
      try {
        const cases = await fetchDemoCases();
        const finalCases = Array.isArray(cases) && cases.length > 0 ? cases : FALLBACK_DEMO_CASES;
        setDemoCases(finalCases);

        const targetId = initialRecordId;
        if (targetId) {
          try {
            const hist = JSON.parse(localStorage.getItem('blazefinix_prediction_history') || '[]');
            const foundInHist = hist.find((p: any) => p.record_id === targetId);
            if (foundInHist) {
              setSelectedCaseId(targetId);
              setPrediction(foundInHist);
              return;
            }
          } catch (e) {}

          if (FALLBACK_CLINICAL_REPORTS[targetId]) {
            const rep = FALLBACK_CLINICAL_REPORTS[targetId];
            setSelectedCaseId(targetId);
            setPrediction(rep);
            return;
          }

          const matchedCase = finalCases.find((c) => c.case_id === targetId);
          if (matchedCase) {
            setSelectedCaseId(matchedCase.case_id);
            await runPredictionForCase(matchedCase);
            return;
          }

          const customPred = await predictPatientRisk({}, targetId);
          setSelectedCaseId(targetId);
          setPrediction(customPred);
          return;
        }

        const defaultCase = finalCases.find((c) => c.case_id.includes('HIGH')) || finalCases[0];
        setSelectedCaseId(defaultCase.case_id);
        await runPredictionForCase(defaultCase);
      } catch (err) {
        console.warn('Fallback loading in ClinicalDecisionPage:', err);
        const fallbackCase = FALLBACK_DEMO_CASES[2] || FALLBACK_DEMO_CASES[0];
        setSelectedCaseId(fallbackCase.case_id);
        await runPredictionForCase(fallbackCase);
      }
    }
    init();
  }, [initialRecordId]);

  async function runPredictionForCase(demoCase: DemoCase) {
    setLoading(true);
    setActionSuccess(null);
    try {
      const res = await predictPatientRisk(demoCase.features, demoCase.case_id);
      setPrediction(res);
    } catch (err) {
      console.warn('Local risk prediction fallback:', err);
      const fallbackPred = await predictPatientRisk(demoCase.features || {}, demoCase.case_id);
      setPrediction(fallbackPred);
    } finally {
      setLoading(false);
    }
  }

  function handleCaseChange(caseId: string) {
    setSelectedCaseId(caseId);
    if (FALLBACK_CLINICAL_REPORTS[caseId]) {
      setPrediction(FALLBACK_CLINICAL_REPORTS[caseId]);
      return;
    }
    const targetCase = demoCases.find((c) => c.case_id === caseId);
    if (targetCase) {
      runPredictionForCase(targetCase);
    }
  }

  async function handleAcknowledge() {
    if (!prediction?.alert) return;
    try {
      await acknowledgeAlert(prediction.alert.alert_id, clinicianName, 'Acknowledged during session.');
      setActionSuccess('Alert acknowledged successfully by attending clinician.');
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSubmitFeedback(e: React.FormEvent) {
    e.preventDefault();
    if (!prediction) return;
    try {
      await submitDoctorFeedback({
        alert_id: prediction.alert?.alert_id,
        record_id: prediction.record_id,
        agreement,
        clinical_notes: clinicalNotes || 'Prediction reviewed against standard clinical baseline indicators.',
        reviewer_name: clinicianName
      });
      setFeedbackOpen(false);
      setActionSuccess('Doctor feedback logged to audit repository.');
    } catch (err) {
      console.error(err);
    }
  }

  const isDemoData = selectedCaseId.startsWith('DEMO-') || selectedCaseId.startsWith('PAT-') || selectedCaseId.startsWith('HIGH-') || selectedCaseId.startsWith('LOW-');

  return (
    <div className="space-y-6">
      {/* Top Clinical Disclaimer */}
      <MedicalDisclaimer />

      {/* Toolbar & Patient Case Selector */}
      <div className="clinical-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Select Patient Case:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {demoCases.slice(0, 3).map((c) => (
              <button
                key={c.case_id}
                onClick={() => handleCaseChange(c.case_id)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  selectedCaseId === c.case_id
                    ? 'bg-teal-600 text-white font-semibold'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-700 border border-slate-700'
                }`}
              >
                {c.case_id}
              </button>
            ))}

            <select
              value={selectedCaseId}
              onChange={(e) => handleCaseChange(e.target.value)}
              className="px-3 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 text-xs font-mono focus:outline-none focus:border-teal-500"
            >
              <option value="" disabled>Select Cohort Case...</option>
              {Object.keys(FALLBACK_CLINICAL_REPORTS).map((id) => (
                <option key={id} value={id}>
                  {id} — {FALLBACK_CLINICAL_REPORTS[id].risk_category || 'Patient'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {prediction && (
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={getReportPdfUrl(prediction.record_id)}
              download={`clinical_report_${prediction.record_id}.pdf`}
              className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span>Clinical PDF</span>
            </a>
            <a
              href={getDoctorReportPdfUrl(prediction.record_id)}
              download={`physician_dossier_${prediction.record_id}.pdf`}
              className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span>Physician Dossier</span>
            </a>
            <a
              href={getReportHtmlUrl(prediction.record_id)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Web Summary</span>
            </a>
          </div>
        )}
      </div>

      {actionSuccess && (
        <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Clinical Result Surface */}
      {prediction ? (
        <div className="space-y-6">
          {/* Demonstration Data Banner */}
          {isDemoData && (
            <div className="demo-data-banner">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>DEMONSTRATION DATA:</strong> This record is sample research cohort data. Results are presented for workflow evaluation.
              </span>
            </div>
          )}

          {/* 1. Patient Context Header & Primary Result Card */}
          <div className="clinical-card-elevated p-6 space-y-6">
            {/* Header info */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-700/80 gap-4">
              <div>
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  PATIENT CONTEXT
                </div>
                <div className="text-xl font-bold font-mono text-white mt-0.5">
                  ID: {prediction.record_id}
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-3 font-mono">
                  <span>Age: {prediction.features?.age || 58}</span>
                  <span>Sex: {prediction.features?.sex === 1 ? 'Male' : 'Female'}</span>
                  <span>Evaluated: {new Date(prediction.timestamp).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Primary Risk Stratification */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    RISK PROBABILITY
                  </div>
                  <div className="text-3xl font-extrabold font-mono text-white mt-0.5">
                    {Math.round(prediction.hybrid_risk * 100)}%
                  </div>
                </div>

                <div
                  className={`px-4 py-2 rounded text-xs font-bold uppercase border flex items-center gap-2 ${
                    prediction.risk_category.includes('High')
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : prediction.risk_category.includes('Moderate')
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{prediction.risk_category}</span>
                </div>
              </div>
            </div>

            {/* 2. Key Contributing Factors (SHAP Drivers) */}
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                KEY CONTRIBUTING BIOMARKER DRIVERS
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {prediction.contributing_factors.slice(0, 4).map((f) => {
                  const isPositive = f.importance_value >= 0;
                  return (
                    <div key={f.feature} className="p-3 rounded bg-slate-900 border border-slate-700/80">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-white flex items-center gap-1.5">
                          {isPositive ? (
                            <span className="text-rose-400 font-bold">↑</span>
                          ) : (
                            <span className="text-emerald-400 font-bold">↓</span>
                          )}
                          {f.feature}
                        </span>
                        <span className="text-slate-400 font-mono">
                          Val: <strong className="text-slate-200">{f.patient_value ?? 'N/A'}</strong>
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5">{f.clinical_note}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Clinical Interpretation & Model Limitations */}
            <div className="p-4 rounded bg-slate-900 border border-slate-700/80 space-y-2 text-xs">
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-teal-400" />
                <span>Interpretation & Considerations</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                {prediction.explanation_summary ||
                  'The ensemble model evaluates elevated systolic blood pressure and glycemic markers as key contributors to overall risk score. Results should be interpreted in conjunction with standard clinical diagnostic guidelines.'}
              </p>
              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                <strong>Model Confidence:</strong> {prediction.confidence} (Epistemic score: {prediction.uncertainty_score})
              </div>
            </div>

            {/* Clinician Actions Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-400">
                <span>Recommended Triage: </span>
                <strong className="text-slate-200">{prediction.recommendation}</strong>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFeedbackOpen(true)}
                  className="px-3 py-1.5 rounded text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white transition-colors flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Log Doctor Review</span>
                </button>

                {prediction.alert && !prediction.alert.acknowledged && (
                  <button
                    onClick={handleAcknowledge}
                    className="px-3 py-1.5 rounded text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors"
                  >
                    Acknowledge Alert
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 4. Collapsible Technical & Quantum Details Drawer */}
          <div className="clinical-card p-4">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-slate-200 uppercase tracking-wider"
            >
              <span className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-teal-400" />
                Technical & Quantum Model Details
              </span>
              {showTechnicalDetails ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showTechnicalDetails && (
              <div className="mt-4 pt-4 border-t border-slate-700/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3 rounded bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Classical Baseline</div>
                  <div className="font-mono text-slate-200 font-bold mt-1">XGBoost (Top Features)</div>
                  <div className="text-slate-400 text-[11px] mt-1">Score: {(prediction.classical_risk * 100).toFixed(1)}%</div>
                </div>

                <div className="p-3 rounded bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Quantum Circuit (VQC)</div>
                  <div className="font-mono text-slate-200 font-bold mt-1">4-Qubit Variational Classifier</div>
                  <div className="text-slate-400 text-[11px] mt-1">Score: {(prediction.quantum_risk * 100).toFixed(1)}%</div>
                </div>

                <div className="p-3 rounded bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Execution Backend</div>
                  <div className="font-mono text-emerald-400 font-bold mt-1">Qiskit AerSimulator (Local)</div>
                  <div className="text-slate-400 text-[11px] mt-1">Model: {prediction.model_version}</div>
                </div>
              </div>
            )}
          </div>

          {/* Doctor Review Dialog Modal */}
          {feedbackOpen && (
            <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
              <div className="clinical-card-elevated max-w-lg w-full p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-teal-400" />
                    <span>Log Physician Review</span>
                  </h3>
                  <button onClick={() => setFeedbackOpen(false)} className="text-slate-400 hover:text-white text-sm">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmitFeedback} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Physician Concurrence:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'AGREE', label: 'Concur with Risk Score' },
                        { id: 'PARTIAL', label: 'Partial Concurrence' },
                        { id: 'DISAGREE', label: 'Disagree with Score' },
                        { id: 'NEEDS_REVIEW', label: 'Escalate for Testing' },
                      ].map((opt) => (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => setAgreement(opt.id as any)}
                          className={`p-2 rounded text-center font-medium border transition-colors ${
                            agreement === opt.id
                              ? 'bg-teal-500/20 border-teal-500 text-teal-200'
                              : 'bg-slate-900 border-slate-700 text-slate-400'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Clinical Assessment Notes:</label>
                    <textarea
                      rows={3}
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                      placeholder="Enter clinical rationale, test orders, or follow-up recommendation..."
                      className="w-full p-2.5 rounded bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Attending Clinician Name:</label>
                    <input
                      type="text"
                      value={clinicianName}
                      onChange={(e) => setClinicianName(e.target.value)}
                      className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setFeedbackOpen(false)}
                      className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white font-semibold"
                    >
                      Save Physician Review
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-16 text-center text-xs text-slate-400">
          Loading clinical patient risk assessment...
        </div>
      )}
    </div>
  );
};
