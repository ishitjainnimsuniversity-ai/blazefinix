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
    <div className="space-y-6">
      <MedicalDisclaimer compact />

      {/* Header Toolbar */}
      <div className="clinical-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="clinical-badge bg-teal-500/20 text-teal-300 border border-teal-500/30">
              COHORT DIRECTORY
            </span>
            <span className="text-xs text-slate-400">De-identified Patient Records</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1 tracking-tight">Evaluated Patient Directory</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Historical cohort assessments, evaluated risk scores, and clinical report exports.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Record ID or Risk..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* Dense Clinical Patient Table */}
      <div className="clinical-card p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr>
                <th className="clinical-table-header">Patient Record ID</th>
                <th className="clinical-table-header">Risk Stratification</th>
                <th className="clinical-table-header">Risk Score</th>
                <th className="clinical-table-header">Top Biomarker Driver</th>
                <th className="clinical-table-header">Model Version</th>
                <th className="clinical-table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No evaluated patient records match search query.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.prediction_id || r.record_id} className="hover:bg-slate-800/60 transition-colors">
                    <td className="clinical-table-cell font-bold font-mono text-white">{r.record_id}</td>
                    <td className="clinical-table-cell">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                          r.risk_category.includes('High')
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : r.risk_category.includes('Moderate')
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {r.risk_category}
                      </span>
                    </td>
                    <td className="clinical-table-cell font-bold font-mono text-slate-200">
                      {Math.round(r.hybrid_risk * 100)}%
                    </td>
                    <td className="clinical-table-cell font-mono text-slate-300">{r.top_factor || 'HbA1c / BP'}</td>
                    <td className="clinical-table-cell text-slate-400 font-mono text-[11px]">{r.model_version}</td>
                    <td className="clinical-table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onSelectRecord(r.record_id)}
                          className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-medium flex items-center gap-1 transition-colors"
                        >
                          <span>Open Patient</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                        <a
                          href={getReportPdfUrl(r.record_id)}
                          download={`clinical_report_${r.record_id}.pdf`}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1 border border-slate-700 transition-colors"
                          title="Download Clinical Report PDF"
                        >
                          <Download className="w-3 h-3 text-teal-400" />
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
