import React from 'react';
import { Cpu, Bell, Activity, User } from 'lucide-react';

interface HeaderProps {
  activeModelVersion?: string;
  pendingAlertsCount: number;
  selectedRecordId?: string;
  onNavigateToAlerts?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeModelVersion = 'Hybrid-VQC-v1.0',
  pendingAlertsCount,
  selectedRecordId,
  onNavigateToAlerts
}) => {
  return (
    <header className="h-14 px-6 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-30 shrink-0">
      {/* Left: Active Patient Context */}
      <div className="flex items-center gap-4">
        {selectedRecordId ? (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs">
            <User className="w-3.5 h-3.5 text-cyan-700" />
            <span className="text-slate-500 font-medium">Active Patient Context:</span>
            <span className="font-mono font-bold text-slate-900">{selectedRecordId}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Activity className="w-3.5 h-3.5 text-cyan-700" />
            <span className="font-semibold text-slate-800">BlazeFinix Clinical Decision Support</span>
          </div>
        )}

        <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-200 text-xs text-slate-500">
          <Cpu className="w-3.5 h-3.5 text-slate-400" />
          <span>Model Engine:</span>
          <span className="font-mono text-slate-700 font-medium">{activeModelVersion}</span>
        </div>
      </div>

      {/* Right: Disclaimer, Alerts, Attending User */}
      <div className="flex items-center gap-3">
        {/* Research Disclaimer Pill */}
        <div className="hidden sm:inline-flex items-center px-2.5 py-1 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
          Research Prototype — Decision Support Only
        </div>

        {/* System Backend Status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          <span className="text-[11px]">Backend Online</span>
        </div>

        {/* Alerts Notification Button */}
        <button
          onClick={onNavigateToAlerts}
          className="relative p-1.5 rounded bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
          title="View Alerts & Triage Queue"
        >
          <Bell className="w-4 h-4" />
          {pendingAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-sm">
              {pendingAlertsCount}
            </span>
          )}
        </button>

        {/* Attending Clinician Badge */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-7 h-7 rounded bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-800 text-xs font-bold font-mono">
            MD
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-semibold text-slate-900">Clinical Attending</div>
            <div className="text-[10px] text-slate-500">Cardiometabolic & Oncology</div>
          </div>
        </div>
      </div>
    </header>
  );
};
