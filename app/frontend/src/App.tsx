import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { ClinicalDecisionPage } from './pages/ClinicalDecisionPage';
import { ModelLabPage } from './pages/ModelLabPage';
import { QuantumLabPage } from './pages/QuantumLabPage';
import { DataQualityPage } from './pages/DataQualityPage';
import { AlertsPage } from './pages/AlertsPage';
import { DoctorReviewPage } from './pages/DoctorReviewPage';
import { NewPredictionPage } from './pages/NewPredictionPage';
import { PatientRecordsPage } from './pages/PatientRecordsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { VisionDermPage } from './pages/VisionDermPage';
import { ArchitectureUspPage } from './pages/ArchitectureUspPage';
import { CancerGenomicsPage } from './pages/CancerGenomicsPage';
import { UserGuidePage } from './pages/UserGuidePage';
import { PatientReportUploaderPage } from './pages/PatientReportUploaderPage';
import { PermanentQrModal } from './components/PermanentQrModal';
import { fetchAlerts, fetchDemoCases, predictPatientRisk } from './api';
import { PredictionResult } from './types';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [pendingAlertsCount, setPendingAlertsCount] = useState<number>(0);
  const [activeModelVersion, setActiveModelVersion] = useState<string>('Hybrid-VQC-v1.0');
  const [selectedRecordId, setSelectedRecordId] = useState<string | undefined>(undefined);
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);

  useEffect(() => {
    refreshAlertCount();
    const interval = setInterval(refreshAlertCount, 15000);
    return () => clearInterval(interval);
  }, []);

  async function refreshAlertCount() {
    try {
      const alerts = await fetchAlerts('ALL', 'PENDING');
      setPendingAlertsCount(alerts.length);
    } catch (err) {
      // Offline fallback
    }
  }

  // 1-Click "Run Full Pipeline Demo" runner
  async function handleRunFullDemo() {
    setIsDemoRunning(true);
    try {
      const demoCases = await fetchDemoCases();
      const highRiskCase = demoCases.find((c) => c.case_id.includes('HIGH')) || demoCases[0];

      // Execute actual prediction
      const result = await predictPatientRisk(highRiskCase.features, highRiskCase.case_id);
      setActiveModelVersion(result.model_version);
      setSelectedRecordId(result.record_id);

      // Refresh alerts
      await refreshAlertCount();

      // Navigate directly to flagship decision support screen to show the result
      setCurrentTab('decision_support');
    } catch (err) {
      console.error('Demo execution failed:', err);
    } finally {
      setIsDemoRunning(false);
    }
  }

  function handleNavigateToDecision(recordId?: string) {
    if (recordId) setSelectedRecordId(recordId);
    setCurrentTab('decision_support');
  }

  function handlePredictionComplete(pred: PredictionResult) {
    setSelectedRecordId(pred.record_id);
    setActiveModelVersion(pred.model_version);
    refreshAlertCount();
    setCurrentTab('decision_support');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        pendingAlertsCount={pendingAlertsCount}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onOpenQr={() => setIsQrModalOpen(true)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Workspace Viewport */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        <Header
          activeModelVersion={activeModelVersion}
          pendingAlertsCount={pendingAlertsCount}
          onRunDemo={handleRunFullDemo}
          isDemoRunning={isDemoRunning}
          onOpenQr={() => setIsQrModalOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Permanent 24/7 Mobile QR Modal */}
        <PermanentQrModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
        />

        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-6 bg-gradient-to-b from-slate-950 via-slate-900/40 to-slate-950">
          <div className="w-full max-w-7xl mx-auto pb-12 min-w-0">
            {currentTab === 'dashboard' && (
              <DashboardPage
                onNavigateToDecision={handleNavigateToDecision}
                onNavigateToAlerts={() => setCurrentTab('alerts')}
                onNavigateToNewPrediction={() => setCurrentTab('new_prediction')}
              />
            )}

            {currentTab === 'patient_pdf_uploader' && <PatientReportUploaderPage />}
            {currentTab === 'user_guide' && <UserGuidePage />}
            {currentTab === 'architecture_usp' && <ArchitectureUspPage />}
            {currentTab === 'cancer_genomics' && <CancerGenomicsPage />}

            {currentTab === 'decision_support' && (
              <ClinicalDecisionPage initialRecordId={selectedRecordId} />
            )}

            {currentTab === 'vision_derm' && <VisionDermPage />}

            {currentTab === 'new_prediction' && (
              <NewPredictionPage onPredictionComplete={handlePredictionComplete} />
            )}

            {currentTab === 'alerts' && (
              <AlertsPage onNavigateToDecision={handleNavigateToDecision} />
            )}

            {currentTab === 'doctor_review' && <DoctorReviewPage />}

            {currentTab === 'model_lab' && <ModelLabPage />}

            {currentTab === 'quantum_lab' && <QuantumLabPage />}

            {currentTab === 'data_quality' && <DataQualityPage />}

            {currentTab === 'patient_records' && (
              <PatientRecordsPage onSelectRecord={handleNavigateToDecision} />
            )}

            {currentTab === 'reports' && <ReportsPage />}

            {currentTab === 'audit_logs' && <AuditLogsPage />}

            {currentTab === 'settings' && <SettingsPage />}
          </div>
        </main>
      </div>
    </div>
  );
};
export default App;
