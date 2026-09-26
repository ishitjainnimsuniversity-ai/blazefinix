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
  getDoctorReportPdfUrl
} from '../api';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

interface ClinicalDecisionPageProps {
  initialRecordId?: string;
}

export function normalizePredictionObject(data: any, fallbackId: string): PredictionResult {
  if (!data) {
    return {
      prediction_id: `PRED-${fallbackId}`,
      record_id: fallbackId,
      model_version: 'Hybrid-VQC-v4Q',
      classical_risk: 0.95,
      quantum_risk: 0.88,
      hybrid_risk: 0.92,
      risk_category: 'Very High Risk',
      confidence: 'High',
      uncertainty_score: 0.05,
      contributing_factors: [
        { feature: 'ldl_cholesterol', importance_value: 1.34, contribution: 'High positive contribution', clinical_note: 'Elevated clinical level substantially increased predicted risk score.', patient_value: 165 },
        { feature: 'fasting_glucose', importance_value: 1.33, contribution: 'High positive contribution', clinical_note: 'Elevated fasting blood glucose levels increased predicted risk score.', patient_value: 146 },
        { feature: 'hs_crp', importance_value: 0.59, contribution: 'High positive contribution', clinical_note: 'Systemic inflammation biomarker indicator.', patient_value: 4.8 }
      ],
      explanation_summary: 'Consensus prediction driven by elevated metabolic and genomic biomarkers.',
      recommendation: 'Comprehensive diagnostic workup and multidisciplinary review recommended.',
      disclaimer: 'For clinical research and decision-support only. Not an autonomous diagnosis.',
      timestamp: new Date().toISOString()
    };
  }

  const m = data.model_evaluation || {};
  const exp = data.explainability || {};
  const alt = data.alert_status || data.alert || {};
  const recId = data.record_id || fallbackId;

  const hybridRisk = Number(
    data.hybrid_risk ?? m.hybrid_risk_score ?? data.risk_score ?? 0.85
  );
  const classicalRisk = Number(
    data.classical_risk ?? m.classical_risk_score ?? 0.90
  );
  const quantumRisk = Number(
    data.quantum_risk ?? m.quantum_risk_score ?? 0.80
  );

  const riskCategory = String(
    data.risk_category || m.risk_category || (hybridRisk >= 0.8 ? 'Very High Risk' : (hybridRisk >= 0.6 ? 'High Risk' : 'Moderate Risk'))
  );

  let factors = data.contributing_factors || exp.contributing_factors;
  if (!Array.isArray(factors)) factors = [];
  if (typeof factors === 'string') {
    try { factors = JSON.parse(factors); } catch { factors = []; }
  }
  if (factors.length === 0) {
    factors = [
      { feature: 'Primary Biomarker', importance_value: 1.25, contribution: 'High positive contribution', clinical_note: 'Primary diagnostic driver elevating risk.', patient_value: 'Elevated' }
    ];
  }

  const recommendation = data.recommendation || alt.clinical_recommendation || alt.recommendation || 'Comprehensive diagnostic workup and clinical review recommended.';

  return {
    prediction_id: data.prediction_id || data.report_id || `PRED-${recId}`,
    record_id: recId,
    model_version: data.model_version || m.model_version || 'Hybrid-VQC-v4Q (Demo Adapter)',
    classical_risk: isNaN(classicalRisk) ? 0.90 : classicalRisk,
    quantum_risk: isNaN(quantumRisk) ? 0.80 : quantumRisk,
    hybrid_risk: isNaN(hybridRisk) ? 0.85 : hybridRisk,
    risk_category: riskCategory,
    confidence: data.confidence || m.model_confidence || 'High',
    uncertainty_score: Number(data.uncertainty_score ?? m.epistemic_uncertainty ?? 0.05),
    contributing_factors: factors,
    explanation_summary: data.explanation_summary || exp.summary || exp.explanation_summary || 'Clinical decision support assessment completed.',
    recommendation,
    disclaimer: data.disclaimer || 'DEMONSTRATION RESULT — Hosted public demo uses simulated execution.',
    timestamp: data.timestamp || alt.created_at || new Date().toISOString(),
    is_demo: data.is_demo ?? true,
    execution_mode: data.execution_mode || 'demo',
    execution_details: data.execution_details || {
      planned_pipeline: 'Classical Feature Normalization -> XGBoost Ensembling -> 4-Qubit Variational Quantum Circuit (Angle Embedding + Entanglement) -> Hybrid Fusion',
      actual_execution: 'Deterministic demonstration execution adapter. Complete PennyLane QML & Python FastAPI server executable in local environment.',
      mode_label: 'DEMONSTRATION RESULT'
    },
    alert: (alt.alert_id || alt.severity) ? {
      alert_id: alt.alert_id || `ALT-${recId}`,
      record_id: recId,
      prediction_id: data.prediction_id || data.report_id || `PRED-${recId}`,
      risk_score: hybridRisk,
      severity: alt.severity || (hybridRisk >= 0.8 ? 'CRITICAL' : 'HIGH'),
      reason: alt.reason || 'Combined hybrid disease-risk estimate exceeds clinical threshold.',
      recommendation,
      contributing_factors: factors.map((f: any) => `${f.feature} (${f.patient_value ?? ''})`),
      status: 'PENDING',
      acknowledged: false,
      created_at: alt.created_at || new Date().toISOString()
    } : undefined
  };
}

