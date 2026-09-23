import React, { useState, useEffect } from 'react';
import {
  Bell,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Download,
  Search,
  RefreshCw,
  Check
} from 'lucide-react';
import { AlertData } from '../types';
import {
  fetchAlerts,
  acknowledgeAlert,
  triageAlert,
  getReportPdfUrl,
  getDoctorReportPdfUrl
} from '../api';
import { ALL_COHORT_ALERTS } from '../allAlertsData';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

interface AlertsPageProps {
  onNavigateToDecision: (recordId: string) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ onNavigateToDecision }) => {
  const [alerts, setAlerts] = useState<AlertData[]>(ALL_COHORT_ALERTS);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadAlerts();
  }, [severityFilter, statusFilter]);

  async function loadAlerts() {
    setLoading(true);
    try {
      const data = await fetchAlerts(severityFilter, statusFilter);
      setAlerts(data && data.length > 0 ? data : ALL_COHORT_ALERTS);
    } catch (err) {
      console.warn('Fallback alerts loaded:', err);
      setAlerts(ALL_COHORT_ALERTS);
    } finally {
      setLoading(false);
    }
  }

  async function handleAcknowledge(alertId: string) {
    try {
      await acknowledgeAlert(alertId, 'Dr. Clinical Attending');
      setActionSuccess(`Alert ${alertId} acknowledged.`);
      setAlerts((prev) =>
        prev.map((a) => (a.alert_id === alertId ? { ...a, acknowledged: true, status: 'REVIEWED' } : a))
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function handleTriage(alertId: string, status: string) {
    try {
      await triageAlert(alertId, status);
      setActionSuccess(`Alert ${alertId} updated to ${status}.`);
      setAlerts((prev) =>
        prev.map((a) => (a.alert_id === alertId ? { ...a, status: status as any } : a))
      );
    } catch (err) {
      console.error(err);
    }
  }

  const critCount = ALL_COHORT_ALERTS.filter((a) => a.severity.toUpperCase() === 'CRITICAL').length;
  const highCount = ALL_COHORT_ALERTS.filter((a) => a.severity.toUpperCase() === 'HIGH').length;

  const displayedAlerts = alerts.filter((alt) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      alt.record_id.toLowerCase().includes(q) ||
      alt.alert_id.toLowerCase().includes(q) ||
      alt.reason.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <MedicalDisclaimer compact />

      {/* Header Toolbar */}
      <div className="clinical-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="clinical-badge bg-rose-500/20 text-rose-300 border border-rose-500/30">
              CLINICAL TRIAGE QUEUE
            </span>
            <span className="text-xs text-slate-400 font-mono">{ALL_COHORT_ALERTS.length} Active Records</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1 tracking-tight">Clinical Alerts & Review Center</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Prioritized clinical notifications and physician review triage queue for evaluated patient records.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="px-3 py-1 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300">
            <strong>{critCount} Critical</strong>
          </div>
          <div className="px-3 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300">
            <strong>{highCount} High Risk</strong>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="clinical-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Patient ID or Reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs font-medium"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Moderate Risk</option>
            <option value="LOW">Low Risk</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setSeverityFilter('ALL');
              setStatusFilter('ALL');
              setSearchTerm('');
              loadAlerts();
            }}
            className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Dense Clinical Alert Table */}
      <div className="clinical-card p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr>
                <th className="clinical-table-header">Patient ID</th>
                <th className="clinical-table-header">Severity</th>
                <th className="clinical-table-header">Risk Score</th>
                <th className="clinical-table-header">Clinical Reason & Triage</th>
                <th className="clinical-table-header">Status</th>
                <th className="clinical-table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {displayedAlerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No clinical alerts match current filter criteria.
                  </td>
                </tr>
              ) : (
                displayedAlerts.map((alt) => (
                  <tr key={alt.alert_id} className="hover:bg-slate-800/60 transition-colors">
                    <td className="clinical-table-cell font-bold font-mono text-white">{alt.record_id}</td>
                    <td className="clinical-table-cell">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                          alt.severity === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : alt.severity === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                        }`}
                      >
                        {alt.severity}
                      </span>
                    </td>
                    <td className="clinical-table-cell font-bold font-mono text-slate-200">
                      {Math.round(alt.risk_score * 100)}%
                    </td>
                    <td className="clinical-table-cell text-slate-300 max-w-md">
                      <div className="line-clamp-1 font-medium">{alt.reason}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{alt.recommendation}</div>
                    </td>
                    <td className="clinical-table-cell">
                      <select
                        value={alt.status}
                        onChange={(e) => handleTriage(alt.alert_id, e.target.value)}
                        className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 text-xs font-mono"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="REVIEWED">REVIEWED</option>
                        <option value="ESCALATED">ESCALATED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </td>
                    <td className="clinical-table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onNavigateToDecision(alt.record_id)}
                          className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-medium flex items-center gap-1 transition-colors"
                        >
                          <span>Open Case</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                        {!alt.acknowledged ? (
                          <button
                            onClick={() => handleAcknowledge(alt.alert_id)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium border border-slate-700 transition-colors"
                          >
                            Acknowledge
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                            <Check className="w-3 h-3" /> Ack'd
                          </span>
                        )}
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
