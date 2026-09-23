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
    <header className="h-14 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between sticky top-0 z-30 shrink-0">
      {/* Left: Active Context & Patient Indicator */}
      <div className="flex items-center gap-4">
        {selectedRecordId ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-teal-500/10 border border-teal-500/30 text-xs">
            <User className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-slate-400">Active Patient:</span>
            <span className="font-mono font-semibold text-teal-300">{selectedRecordId}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Activity className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-medium text-slate-300">BlazeFinix Decision Support</span>
          </div>
        )}

        <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-800 text-xs text-slate-400">
          <Cpu className="w-3.5 h-3.5 text-slate-400" />
          <span>Engine:</span>
          <span className="font-mono text-slate-300 font-medium">{activeModelVersion}</span>
        </div>
      </div>

      {/* Right: Operational Status, Alerts, Attending User */}
      <div className="flex items-center gap-3">
        {/* Research Disclaimer Pill */}
        <div className="hidden sm:inline-flex items-center px-2.5 py-1 rounded text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
          Research Prototype — Decision Support Only
        </div>

        {/* System Backend Status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-slate-800/80 border border-slate-700 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="text-[11px] font-medium">Backend Online</span>
        </div>

        {/* Alerts Center Notification Button */}
        <button
          onClick={onNavigateToAlerts}
          className="relative p-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          title="View Alerts & Triage Queue"
        >
          <Bell className="w-4 h-4" />
          {pendingAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
              {pendingAlertsCount}
            </span>
          )}
        </button>

        {/* Physician Profile */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
          <div className="w-7 h-7 rounded bg-teal-600/20 border border-teal-500/30 flex items-center justify-center text-teal-300 text-xs font-bold font-mono">
            MD
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-medium text-slate-200">Clinical Attending</div>
            <div className="text-[10px] text-slate-400">Cardiometabolic & Oncology</div>
          </div>
        </div>
      </div>
    </header>
  );
};
