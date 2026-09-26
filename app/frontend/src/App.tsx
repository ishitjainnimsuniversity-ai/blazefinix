import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DemoInfoModal } from './components/DemoInfoModal';
import { DashboardPage } from './pages/DashboardPage';
import { ClinicalDecisionPage } from './pages/ClinicalDecisionPage';
import { ModelLabPage } from './pages/ModelLabPage';
import { QuantumLabPage } from './pages/QuantumLabPage';
import { AlertsPage } from './pages/AlertsPage';
import { NewPredictionPage } from './pages/NewPredictionPage';
import { PatientRecordsPage } from './pages/PatientRecordsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CancerGenomicsPage } from './pages/CancerGenomicsPage';
import { fetchAlerts, checkCapabilities, SystemCapabilities } from './api';
import { PredictionResult } from './types';
import { Info } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [pendingAlertsCount, setPendingAlertsCount] = useState<number>(0);
  const [selectedRecordId, setSelectedRecordId] = useState<string | undefined>(undefined);
  const [capabilities, setCapabilities] = useState<SystemCapabilities | null>(null);
  const [isDemoInfoOpen, setIsDemoInfoOpen] = useState<boolean>(false);

  useEffect(() => {
    loadCapabilities();
    refreshAlertCount();
    const interval = setInterval(refreshAlertCount, 15000);
    return () => clearInterval(interval);
  }, []);

  async function loadCapabilities() {
    try {
      const caps = await checkCapabilities();
      setCapabilities(caps);
    } catch {
      // Fallback
    }
  }

  async function refreshAlertCount() {
    try {
      const alerts = await fetchAlerts('ALL', 'PENDING');
      setPendingAlertsCount(alerts.length);
    } catch (err) {
      // Offline fallback
    }
  }

  function handleNavigateToDecision(recordId?: string) {
    if (recordId) setSelectedRecordId(recordId);
    setCurrentTab('decision_support');
  }

  function handlePredictionComplete(pred: PredictionResult) {
    setSelectedRecordId(pred.record_id);
    refreshAlertCount();
    setCurrentTab('decision_support');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        pendingAlertsCount={pendingAlertsCount}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Workspace Viewport */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        <Header
          pendingAlertsCount={pendingAlertsCount}
          selectedRecordId={selectedRecordId}
          capabilities={capabilities}
          onNavigateToAlerts={() => setCurrentTab('alerts_review')}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onOpenDemoInfo={() => setIsDemoInfoOpen(true)}
        />

        {/* Demo Mode Disclosure Banner */}
        {capabilities?.mode === 'demo' && (
          <div className="bg-amber-500/10 border-b border-amber-300/60 px-4 py-2 text-xs text-amber-950 flex flex-wrap items-center justify-between gap-2 shrink-0 backdrop-blur-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-200/80 text-amber-900 rounded border border-amber-400/50 shrink-0">
                DEMONSTRATION MODE — PUBLIC DEPLOYMENT
              </span>
              <span className="text-[11px] sm:text-[12px] text-amber-900 font-medium truncate">
                Hosted demo uses simulated results because full local ML/QML pipeline is not deployed on Vercel. Underlying system is implemented and executable locally.
              </span>
            </div>
            <button
              onClick={() => setIsDemoInfoOpen(true)}
              className="text-cyan-800 font-bold text-[11px] underline hover:text-cyan-900 shrink-0 cursor-pointer"
            >
              System Info & Architecture
            </button>
          </div>
        )}

        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 lg:p-6 bg-slate-50">
          <div className="w-full max-w-7xl mx-auto pb-12 min-w-0">
            {currentTab === 'overview' && (
              <DashboardPage
                onNavigateToDecision={handleNavigateToDecision}
                onNavigateToAlerts={() => setCurrentTab('alerts_review')}
                onNavigateToNewPrediction={() => setCurrentTab('new_assessment')}
                onNavigateToPatients={() => setCurrentTab('patients')}
              />
            )}

            {currentTab === 'patients' && (
              <PatientRecordsPage onSelectRecord={handleNavigateToDecision} />
            )}

            {currentTab === 'new_assessment' && (
              <NewPredictionPage onPredictionComplete={handlePredictionComplete} />
            )}

            {currentTab === 'decision_support' && (
              <ClinicalDecisionPage initialRecordId={selectedRecordId} />
            )}

            {currentTab === 'alerts_review' && (
              <AlertsPage onNavigateToDecision={handleNavigateToDecision} />
            )}

            {currentTab === 'reports' && <ReportsPage />}

            {currentTab === 'model_lab' && <ModelLabPage />}

            {currentTab === 'quantum_lab' && <QuantumLabPage />}

            {currentTab === 'genomics_data' && <CancerGenomicsPage />}

            {currentTab === 'audit_settings' && (
              <div className="space-y-6">
                <AuditLogsPage />
                <SettingsPage />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Demo Info Modal */}
      <DemoInfoModal
        isOpen={isDemoInfoOpen}
        capabilities={capabilities}
        onClose={() => setIsDemoInfoOpen(false)}
        onRefresh={loadCapabilities}
      />
    </div>
  );
};

export default App;
