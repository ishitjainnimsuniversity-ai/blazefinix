import React from 'react';
import {
  LayoutDashboard,
  Stethoscope,
  PlusCircle,
  BellRing,
  FlaskConical,
  Atom,
  Database,
  Users,
  ShieldCheck,
  FileText,
  ChevronLeft,
  ChevronRight,
  Activity
} from 'lucide-react';

export type NavTab =
  | 'overview'
  | 'patients'
  | 'new_assessment'
  | 'decision_support'
  | 'alerts_review'
  | 'reports'
  | 'model_lab'
  | 'quantum_lab'
  | 'genomics_data'
  | 'audit_settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingAlertsCount: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingAlertsCount,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const clinicalItems = [
    { id: 'overview' as NavTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'patients' as NavTab, label: 'Patients & Cohorts', icon: Users },
    { id: 'new_assessment' as NavTab, label: 'New Assessment', icon: PlusCircle },
    { id: 'decision_support' as NavTab, label: 'Decision Support', icon: Stethoscope },
    { id: 'alerts_review' as NavTab, label: 'Alerts & Review', icon: BellRing, badge: pendingAlertsCount },
    { id: 'reports' as NavTab, label: 'Clinical Reports', icon: FileText },
  ];

  const researchItems = [
    { id: 'model_lab' as NavTab, label: 'Model Benchmarks', icon: FlaskConical },
    { id: 'quantum_lab' as NavTab, label: 'Quantum Circuit Lab', icon: Atom },
    { id: 'genomics_data' as NavTab, label: 'Genomics & NCBI Data', icon: Database },
    { id: 'audit_settings' as NavTab, label: 'Audit & Settings', icon: ShieldCheck },
  ];

  return (
    <aside
      className={`shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col h-screen select-none transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-60 lg:w-64'
      }`}
    >
      {/* Header / Brand */}
      <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-md bg-teal-600/20 border border-teal-500/30 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 text-teal-400" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>BLAZEFINIX</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium tracking-wide uppercase truncate">
                Clinical Decision Support
              </div>
            </div>
          )}
        </div>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Clinical Workspace Section */}
        <div>
          {!isCollapsed ? (
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Clinical Workspace
            </div>
          ) : (
            <div className="h-2" />
          )}
          <div className="space-y-1">
            {clinicalItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
                  } rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                  }`}
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'} min-w-0`}>
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                    {!isCollapsed && <span className="truncate text-left">{item.label}</span>}
                  </div>
                  {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Research & Platform Section */}
        <div>
          {!isCollapsed ? (
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Research & Platform
            </div>
          ) : (
            <div className="h-2 border-t border-slate-800/60 my-2" />
          )}
          <div className="space-y-1">
            {researchItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'
                  } rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent'
                  }`}
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'} min-w-0`}>
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                    {!isCollapsed && <span className="truncate text-left">{item.label}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Info / System Status */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/90">
        {!isCollapsed ? (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">System Status</span>
            <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              ONLINE
            </span>
          </div>
        ) : (
          <div className="flex justify-center" title="System Status: ONLINE">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
        )}
      </div>
    </aside>
  );
};
