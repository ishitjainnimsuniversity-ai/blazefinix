import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Users,
  ChevronRight,
  PlusCircle,
  Stethoscope,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { AnalyticsOverview, AlertData } from '../types';
import { fetchAnalyticsOverview, fetchAlerts } from '../api';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

interface DashboardPageProps {
  onNavigateToDecision: (recordId?: string) => void;
  onNavigateToAlerts: () => void;
  onNavigateToNewPrediction: () => void;
  onNavigateToPatients: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToDecision,
  onNavigateToAlerts,
  onNavigateToNewPrediction,
  onNavigateToPatients
}) => {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [anData, altData] = await Promise.all([
          fetchAnalyticsOverview(),
          fetchAlerts('ALL', 'PENDING')
        ]);
        setAnalytics(anData);
        setRecentAlerts(altData.slice(0, 5));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-5">
      {/* Top Disclaimer */}
      <MedicalDisclaimer />

      {/* Header Banner */}
      <div className="clinical-card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
              Clinical Operations
            </span>
            <span className="text-xs text-slate-500">Cardiometabolic & Oncology Decision Support</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-1 tracking-tight">
            Clinical Operations Overview
          </h1>
          <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
            Real-time patient risk triage, unreviewed alerts, and clinical decision support workflow.
          </p>
        </div>

        <button
          onClick={onNavigateToNewPrediction}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Patient Assessment</span>
        </button>
      </div>

      {/* Actionable Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Pending Alerts */}
        <div
          onClick={onNavigateToAlerts}
          className="clinical-card p-4 hover:border-slate-300 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Alert Triage
            </span>
            <div className="p-1.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {analytics ? analytics.pending_doctor_reviews : '—'}
            </span>
            <span className="text-xs text-rose-700 font-medium">unreviewed alerts</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>Critical Severity: {analytics ? analytics.critical_alerts : 0}</span>
            <span className="text-cyan-700 group-hover:underline flex items-center gap-1 font-semibold">
              Triage <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Metric 2: Active Cohort */}
        <div
          onClick={onNavigateToPatients}
          className="clinical-card p-4 hover:border-slate-300 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Research Cohort Directory
            </span>
            <div className="p-1.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {analytics ? analytics.records_analyzed : '—'}
            </span>
            <span className="text-xs text-cyan-800 font-medium">cohort records</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>High Risk Cases: {analytics ? analytics.high_risk_cases : 0}</span>
            <span className="text-cyan-700 group-hover:underline flex items-center gap-1 font-semibold">
              View Directory <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Metric 3: System Engine Status */}
        <div className="clinical-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Decision Engine Status
            </span>
            <div className="p-1.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-base font-bold text-emerald-700">OPERATIONAL</span>
            <span className="text-xs text-slate-500">Hybrid Classical-Quantum</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Model: Hybrid-VQC-v1.0</span>
            <span className="font-mono text-emerald-700 font-semibold">Ready</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Triage Queue & Clinical Workflows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pending Triage Queue Table */}
        <div className="lg:col-span-2 clinical-card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Pending Clinical Review Queue</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Patients requiring clinician review and decision confirmation
              </p>
            </div>
            <button
              onClick={onNavigateToAlerts}
              className="text-xs text-cyan-700 hover:text-cyan-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>View All Alerts</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {recentAlerts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No unacknowledged high-risk alerts at this time.
              </div>
            ) : (
              recentAlerts.map((alt) => (
                <div
                  key={alt.alert_id}
                  onClick={() => onNavigateToDecision(alt.record_id)}
                  className="p-3 rounded bg-slate-50 border border-slate-200 hover:bg-slate-100/80 transition-colors cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-0.5 ${
                        alt.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {alt.severity}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 font-mono">{alt.record_id}</span>
                        <span className="text-xs text-slate-600 font-mono">
                          Risk Score: {(alt.risk_score * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{alt.reason}</p>
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-cyan-700 group-hover:underline flex items-center gap-1 self-end sm:self-center shrink-0">
                    <span>Open Case</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Clinical Actions */}
        <div className="clinical-card p-5 space-y-4">
          <div className="pb-3 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">Clinical Workflows</h2>
            <p className="text-xs text-slate-500 mt-0.5">Primary decision-support actions</p>
          </div>

          <div className="space-y-2">
            <button
              onClick={onNavigateToNewPrediction}
              className="w-full text-left p-3 rounded bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-cyan-800 flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-cyan-700" />
                  New Assessment
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Upload PDF report or enter biomarkers manually
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-700" />
            </button>

            <button
              onClick={() => onNavigateToDecision()}
              className="w-full text-left p-3 rounded bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-cyan-800 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-cyan-700" />
                  Decision Support Result
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  View risk stratification, SHAP drivers, & recommendations
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-700" />
            </button>

            <button
              onClick={onNavigateToPatients}
              className="w-full text-left p-3 rounded bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors flex items-center justify-between group cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-cyan-800 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-cyan-700" />
                  Research Cohort Directory
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Browse research cohort records and risk categories
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-700" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
