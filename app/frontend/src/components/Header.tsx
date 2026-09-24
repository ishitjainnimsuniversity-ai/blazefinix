import React from 'react';
import { Bell, PlayCircle, QrCode, Menu } from 'lucide-react';

interface HeaderProps {
  activeModelVersion?: string;
  pendingAlertsCount: number;
  onRunDemo: () => void;
  isDemoRunning?: boolean;
  onOpenQr?: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeModelVersion,
  pendingAlertsCount,
  onRunDemo,
  isDemoRunning = false,
  onOpenQr,
  onToggleMobileMenu
}: HeaderProps) => {
  return (
    <header className="h-16 px-4 sm:px-6 glass-panel border-b border-slate-800/80 flex items-center justify-between sticky top-0 z-30 shrink-0">
      {/* Left: Mobile Menu Toggle & System Title */}
      <div className="flex items-center gap-3 min-w-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-800 transition-colors shrink-0"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2 truncate">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-xs sm:text-sm font-bold text-slate-200 tracking-tight truncate">
            Clinical Decision Support System
          </span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Permanent Mobile QR Button */}
        {onOpenQr && (
          <button
            onClick={onOpenQr}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-sm transition-all"
            title="Scan 24/7 Mobile QR Code"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">24/7 Mobile QR</span>
          </button>
        )}

        {/* Full Demo Trigger Button */}
        <button
          onClick={onRunDemo}
          disabled={isDemoRunning}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-all shadow-sm active:scale-95 shrink-0"
        >
          <PlayCircle className={`w-4 h-4 shrink-0 ${isDemoRunning ? 'animate-spin' : ''}`} />
          <span>
            {isDemoRunning ? 'Executing Demo...' : (
              <>
                <span className="inline sm:hidden">Run Demo</span>
                <span className="hidden sm:inline">Run Full Pipeline Demo</span>
              </>
            )}
          </span>
        </button>

        {/* Alerts Notification Badge */}
        <div className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0">
          <Bell className="w-4 h-4" />
          {pendingAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
              {pendingAlertsCount}
            </span>
          )}
        </div>

        {/* Profile Avatar */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-800 shrink-0">
          <div className="w-7 h-7 rounded-full bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-300 text-xs font-bold shrink-0">
            MD
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-medium text-slate-200">Clinical Attending</div>
            <div className="text-[10px] text-slate-500">Research & Triage</div>
          </div>
        </div>
      </div>
    </header>
  );
};

