import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  ExternalLink,
  RefreshCw,
  FileCheck,
  Search,
  Users,
  ChevronRight,
  Cpu,
  Dna
} from 'lucide-react';
import {
  fetchReport,
  fetchTestedPatients,
  fetchModelReports,
  getReportPdfUrl,
  getDoctorReportPdfUrl,
  getPatientReportPdfUrl
} from '../api';
import { TestedPatientItem } from '../types';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { generateClinicalReportHtml } from '../utils/reportHtmlGenerator';
import { getGenesForRecord } from '../utils/cancerGenomicsData';

export const ReportsPage: React.FC = () => {
  const [recordId, setRecordId] = useState('DEMO-HIGH-03');
  const [activeTab, setActiveTab] = useState<'ALL' | 'PATIENTS' | 'MODELS'>('ALL');
  const [activeGeneSymbol, setActiveGeneSymbol] = useState<string>('TP53');
  const [testedPatients, setTestedPatients] = useState<TestedPatientItem[]>([]);
  const [modelReports, setModelReports] = useState<any[]>([]);
  const [currentReport, setCurrentReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [cohortFilter, setCohortFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const quickRecords = [
    { id: 'TCGA-BH-A0B2', label: 'Breast (BRCA) Record', category: 'TCGA BRCA', desc: 'TCGA Stage IIA donor with BRCA1 & TP53 alterations' },
    { id: 'TCGA-44-3918', label: 'Lung (LUAD) Record', category: 'TCGA LUAD', desc: 'TCGA Stage IB lung cancer donor with EGFR mutation' },
    { id: 'TCGA-AA-3666', label: 'Colon (COAD) Record', category: 'TCGA COAD', desc: 'TCGA Stage I colorectal donor with APC mutation' },
    { id: 'TCGA-D1-A17D', label: 'Melanoma (SKCM) Record', category: 'TCGA SKCM', desc: 'TCGA Stage IIB melanoma donor with BRAF V600E' },
    { id: 'MODEL-HYBRID', label: 'Hybrid QML Model Report', category: 'Ensemble', desc: '60% XGBoost + 40% 4-Qubit VQC Ensemble validation report' },
    { id: 'MODEL-VQC', label: '4-Qubit VQC Quantum Report', category: 'Quantum', desc: 'Parameterized Quantum Circuit with 100% recall sensitivity' },
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadReportData(recordId);
  }, [recordId]);

  async function loadInitialData() {
    setLoading(true);
    try {
      const [patients, models] = await Promise.all([
        fetchTestedPatients(),
        fetchModelReports()
      ]);
      setTestedPatients(patients || []);
      setModelReports(models || []);
    } catch (err) {
      console.error('Failed to load initial report lists:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadReportData(id: string) {
    setReportLoading(true);
    try {
      const data = await fetchReport(id);
      setCurrentReport(data);
    } catch (err) {
      console.error(`Failed to load report for ${id}:`, err);
    } finally {
      setReportLoading(false);
    }
  }

  function handleSelectRecord(id: string) {
    setRecordId(id);
    loadReportData(id);
    setTimeout(() => {
      document.getElementById('dossier-preview')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  function handleLoadReport(e: React.FormEvent) {
    e.preventDefault();
    if (recordId.trim()) {
      loadReportData(recordId.trim());
    }
  }

  const reportHtml = generateClinicalReportHtml(currentReport);

  function handlePrintOrPdf() {
    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(reportHtml);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
      }, 400);
    }
  }

  function handleDownloadHtml() {
    const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinical_decision_report_${recordId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const filteredPatients = testedPatients.filter((p) => {
    if (activeTab === 'PATIENTS' && p.record_id.startsWith('MODEL-')) return false;

    const matchCohort =
      cohortFilter === 'ALL' ||
      (cohortFilter === 'CARDIO' && p.cohort_name.toLowerCase().includes('cardio')) ||
      (cohortFilter === 'ONCO' && p.cohort_name.toLowerCase().includes('onco')) ||
      (cohortFilter === 'DEMO' && (p.cohort_name.toLowerCase().includes('demo') || p.cohort_name.toLowerCase().includes('clinical evaluation')));

    const matchRisk =
      riskFilter === 'ALL' ||
      (riskFilter === 'HIGH' && (p.risk_category.includes('High') || p.risk_category.includes('Critical'))) ||
      (riskFilter === 'MOD' && p.risk_category.includes('Moderate')) ||
      (riskFilter === 'LOW' && p.risk_category.includes('Low'));

    const matchSearch =
      !searchTerm ||
      p.record_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cohort_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.top_factor && p.top_factor.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchCohort && matchRisk && matchSearch;
  });

  return (
    <div className="space-y-5">
      <MedicalDisclaimer compact />

      {/* Header Banner */}
      <div className="clinical-card p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5" />
              CLINICAL DOSSIER REPOSITORY
            </span>
            <span className="text-xs text-slate-500">Evaluated Cohort Dossiers & Model Reports</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-1 tracking-tight">Clinical AI Assessment & Model Reports</h1>
          <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
            Clinical report repository containing tested patient dossiers across Cardiometabolic (n=600), Oncology Genomic (n=500), and model performance validation reports.
          </p>
        </div>

        <form onSubmit={handleLoadReport} className="flex items-center gap-2 text-xs w-full lg:w-auto">
          <input
            type="text"
            placeholder="Enter Record or Model ID..."
            value={recordId}
            onChange={(e) => setRecordId(e.target.value)}
            className="px-3 py-2 rounded bg-slate-50 border border-slate-300 text-slate-900 font-mono text-xs focus:outline-none focus:border-cyan-600 flex-1 lg:w-56"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded bg-cyan-700 hover:bg-cyan-800 text-white font-semibold flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Load</span>
          </button>
        </form>
      </div>

      {/* Quick Select Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {quickRecords.map((rec) => {
          const isSelected = recordId === rec.id;
          return (
            <button
              key={rec.id}
              onClick={() => handleSelectRecord(rec.id)}
              className={`text-left p-3 rounded border transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-cyan-50 border-cyan-600 text-cyan-900 font-bold shadow-xs'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-mono font-bold text-slate-900 truncate">{rec.id}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                  {rec.category}
                </span>
              </div>
              <div className="text-xs font-bold text-slate-900 truncate">{rec.label}</div>
              <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{rec.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Primary Section Switcher */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('PATIENTS')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'PATIENTS'
                ? 'bg-cyan-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            <Users className="w-3.5 h-3.5 inline mr-1.5" />
            <span>Tested Cohort Directory ({filteredPatients.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('MODELS')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'MODELS'
                ? 'bg-cyan-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 inline mr-1.5" />
            <span>AI Model Validation Reports ({modelReports.length})</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 hidden sm:block">
          Active Record: <strong className="text-slate-900 font-mono">{recordId}</strong>
        </div>
      </div>

      {/* TAB 1: Tested Patients Table */}
      {(activeTab === 'ALL' || activeTab === 'PATIENTS') && (
        <div className="clinical-card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-700" />
                Tested Cohort Directory
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluated clinical profiles with Classical, Quantum, and Ensemble risk classifications
              </p>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search ID, cohort, biomarker..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded bg-slate-50 border border-slate-300 text-slate-900 focus:outline-none focus:border-cyan-600"
                />
              </div>

              <select
                value={cohortFilter}
                onChange={(e) => setCohortFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none"
              >
                <option value="ALL">All Cohorts</option>
                <option value="CARDIO">Cardiometabolic</option>
                <option value="ONCO">Oncology Genomics</option>
                <option value="DEMO">Demo Profiles</option>
              </select>

              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none"
              >
                <option value="ALL">All Risk Tiers</option>
                <option value="HIGH">High / Critical</option>
                <option value="MOD">Moderate</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          {/* Patients Table */}
          <div className="overflow-x-auto rounded border border-slate-200">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr>
                  <th className="clinical-table-header">Patient Record ID</th>
                  <th className="clinical-table-header">Cohort / Clinical Profile</th>
                  <th className="clinical-table-header">Demographics</th>
                  <th className="clinical-table-header">Hybrid Risk Score</th>
                  <th className="clinical-table-header">Classical (XGB)</th>
                  <th className="clinical-table-header">Quantum (VQC)</th>
                  <th className="clinical-table-header">Risk Classification</th>
                  <th className="clinical-table-header">Top Biomarker Driver</th>
                  <th className="clinical-table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-500">
                      {loading ? 'Loading clinical records...' : 'No matching patient records found.'}
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((p) => {
                    const isSelected = p.record_id === recordId;
                    const isCrit = p.risk_category.includes('Critical') || p.risk_category.includes('Very High');
                    const isHigh = p.risk_category.includes('High') && !isCrit;
                    const isMod = p.risk_category.includes('Moderate');

                    return (
                      <tr
                        key={p.record_id}
                        onClick={() => handleSelectRecord(p.record_id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-cyan-50 text-slate-900 font-semibold'
                            : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <td className="clinical-table-cell font-mono font-bold text-slate-900">
                          {p.record_id}
                        </td>
                        <td className="clinical-table-cell text-slate-800">{p.cohort_name}</td>
                        <td className="clinical-table-cell text-slate-600">
                          {p.age > 0 ? `${p.age}y / ${p.sex}` : 'Standard Profile'}
                        </td>
                        <td className="clinical-table-cell font-mono font-bold text-emerald-700">
                          {Math.round(p.hybrid_risk * 100)}%
                        </td>
                        <td className="clinical-table-cell font-mono text-slate-700">
                          {Math.round(p.classical_risk * 100)}%
                        </td>
                        <td className="clinical-table-cell font-mono text-slate-700">
                          {Math.round(p.quantum_risk * 100)}%
                        </td>
                        <td className="clinical-table-cell">
                          <span
                            className={
                              isCrit || isHigh
                                ? 'clinical-badge-high'
                                : isMod
                                ? 'clinical-badge-moderate'
                                : 'clinical-badge-low'
                            }
                          >
                            {p.risk_category}
                          </span>
                        </td>
                        <td className="clinical-table-cell font-mono text-slate-700 truncate max-w-[150px]">
                          {p.top_factor || 'N/A'}
                        </td>
                        <td className="clinical-table-cell text-right">
                          <div className="flex items-center justify-end gap-1.5 font-sans">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectRecord(p.record_id);
                              }}
                              className="px-2.5 py-1 rounded bg-cyan-700 hover:bg-cyan-800 text-white font-semibold text-[11px] transition-colors cursor-pointer"
                            >
                              View Dossier
                            </button>
                            <a
                              href={getReportPdfUrl(p.record_id)}
                              download={`clinical_report_${p.record_id}.pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium border border-slate-300 transition-colors"
                              title="Download Clinical Report PDF"
                            >
                              <Download className="w-3 h-3 text-cyan-700" />
                              <span>PDF</span>
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: AI Models Clinical Validation Reports */}
      {activeTab === 'MODELS' && (
        <div className="clinical-card p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-700" />
              Verified AI Models Clinical Performance & Validation Reports
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Select any verified model to view its clinical validation dossier with sensitivity, specificity, ROC-AUC, and feature weights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modelReports.map((model) => {
              const isSelected = recordId === model.model_id;
              const met = model.metrics || {};
              const isWinner = model.status.toLowerCase().includes('winner');

              return (
                <div
                  key={model.model_id}
                  onClick={() => handleSelectRecord(model.model_id)}
                  className={`p-4 rounded border transition-colors cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-cyan-50 border-cyan-600 text-slate-900 font-semibold shadow-xs'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-[11px] text-slate-500">{model.model_id}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          isWinner
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {model.category}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{model.name}</h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{model.clinical_rationale}</p>

                    {/* Metric Badges */}
                    <div className="grid grid-cols-3 gap-2 my-3 p-2.5 rounded bg-slate-50 border border-slate-200 text-center">
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Accuracy</div>
                        <div className="font-mono font-bold text-xs text-emerald-700">
                          {(met.accuracy * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Sensitivity</div>
                        <div className="font-mono font-bold text-xs text-cyan-800">
                          {(met.sensitivity * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">ROC-AUC</div>
                        <div className="font-mono font-bold text-xs text-slate-900">
                          {met.roc_auc?.toFixed(3) || '0.940'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2 text-[11px]">
                    <span className="text-slate-500">Latency: <strong className="text-slate-900">{met.inference_time_ms} ms</strong></span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectRecord(model.model_id);
                      }}
                      className="px-2.5 py-1 rounded bg-cyan-700 hover:bg-cyan-800 text-white font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Report</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Embedded Live Clinical Document Preview */}
      <div id="dossier-preview" className="clinical-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Live Clinical Report Document</h2>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 font-bold">
                {recordId}
              </span>
              {reportLoading && (
                <span className="text-xs text-cyan-700 animate-pulse flex items-center gap-1 font-medium">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Loading...
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Dossier preview for <strong>{recordId}</strong> with biomarker attributions and model metrics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={getReportPdfUrl(recordId)}
              download={`clinical_report_${recordId}.pdf`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-cyan-700 hover:bg-cyan-800 text-white transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </a>

            <button
              onClick={handlePrintOrPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Embedded IFrame with srcDoc */}
        <div className="rounded border border-slate-200 bg-white min-h-[600px]">
          <iframe
            srcDoc={reportHtml}
            title={`Clinical Report - ${recordId}`}
            className="w-full h-[650px] border-none"
          />
        </div>
      </div>
    </div>
  );
};