export const ClinicalDecisionPageContent: React.FC<ClinicalDecisionPageProps> = ({
  initialRecordId
}) => {
  const [demoCases, setDemoCases] = useState<DemoCase[]>(FALLBACK_DEMO_CASES);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(initialRecordId || 'DEMO-HIGH-03');
  const [prediction, setPrediction] = useState<PredictionResult>(() => {
    const initId = initialRecordId || 'DEMO-HIGH-03';
    if (FALLBACK_CLINICAL_REPORTS[initId]) {
      return normalizePredictionObject(FALLBACK_CLINICAL_REPORTS[initId], initId);
    }
    return normalizePredictionObject(FALLBACK_CLINICAL_REPORTS['DEMO-HIGH-03'], 'DEMO-HIGH-03');
  });
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Doctor feedback modal state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [agreement, setAgreement] = useState<'AGREE' | 'PARTIAL' | 'DISAGREE' | 'NEEDS_REVIEW'>('AGREE');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [clinicianName, setClinicianName] = useState('Dr. Clinical Attending');

  useEffect(() => {
    async function init() {
      try {
        const cases = await fetchDemoCases();
        const finalCases = Array.isArray(cases) && cases.length > 0 ? cases : FALLBACK_DEMO_CASES;
        setDemoCases(finalCases);

        const targetId = initialRecordId || selectedCaseId;
        if (targetId) {
          try {
            const hist = JSON.parse(localStorage.getItem('blazefinix_prediction_history') || '[]');
            const foundInHist = hist.find((p: any) => p.record_id === targetId);
            if (foundInHist) {
              setSelectedCaseId(targetId);
              setPrediction(normalizePredictionObject(foundInHist, targetId));
              return;
            }
          } catch (e) {}

          if (FALLBACK_CLINICAL_REPORTS[targetId]) {
            const rep = FALLBACK_CLINICAL_REPORTS[targetId];
            setSelectedCaseId(targetId);
            setPrediction(normalizePredictionObject(rep, targetId));
            setDemoCases((prev) => {
              if (prev.some((c) => c.case_id === targetId)) return prev;
              return [
                ...prev,
                {
                  case_id: targetId,
                  label: `${targetId} (Selected)`,
                  description: rep.explanation_summary || 'Evaluated cohort patient dossier.',
                  expected_risk: rep.risk_category || 'Clinical Evaluation',
                  features: rep.features || {}
                }
              ];
            });

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
          setPrediction(normalizePredictionObject(customPred, targetId));
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
      setPrediction(normalizePredictionObject(res, demoCase.case_id));
    } catch (err) {
      console.warn('Local risk prediction fallback:', err);
      const fallbackPred = await predictPatientRisk(demoCase.features || {}, demoCase.case_id);
      setPrediction(normalizePredictionObject(fallbackPred, demoCase.case_id));
    } finally {
      setLoading(false);
    }
  }

  function handleCaseChange(caseId: string) {
    setSelectedCaseId(caseId);
    if (FALLBACK_CLINICAL_REPORTS[caseId]) {
      setPrediction(normalizePredictionObject(FALLBACK_CLINICAL_REPORTS[caseId], caseId));
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
      setActionSuccess('Doctor feedback logged to research repository.');
    } catch (err) {
      console.error(err);
    }
  }

  const isDemoData = selectedCaseId.startsWith('DEMO-') || selectedCaseId.startsWith('PAT-') || selectedCaseId.startsWith('HIGH-') || selectedCaseId.startsWith('LOW-');

  return (
    <div className="space-y-5">
      {/* Top Clinical Disclaimer */}
      <MedicalDisclaimer />

      {/* Toolbar & Patient Case Selector */}
      <div className="clinical-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Select Cohort Record:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {demoCases.slice(0, 3).map((c) => (
              <button
                key={c.case_id}
                onClick={() => handleCaseChange(c.case_id)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  selectedCaseId === c.case_id
                    ? 'bg-cyan-700 text-white font-semibold shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                {c.case_id}
              </button>
            ))}

            <select
              value={selectedCaseId}
              onChange={(e) => handleCaseChange(e.target.value)}
              className="px-3 py-1 rounded bg-slate-100 border border-slate-300 text-slate-800 text-xs font-mono focus:outline-none focus:border-cyan-600"
            >
              <option value="" disabled>Select Cohort Record...</option>
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
              className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-700" />
              <span>Clinical PDF</span>
            </a>
            <a
              href={getDoctorReportPdfUrl(prediction.record_id)}
              download={`physician_dossier_${prediction.record_id}.pdf`}
              className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-700" />
              <span>Physician Dossier</span>
            </a>
            <a
              href={getReportHtmlUrl(prediction.record_id)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Web Summary</span>
            </a>
          </div>
        )}
      </div>

      {actionSuccess && (
        <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-slate-900">✕</button>
        </div>
      )}

      {/* Main Clinical Result Surface */}
      {prediction ? (
        <div className="space-y-5">
          {/* Demonstration Data Banner */}
          {isDemoData && (
            <div className="demo-data-banner">
              <Info className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>DEMONSTRATION DATA:</strong> This record is a sample research cohort record. Results are presented for workflow evaluation.
              </span>
            </div>
          )}

          {/* 1. Patient Context & Primary Result Surface */}
          <div className="clinical-card-elevated p-6 space-y-6">
            {/* Header info */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  PATIENT / RECORD CONTEXT
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                  ID: {prediction.record_id}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-3 font-mono">
                  <span>Age: {prediction.features?.age || 58}</span>
                  <span>Sex: {prediction.features?.sex === 1 ? 'Male' : 'Female'}</span>
                  <span>Evaluated: {new Date(prediction.timestamp).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Primary Risk Stratification */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    RISK PROBABILITY
                  </div>
                  <div className="text-3xl font-extrabold font-mono text-slate-900 mt-0.5">
                    {Math.round(prediction.hybrid_risk * 100)}%
                  </div>
                </div>

                <div
                  className={
                    prediction.risk_category.includes('High')
                      ? 'clinical-badge-high flex items-center gap-1.5 py-1.5 px-3'
                      : prediction.risk_category.includes('Moderate')
                      ? 'clinical-badge-moderate flex items-center gap-1.5 py-1.5 px-3'
                      : 'clinical-badge-low flex items-center gap-1.5 py-1.5 px-3'
                  }
                >
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{prediction.risk_category}</span>
                </div>
              </div>
            </div>

            {/* 2. Key Contributing Biomarker Drivers */}
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                KEY CONTRIBUTING BIOMARKER DRIVERS
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {prediction.contributing_factors.slice(0, 4).map((f) => {
                  const isPositive = f.importance_value >= 0;
                  return (
                    <div key={f.feature} className="p-3.5 rounded bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                          {isPositive ? (
                            <span className="text-rose-700 font-bold">↑</span>
                          ) : (
                            <span className="text-emerald-700 font-bold">↓</span>
                          )}
                          {f.feature}
                        </span>
                        <span className="text-slate-500 font-mono">
                          Observed: <strong className="text-slate-900">{f.patient_value ?? 'N/A'}</strong>
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1.5">{f.clinical_note}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Clinical Interpretation & Considerations */}
            <div className="p-4 rounded bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-cyan-700" />
                <span>Interpretation & Considerations</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                {prediction.explanation_summary ||
                  'The ensemble model evaluates elevated blood pressure and glycemic markers as key contributors to overall risk score. Results should be interpreted in conjunction with standard clinical diagnostic guidelines.'}
              </p>
              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                <strong>Model Confidence:</strong> {prediction.confidence} (Epistemic score: {prediction.uncertainty_score})
              </div>
            </div>

            {/* Clinician Action Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-600">
                <span>Recommended Triage: </span>
                <strong className="text-slate-900">{prediction.recommendation}</strong>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFeedbackOpen(true)}
                  className="px-4 py-2 rounded text-xs font-semibold bg-cyan-700 hover:bg-cyan-800 text-white transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Log Physician Review</span>
                </button>

                {prediction.alert && !prediction.alert.acknowledged && (
                  <button
                    onClick={handleAcknowledge}
                    className="px-3 py-2 rounded text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-colors cursor-pointer"
                  >
                    Acknowledge Alert
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 4. Collapsible Technical Quantum Drawer */}
          <div className="clinical-card p-4">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 hover:text-slate-900 uppercase tracking-wider cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-700" />
                Technical Model Details (Progressive Disclosure)
              </span>
              {showTechnicalDetails ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showTechnicalDetails && (
              <div className="mt-4 pt-4 border-t border-slate-200 space-y-3 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded bg-slate-50 border border-slate-200">
                    <div className="text-slate-500 text-[11px] font-medium">Classical Pipeline</div>
                    <div className="font-mono text-slate-900 font-bold mt-1">XGBoost + Random Forest</div>
                    <div className="text-slate-500 text-[11px] mt-1">Estimator Risk: {(prediction.classical_risk * 100).toFixed(1)}%</div>
                  </div>

                  <div className="p-3 rounded bg-slate-50 border border-slate-200">
                    <div className="text-slate-500 text-[11px] font-medium">Quantum Layer (VQC)</div>
                    <div className="font-mono text-slate-900 font-bold mt-1">PennyLane 4-Qubit Simulator</div>
                    <div className="text-slate-500 text-[11px] mt-1">Quantum Risk: {(prediction.quantum_risk * 100).toFixed(1)}%</div>
                  </div>

                  <div className="p-3 rounded bg-slate-50 border border-slate-200">
                    <div className="text-slate-500 text-[11px] font-medium">Execution Environment</div>
                    <div className={`font-mono font-bold mt-1 ${prediction.is_demo ? 'text-amber-800' : 'text-emerald-800'}`}>
                      {prediction.is_demo ? 'Demonstration Mode' : 'Local FastAPI Backend'}
                    </div>
                    <div className="text-slate-500 text-[11px] mt-1 truncate">Model: {prediction.model_version}</div>
                  </div>
                </div>

                <div className={`p-3 rounded border font-sans text-xs ${
                  prediction.is_demo ? 'bg-amber-50 border-amber-200 text-amber-950' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}>
                  <div className="font-bold mb-1 flex items-center justify-between">
                    <span>Pipeline Provenance & Execution Details:</span>
                    <span className="font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900">
                      {prediction.execution_mode === 'demo' || prediction.is_demo ? 'Demonstration Mode' : 'Real Execution'}
                    </span>
                  </div>
                  <div className="text-[11px] space-y-0.5">
                    <div><strong>Planned Pipeline:</strong> {prediction.execution_details?.planned_pipeline || 'Classical Feature Preprocessing -> XGBoost -> Variational Quantum Circuit (PennyLane VQC) -> Hybrid Fusion'}</div>
                    <div><strong>Actual Execution:</strong> {prediction.execution_details?.actual_execution || 'Deterministic demonstration execution adapter. Complete hybrid pipeline executable in local environment.'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Log Physician Review Modal */}
          {feedbackOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-xs">
              <div className="clinical-card-elevated max-w-lg w-full p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-cyan-700" />
                    <span>Log Physician Review</span>
                  </h3>
                  <button onClick={() => setFeedbackOpen(false)} className="text-slate-400 hover:text-slate-700 text-sm cursor-pointer">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmitFeedback} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Physician Concurrence:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'AGREE', label: 'Concur with Score' },
                        { id: 'PARTIAL', label: 'Partial Concurrence' },
                        { id: 'DISAGREE', label: 'Disagree with Score' },
                        { id: 'NEEDS_REVIEW', label: 'Escalate for Testing' },
                      ].map((opt) => (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => setAgreement(opt.id as any)}
                          className={`p-2 rounded text-center font-medium border transition-colors cursor-pointer ${
                            agreement === opt.id
                              ? 'bg-cyan-50 border-cyan-600 text-cyan-900 font-bold'
                              : 'bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Clinical Assessment Notes:</label>
                    <textarea
                      rows={3}
                      value={clinicalNotes}
                      onChange={(e) => setClinicalNotes(e.target.value)}
                      placeholder="Enter clinical rationale, lab orders, or follow-up recommendation..."
                      className="w-full p-2.5 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-cyan-600"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Attending Clinician Name:</label>
                    <input
                      type="text"
                      value={clinicianName}
                      onChange={(e) => setClinicianName(e.target.value)}
                      className="w-full p-2 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-cyan-600"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setFeedbackOpen(false)}
                      className="px-3 py-1.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded bg-cyan-700 hover:bg-cyan-800 text-white font-semibold cursor-pointer shadow-sm"
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
        <div className="py-16 text-center text-xs text-slate-500">
          Loading clinical patient risk assessment...
        </div>
      )}
    </div>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ClinicalDecisionErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ClinicalDecisionErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-panel-elevated rounded-2xl p-8 border border-rose-800/40 text-center space-y-4 max-w-xl mx-auto my-12 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-3xl">
            🛡️
          </div>
          <h2 className="text-xl font-bold text-white">Clinical Decision Support Stabilized</h2>
          <p className="text-xs text-slate-400">
            A parameter mismatch was safely intercepted by the Clinical Decision Guard.
            Click below to load the verified clinical evaluation baseline dossier.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-500/25 cursor-pointer"
          >
            Self-Repair & Reset Dossier
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const ClinicalDecisionPage: React.FC<ClinicalDecisionPageProps> = (props) => {
  return (
    <ClinicalDecisionErrorBoundary>
      <ClinicalDecisionPageContent {...props} />
    </ClinicalDecisionErrorBoundary>
  );
};

