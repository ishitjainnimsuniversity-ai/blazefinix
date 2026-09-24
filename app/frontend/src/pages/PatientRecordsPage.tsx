import React, { useState, useEffect } from 'react';
import { Users, FileText, ChevronRight, Search, Download } from 'lucide-react';
import { fetchPredictionHistory, getReportHtmlUrl, getReportPdfUrl, getDoctorReportPdfUrl } from '../api';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

interface PatientRecordsPageProps {
  onSelectRecord: (recordId: string) => void;
}

export const PatientRecordsPage: React.FC<PatientRecordsPageProps> = ({ onSelectRecord }) => {
  const [records, setRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const hist = await fetchPredictionHistory();
        setRecords(hist);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = records.filter(
    (r) =>
      r.record_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.risk_category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <MedicalDisclaimer compact />

      {/* Header Toolbar */}
      <div className="clinical-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
              RESEARCH COHORT DIRECTORY
            </span>
            <span className="text-xs text-slate-500 font-mono">TCGA / Synthetic Dataset Records</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-1 tracking-tight">Evaluated Cohort Dataset Directory</h1>
          <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
            De-identified research cohort records, hybrid risk probabilities, and clinical report exports.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Record ID or Risk..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-cyan-600"
          />
        </div>
      </div>

      {/* Dense Clinical Patient Table */}
      <div className="clinical-card p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr>
                <th className="clinical-table-header">Dataset Record ID</th>
                <th className="clinical-table-header">Risk Stratification</th>
                <th className="clinical-table-header">Hybrid Risk Score</th>
                <th className="clinical-table-header">Top Biomarker Driver</th>
                <th className="clinical-table-header">Model Version</th>
                <th className="clinical-table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No evaluated cohort records match search query.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.prediction_id || r.record_id} className="hover:bg-slate-50 transition-colors">
                    <td className="clinical-table-cell font-bold font-mono text-slate-900">{r.record_id}</td>
                    <td className="clinical-table-cell">
                      <span
                        className={
                          r.risk_category.includes('High')
                            ? 'clinical-badge-high'
                            : r.risk_category.includes('Moderate')
                            ? 'clinical-badge-moderate'
                            : 'clinical-badge-low'
                        }
                      >
                        {r.risk_category}
                      </span>
                    </td>
                    <td className="clinical-table-cell font-bold font-mono text-slate-800">
                      {Math.round(r.hybrid_risk * 100)}%
                    </td>
                    <td className="clinical-table-cell font-mono text-slate-700">{r.top_factor || 'HbA1c / BP'}</td>
                    <td className="clinical-table-cell text-slate-500 font-mono text-[11px]">{r.model_version}</td>
                    <td className="clinical-table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onSelectRecord(r.record_id)}
                          className="px-2.5 py-1 rounded bg-cyan-700 hover:bg-cyan-800 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>Open Case</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                        <a
                          href={getReportPdfUrl(r.record_id)}
                          download={`clinical_report_${r.record_id}.pdf`}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium flex items-center gap-1 border border-slate-300 transition-colors"
                          title="Download Clinical Report PDF"
                        >
                          <Download className="w-3 h-3 text-cyan-700" />
                          <span>PDF</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
