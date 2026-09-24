import React from 'react';
import {
  LayoutDashboard,
  Stethoscope,
  PlusCircle,
  Bell,
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
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingAlertsCount,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const clinicalItems = [
    { id: 'overview' as NavTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'patients' as NavTab, label: 'Patients & Cohorts', icon: Users },
    { id: 'new_assessment' as NavTab, label: 'New Assessment', icon: PlusCircle },
    { id: 'decision_support' as NavTab, label: 'Decision Support', icon: Stethoscope },
    { id: 'alerts_review' as NavTab, label: 'Alerts & Review', icon: Bell, badge: pendingAlertsCount },
    { id: 'reports' as NavTab, label: 'Clinical Reports', icon: FileText },
  ];

  const researchItems = [
    { id: 'model_lab' as NavTab, label: 'Model Benchmarks', icon: FlaskConical },
    { id: 'quantum_lab' as NavTab, label: 'Quantum Circuit Lab', icon: Atom },
    { id: 'genomics_data' as NavTab, label: 'Genomics & NCBI Data', icon: Database },
    { id: 'audit_settings' as NavTab, label: 'Audit & Settings', icon: ShieldCheck },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 shrink-0 bg-white border-r border-slate-200 flex flex-col h-screen select-none transition-transform duration-200 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'w-16' : 'w-60 lg:w-64'}`}
      >
        {/* Brand Header */}
        <div className="h-14 px-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded bg-cyan-700 flex items-center justify-center text-white shrink-0 shadow-xs">
              <Activity className="w-4 h-4" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="text-sm font-bold tracking-tight text-slate-900 truncate flex items-center gap-1.5">
                  <span>BLAZEFINIX</span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-50 text-cyan-800 font-mono">QML</span>
                </div>
                <div className="text-[10px] text-slate-500 font-medium tracking-wide uppercase truncate">
                  Clinical Decision Support
                </div>
              </div>
            )}
          </div>

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden md:block p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-4">
          {/* Clinical Section */}
          <div>
            {!isCollapsed ? (
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Clinical Workspace
              </div>
            ) : (
              <div className="h-1" />
            )}
            <div className="space-y-0.5">
              {clinicalItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center ${
                      isCollapsed ? 'justify-center px-2 py-2' : 'justify-between px-3 py-2'
                    } rounded text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-cyan-50 text-cyan-800 font-semibold border-l-2 border-cyan-600'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'} min-w-0`}>
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-700' : 'text-slate-400'}`} />
                      {!isCollapsed && <span className="truncate text-left">{item.label}</span>}
                    </div>
                    {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                      <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-100 text-rose-700 shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Research Section */}
          <div>
            {!isCollapsed ? (
              <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Research & Platform
              </div>
            ) : (
              <div className="h-1 border-t border-slate-200 my-2" />
            )}
            <div className="space-y-0.5">
              {researchItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center ${
                      isCollapsed ? 'justify-center px-2 py-2' : 'justify-between px-3 py-2'
                    } rounded text-xs font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-cyan-50 text-cyan-800 font-semibold border-l-2 border-cyan-600'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'} min-w-0`}>
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-700' : 'text-slate-400'}`} />
                      {!isCollapsed && <span className="truncate text-left">{item.label}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer System Status */}
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          {!isCollapsed ? (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">System Status</span>
              <span className="text-emerald-700 font-mono text-[11px] flex items-center gap-1.5 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                ONLINE
              </span>
            </div>
          ) : (
            <div className="flex justify-center" title="System Status: ONLINE">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
