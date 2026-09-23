import React, { useState } from 'react';
import {
  PlusCircle,
  Cpu,
  ArrowRight,
  AlertTriangle,
  Upload,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { DemoCase, PredictionResult } from '../types';
import {
  FALLBACK_DEMO_CASES,
  predictPatientRisk,
  uploadPatientReportPdfApi
} from '../api';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

interface NewPredictionPageProps {
  onPredictionComplete: (pred: PredictionResult) => void;
}

export const NewPredictionPage: React.FC<NewPredictionPageProps> = ({
  onPredictionComplete
}) => {
  const [recordId, setRecordId] = useState(`P-${Math.floor(10000 + Math.random() * 90000)}`);
  const [loading, setLoading] = useState(false);
  const [extractingPdf, setExtractingPdf] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Grouped clinical parameters
  const [vitals, setVitals] = useState({
    age: 58,
    sex: 1, // 1 = Male, 0 = Female
    systolic_bp: 148,
    diastolic_bp: 92,
    body_mass_index: 29.4
  });

  const [metabolic, setMetabolic] = useState({
    fasting_glucose: 132,
    hba1c: 6.8,
    hs_crp: 3.6,
    egfr: 78
  });

  const [lipids, setLipids] = useState({
    total_cholesterol: 215,
    ldl_cholesterol: 138,
    hdl_cholesterol: 44,
    triglycerides: 185
  });

  function loadDemoProfile(demoCase: DemoCase) {
    setRecordId(demoCase.case_id);
    const f = demoCase.features || {};
    setVitals({
      age: f.age || 58,
      sex: f.sex ?? 1,
      systolic_bp: f.systolic_bp || 140,
      diastolic_bp: f.diastolic_bp || 88,
      body_mass_index: f.bmi || f.body_mass_index || 28
    });
    setMetabolic({
      fasting_glucose: f.fasting_glucose || 120,
      hba1c: f.hba1c || 6.2,
      hs_crp: f.hs_crp || 2.5,
      egfr: f.egfr || 85
    });
    setLipids({
      total_cholesterol: f.total_cholesterol || 210,
      ldl_cholesterol: f.ldl_cholesterol || 130,
      hdl_cholesterol: f.hdl_cholesterol || 45,
      triglycerides: f.triglycerides || 160
    });
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtractingPdf(true);
    setPdfSuccessMessage(null);
    setErrorMessage(null);
    try {
      const extracted = await uploadPatientReportPdfApi(file);
      setPdfSuccessMessage(`Extracted parameters from ${file.name} successfully.`);
      if (extracted.extracted_data) {
        const d = extracted.extracted_data;
        if (d.age) setVitals((v) => ({ ...v, age: d.age }));
        if (d.systolic_bp) setVitals((v) => ({ ...v, systolic_bp: d.systolic_bp }));
        if (d.diastolic_bp) setVitals((v) => ({ ...v, diastolic_bp: d.diastolic_bp }));
        if (d.fasting_glucose) setMetabolic((m) => ({ ...m, fasting_glucose: d.fasting_glucose }));
        if (d.hba1c) setMetabolic((m) => ({ ...m, hba1c: d.hba1c }));
        if (d.hs_crp) setMetabolic((m) => ({ ...m, hs_crp: d.hs_crp }));
        if (d.ldl_cholesterol) setLipids((l) => ({ ...l, ldl_cholesterol: d.ldl_cholesterol }));
        if (d.triglycerides) setLipids((l) => ({ ...l, triglycerides: d.triglycerides }));
      }
    } catch (err: any) {
      setErrorMessage('PDF extraction service offline — fell back to manual entry.');
    } finally {
      setExtractingPdf(false);
    }
  }

  async function handleExecuteAssessment(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const combinedFeatures = {
      ...vitals,
      ...metabolic,
      ...lipids
    };

    try {
      const pred = await predictPatientRisk(combinedFeatures, recordId);
      onPredictionComplete(pred);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Assessment pipeline execution failed. Please verify backend state.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <MedicalDisclaimer compact />

      {/* Header Banner */}
      <div className="clinical-card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="clinical-badge bg-teal-500/20 text-teal-300 border border-teal-500/30">
              NEW ASSESSMENT WORKSPACE
            </span>
            <span className="text-xs text-slate-400 font-mono">ID: {recordId}</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1 tracking-tight">Run New Patient Risk Assessment</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Upload clinical PDF lab report or manually enter patient vitals, metabolic markers, and lipids.
          </p>
        </div>

        {/* PDF Quick Upload Button */}
        <div className="relative">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            title="Upload PDF Clinical Lab Report"
          />
          <button
            type="button"
            className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-2 transition-colors"
          >
            <Upload className="w-4 h-4 text-teal-400" />
            <span>{extractingPdf ? 'Extracting Lab PDF...' : 'Upload Clinical PDF'}</span>
          </button>
        </div>
      </div>

      {pdfSuccessMessage && (
        <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{pdfSuccessMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Preset Cohort Case Buttons */}
      <div className="clinical-card p-4 space-y-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
          Load Sample Research Case Profile:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {FALLBACK_DEMO_CASES.map((c) => (
            <button
              key={c.case_id}
              type="button"
              onClick={() => loadDemoProfile(c)}
              className="p-3 rounded bg-slate-900 border border-slate-700/80 hover:border-slate-600 text-left transition-colors group"
            >
              <div className="text-xs font-bold text-white group-hover:text-teal-300 flex items-center justify-between">
                <span>{c.case_id}</span>
                <span className="text-[11px] font-mono text-slate-400">{c.expected_risk}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{c.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Grouped Clinical Form */}
      <form onSubmit={handleExecuteAssessment} className="space-y-6">
        {/* Section 1: Patient Demographics & Vitals */}
        <div className="clinical-card p-5 space-y-4">
          <h2 className="text-sm font-bold text-white border-b border-slate-700/80 pb-2">
            1. Patient Demographics & Vitals
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Age (Years)</label>
              <input
                type="number"
                value={vitals.age}
                onChange={(e) => setVitals({ ...vitals, age: parseFloat(e.target.value) || 0 })}
                className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Biological Sex</label>
              <select
                value={vitals.sex}
                onChange={(e) => setVitals({ ...vitals, sex: parseInt(e.target.value) })}
                className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white"
              >
                <option value={1}>Male</option>
                <option value={0}>Female</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Systolic BP (mmHg)</label>
              <input
                type="number"
                value={vitals.systolic_bp}
                onChange={(e) => setVitals({ ...vitals, systolic_bp: parseFloat(e.target.value) || 0 })}
                className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Diastolic BP (mmHg)</label>
              <input
                type="number"
                value={vitals.diastolic_bp}
                onChange={(e) => setVitals({ ...vitals, diastolic_bp: parseFloat(e.target.value) || 0 })}
                className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Glycemic & Renal Function */}
        <div className="clinical-card p-5 space-y-4">
          <h2 className="text-sm font-bold text-white border-b border-slate-700/80 pb-2">
            2. Glycemic & Inflammatory Biomarkers
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Fasting Glucose (mg/dL)</label>
              <input
                type="number"
                value={metabolic.fasting_glucose}
                onChange={(e) => setMetabolic({ ...metabolic, fasting_glucose: parseFloat(e.target.value) || 0 })}
                className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">HbA1c (%)</label>
              <input
                type="number"
                step="0.1"
                value={metabolic.hba1c}
                onChange={(e) => setMetabolic({ ...metabolic, hba1c: parseFloat(e.target.value) || 0 })}
                className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">hs-CRP (mg/L)</label>
              <input
                type="number"
                step="0.1"
                value={metabolic.hs_crp}
                onChange={(e) => setMetabolic({ ...metabolic, hs_crp: parseFloat(e.target.value) || 0 })}
                className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">eGFR (mL/min/1.73m²)</label>
              <input
                type="number"
                value={metabolic.egfr}
                onChange={(e) => setMetabolic({ ...metabolic, egfr: parseFloat(e.target.value) || 0 })}
                className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Lipid Profile */}
        <div className="clinical-card p-5 space-y-4">
          <h2 className="text-sm font-bold text-white border-b border-slate-700/80 pb-2">
            3. Lipid Profile
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Total Cholesterol (mg/dL)</label>
              <input
                type="number"
                value={lipids.total_cholesterol}
                onChange={(e) => setLipids({ ...lipids, total_cholesterol: parseFloat(e.target.value) || 0 })}
                className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">LDL Cholesterol (mg/dL)</label>
              <input
                type="number"
                value={lipids.ldl_cholesterol}
                onChange={(e) => setLipids({ ...lipids, ldl_cholesterol: parseFloat(e.target.value) || 0 })}
                className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">HDL Cholesterol (mg/dL)</label>
              <input
                type="number"
                value={lipids.hdl_cholesterol}
                onChange={(e) => setLipids({ ...lipids, hdl_cholesterol: parseFloat(e.target.value) || 0 })}
                className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Triglycerides (mg/dL)</label>
              <input
                type="number"
                value={lipids.triglycerides}
                onChange={(e) => setLipids({ ...lipids, triglycerides: parseFloat(e.target.value) || 0 })}
                className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded text-xs font-semibold bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white flex items-center gap-2 transition-colors"
          >
            <Cpu className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Running Hybrid Pipeline...' : 'Run Risk Assessment'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
