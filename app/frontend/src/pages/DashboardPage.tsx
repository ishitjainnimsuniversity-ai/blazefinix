import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Users,
  ChevronRight,
  PlusCircle,
  Stethoscope,
  Clock,
  ShieldCheck
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
    <div className="space-y-6">
      {/* Top Banner Medical Disclaimer */}
      <MedicalDisclaimer />

      {/* Header Overview Banner */}
      <div className="clinical-card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="clinical-badge bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Clinical Decision Support
            </span>
            <span className="text-xs text-slate-400">Cardiometabolic & Oncology Stratification</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1 tracking-tight">
            Clinical Operations Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Real-time patient risk triage, unreviewed clinical alerts, and decision support pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={onNavigateToNewPrediction}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-md text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Patient Assessment</span>
          </button>
        </div>
      </div>

      {/* Actionable Triage Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Pending Alerts */}
        <div
          onClick={onNavigateToAlerts}
          className="clinical-card p-4 hover:border-slate-600 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pending Alert Triage
            </span>
            <div className="p-1.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              {analytics ? analytics.pending_doctor_reviews : '—'}
            </span>
            <span className="text-xs text-rose-400 font-medium">unreviewed alerts</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-700/50">
            <span>Critical severity: {analytics ? analytics.critical_alerts : 0}</span>
            <span className="text-teal-400 group-hover:underline flex items-center gap-1 font-medium">
              Review <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Metric 2: Active Cohort */}
        <div
          onClick={onNavigateToPatients}
          className="clinical-card p-4 hover:border-slate-600 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Patient Directory
            </span>
            <div className="p-1.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              {analytics ? analytics.records_analyzed : '—'}
            </span>
            <span className="text-xs text-teal-400 font-medium">cohort records</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-700/50">
            <span>High Risk Cases: {analytics ? analytics.high_risk_cases : 0}</span>
            <span className="text-teal-400 group-hover:underline flex items-center gap-1 font-medium">
              View Directory <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Metric 3: System Status */}
        <div className="clinical-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Decision Support Engine
            </span>
            <div className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-base font-bold text-emerald-400">OPERATIONAL</span>
            <span className="text-xs text-slate-400">Hybrid Classical-Quantum</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 pt-2 border-t border-slate-700/50 flex items-center justify-between">
            <span>Model: Hybrid-VQC-v1.0</span>
            <span className="font-mono text-emerald-400">Ready</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Triage Queue & Clinical Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Alerts Triage Queue */}
        <div className="lg:col-span-2 clinical-card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/80">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Pending Clinical Triage Queue</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Patients requiring clinician review and decision confirmation
              </p>
            </div>
            <button
              onClick={onNavigateToAlerts}
              className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-4 space-y-2.5">
            {recentAlerts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No unacknowledged high-risk alerts at this time.
              </div>
            ) : (
              recentAlerts.map((alt) => (
                <div
                  key={alt.alert_id}
                  onClick={() => onNavigateToDecision(alt.record_id)}
                  className="p-3 rounded-md bg-slate-900/90 border border-slate-700/80 hover:border-slate-600 transition-colors cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-0.5 ${
                        alt.severity === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {alt.severity}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">{alt.record_id}</span>
                        <span className="text-xs text-slate-300 font-mono">
                          Risk Score: {(alt.risk_score * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{alt.reason}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="text-xs font-medium text-teal-400 group-hover:underline flex items-center gap-1">
                      <span>Open Assessment</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Workflow Navigation */}
        <div className="clinical-card p-5 space-y-4">
          <div className="pb-3 border-b border-slate-700/80">
            <h2 className="text-sm font-bold text-white">Clinical Workflows</h2>
            <p className="text-xs text-slate-400 mt-0.5">Primary decision-support actions</p>
          </div>

          <div className="space-y-2">
            <button
              onClick={onNavigateToNewPrediction}
              className="w-full text-left p-3 rounded bg-slate-900 border border-slate-700/80 hover:border-slate-600 transition-colors flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-teal-300 flex items-center gap-1.5">
                  <PlusCircle className="w-3.5 h-3.5 text-teal-400" />
                  New Assessment
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Upload PDF report or enter biomarkers manually
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400" />
            </button>

            <button
              onClick={() => onNavigateToDecision()}
              className="w-full text-left p-3 rounded bg-slate-900 border border-slate-700/80 hover:border-slate-600 transition-colors flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-teal-300 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
                  Decision Support Result
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  View risk stratification, SHAP drivers, & recommendations
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400" />
            </button>

            <button
              onClick={onNavigateToPatients}
              className="w-full text-left p-3 rounded bg-slate-900 border border-slate-700/80 hover:border-slate-600 transition-colors flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-teal-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-teal-400" />
                  Cohort Directory
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Browse past records, risk categories, and doctor sign-offs
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
