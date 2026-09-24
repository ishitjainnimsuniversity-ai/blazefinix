import React, { useState, useEffect } from 'react';
import {
  Bell,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Search,
  RefreshCw,
  Check
} from 'lucide-react';
import { AlertData } from '../types';
import {
  fetchAlerts,
  acknowledgeAlert,
  triageAlert,
  getReportPdfUrl
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
    <div className="space-y-5">
      <MedicalDisclaimer compact />

      {/* Header Toolbar */}
      <div className="clinical-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              CLINICAL TRIAGE QUEUE
            </span>
            <span className="text-xs text-slate-500 font-mono">{ALL_COHORT_ALERTS.length} Active Notifications</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-1 tracking-tight">Clinical Alerts & Review Center</h1>
          <p className="text-xs text-slate-600 mt-0.5 max-w-2xl">
            Prioritized clinical notification table and physician review triage queue for evaluated records.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="px-3 py-1 rounded bg-rose-50 border border-rose-200 text-rose-800">
            <strong>{critCount} Critical</strong>
          </div>
          <div className="px-3 py-1 rounded bg-amber-50 border border-amber-200 text-amber-800">
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
            className="w-full pl-9 pr-3 py-2 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-cyan-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 rounded bg-slate-50 border border-slate-300 text-slate-800 text-xs font-medium"
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
            className="px-3 py-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-slate-900">✕</button>
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
            <tbody className="divide-y divide-slate-100">
              {displayedAlerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No clinical alerts match current filter criteria.
                  </td>
                </tr>
              ) : (
                displayedAlerts.map((alt) => (
                  <tr key={alt.alert_id} className="hover:bg-slate-50 transition-colors">
                    <td className="clinical-table-cell font-bold font-mono text-slate-900">{alt.record_id}</td>
                    <td className="clinical-table-cell">
                      <span
                        className={
                          alt.severity === 'CRITICAL'
                            ? 'clinical-badge-high'
                            : alt.severity === 'HIGH'
                            ? 'clinical-badge-high'
                            : 'clinical-badge-moderate'
                        }
                      >
                        {alt.severity}
                      </span>
                    </td>
                    <td className="clinical-table-cell font-bold font-mono text-slate-800">
                      {Math.round(alt.risk_score * 100)}%
                    </td>
                    <td className="clinical-table-cell text-slate-700 max-w-md">
                      <div className="line-clamp-1 font-semibold">{alt.reason}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{alt.recommendation}</div>
                    </td>
                    <td className="clinical-table-cell">
                      <select
                        value={alt.status}
                        onChange={(e) => handleTriage(alt.alert_id, e.target.value)}
                        className="px-2 py-1 rounded bg-slate-50 border border-slate-300 text-slate-800 text-xs font-mono focus:outline-none"
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
                          className="px-2.5 py-1 rounded bg-cyan-700 hover:bg-cyan-800 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>Open Case</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                        {!alt.acknowledged ? (
                          <button
                            onClick={() => handleAcknowledge(alt.alert_id)}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium border border-slate-300 transition-colors cursor-pointer"
                          >
                            Acknowledge
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-700 font-mono font-bold flex items-center gap-1">
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
