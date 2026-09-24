import React from 'react';
import { Cpu, Bell, Activity, User, QrCode, Menu } from 'lucide-react';

interface HeaderProps {
  activeModelVersion?: string;
  pendingAlertsCount: number;
  selectedRecordId?: string;
  onNavigateToAlerts?: () => void;
  onOpenQr?: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeModelVersion = 'Hybrid-VQC-v1.0',
  pendingAlertsCount,
  selectedRecordId,
  onNavigateToAlerts,
  onOpenQr,
  onToggleMobileMenu
}) => {
  return (
    <header className="h-14 px-4 sm:px-6 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-30 shrink-0">
      {/* Left: Mobile Menu & Active Context */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors shrink-0 cursor-pointer"
            title="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {selectedRecordId ? (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs truncate">
            <User className="w-3.5 h-3.5 text-cyan-700 shrink-0" />
            <span className="text-slate-500 font-medium hidden sm:inline">Active Patient Context:</span>
            <span className="font-mono font-bold text-slate-900 truncate">{selectedRecordId}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
            <Activity className="w-3.5 h-3.5 text-cyan-700 shrink-0" />
            <span className="font-semibold text-slate-800 truncate">BlazeFinix Clinical Decision Support</span>
          </div>
        )}

        <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-200 text-xs text-slate-500">
          <Cpu className="w-3.5 h-3.5 text-slate-400" />
          <span>Model Engine:</span>
          <span className="font-mono text-slate-700 font-medium">{activeModelVersion}</span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Permanent Mobile QR Button */}
        {onOpenQr && (
          <button
            onClick={onOpenQr}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 transition-colors cursor-pointer shadow-xs"
            title="Scan 24/7 Mobile QR Code"
          >
            <QrCode className="w-3.5 h-3.5 text-cyan-700 shrink-0" />
            <span className="hidden sm:inline">Mobile QR</span>
          </button>
        )}

        {/* Research Disclaimer Pill */}
        <div className="hidden xl:inline-flex items-center px-2.5 py-1 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
          Research Prototype — Decision Support Only
        </div>

        {/* System Backend Status */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          <span className="text-[11px]">Backend Online</span>
        </div>

        {/* Alerts Notification Button */}
        <button
          onClick={onNavigateToAlerts}
          className="relative p-1.5 rounded bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
          title="View Alerts & Triage Queue"
        >
          <Bell className="w-4 h-4" />
          {pendingAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs">
              {pendingAlertsCount}
            </span>
          )}
        </button>

        {/* Attending Clinician Badge */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="w-7 h-7 rounded bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-800 text-xs font-bold font-mono">
            MD
          </div>
          <div className="hidden sm:block text-left leading-tight">
            <div className="text-xs font-bold text-slate-900">Clinical Attending</div>
            <div className="text-[10px] text-slate-500">Cardiometabolic & Oncology</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
