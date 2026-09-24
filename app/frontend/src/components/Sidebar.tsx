import React from 'react';
import {
  LayoutDashboard,
  Stethoscope,
  PlusCircle,
  Camera,
  BellRing,
  UserCheck,
  FlaskConical,
  Atom,
  Database,
  Users,
  ShieldCheck,
  Sliders,
  FileText,
  Layers,
  Dna,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  QrCode
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'patient_pdf_uploader'
  | 'user_guide'
  | 'architecture_usp'
  | 'cancer_genomics'
  | 'decision_support'
  | 'new_prediction'
  | 'vision_derm'
  | 'alerts'
  | 'doctor_review'
  | 'model_lab'
  | 'quantum_lab'
  | 'data_quality'
  | 'patient_records'
  | 'reports'
  | 'audit_logs'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingAlertsCount: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenQr?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingAlertsCount,
  isCollapsed = false,
  onToggleCollapse,
  onOpenQr,
  isMobileOpen = false,
  onCloseMobile
}: SidebarProps) => {
  const navItems: { id: NavTab; label: string; icon: any; badge?: number }[] = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { id: 'patient_pdf_uploader', label: 'PDF Uploader (QML/CML 20Q)', icon: FileText },
    { id: 'user_guide', label: 'Model Operating Guide', icon: BookOpen },
    { id: 'cancer_genomics', label: 'Cancer Genomics & APIs', icon: Dna },
    { id: 'architecture_usp', label: 'Hybrid AI/QML Architecture', icon: Layers },
    { id: 'decision_support', label: 'Clinical AI Decision', icon: Stethoscope },
    { id: 'vision_derm', label: 'Skin & Genomic Vision', icon: Camera },
    { id: 'new_prediction', label: 'New Risk Prediction', icon: PlusCircle },
    { id: 'alerts', label: 'Alerts Center', icon: BellRing, badge: pendingAlertsCount },
    { id: 'doctor_review', label: 'Doctor Review Loop', icon: UserCheck },
    { id: 'model_lab', label: 'Model Benchmark Lab', icon: FlaskConical },
    { id: 'quantum_lab', label: 'Quantum Simulator (ML/DL)', icon: Atom },
    { id: 'data_quality', label: 'Data Quality & NCBI', icon: Database },
    { id: 'patient_records', label: 'Cohort Records', icon: Users },
    { id: 'reports', label: 'Clinical Reports', icon: FileText },
    { id: 'audit_logs', label: 'Audit Trail', icon: ShieldCheck },
    { id: 'settings', label: 'Thresholds & Settings', icon: Sliders },
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
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 shrink-0 glass-panel border-r border-slate-800/80 flex flex-col h-screen select-none transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'w-16' : 'w-60 lg:w-64'}`}
      >
        {/* Brand Header */}
        <div className="h-16 px-3 lg:px-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Atom className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                  <span>BLAZEFINIX</span>
                  <span className="text-xs px-1 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-mono">QML</span>
                </div>
                <div className="text-[10px] text-slate-400 tracking-wider uppercase font-medium truncate">
                  Clinical AI Platform
                </div>
              </div>
            )}
          </div>

          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden md:block p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {!isCollapsed ? (
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Clinical Operations
            </div>
          ) : (
            <div className="h-2" />
          )}
          {navItems.slice(0, 6).map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2.5'} rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'} min-w-0`}>
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  {!isCollapsed && <span className="truncate text-left">{item.label}</span>}
                </div>
                {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {!isCollapsed ? (
            <div className="pt-4 px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Research & Validation
            </div>
          ) : (
            <div className="h-4 border-t border-slate-800/60 my-2" />
          )}
          {navItems.slice(6).map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2.5'} rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-2.5'} min-w-0`}>
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  {!isCollapsed && <span className="truncate text-left">{item.label}</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* 24/7 Mobile QR Card */}
        {onOpenQr && !isCollapsed && (
          <div className="px-3 pb-2">
            <div
              onClick={() => {
                onOpenQr();
                if (onCloseMobile) onCloseMobile();
              }}
              className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-950/60 to-emerald-950/60 border border-emerald-500/30 hover:border-emerald-500/60 cursor-pointer transition-all group shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  Permanent QR
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                  24/7
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                Scan with phone to open cloud app anytime.
              </p>
            </div>
          </div>
        )}

        {onOpenQr && isCollapsed && (
          <div className="px-2 pb-2">
            <button
              onClick={() => {
                onOpenQr();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full flex justify-center p-2 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30 transition-colors"
              title="Scan Permanent 24/7 Mobile QR Code"
            >
              <QrCode className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Footer Info */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/50">
          {!isCollapsed ? (
            <>
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Engine Status</span>
                <span className="text-emerald-400 font-mono font-medium">ONLINE</span>
              </div>
              <div className="mt-0.5 text-[10px] text-slate-500 truncate">
                Hybrid XGBoost + VQC
              </div>
            </>
          ) : (
            <div className="flex justify-center" title="Engine Status: ONLINE">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

