import React, { useState, useEffect } from 'react';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
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
import { fetchAlerts } from './api';
import { PredictionResult } from './types';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [pendingAlertsCount, setPendingAlertsCount] = useState<number>(0);
  const [activeModelVersion, setActiveModelVersion] = useState<string>('Hybrid-VQC-v1.0');
  const [selectedRecordId, setSelectedRecordId] = useState<string | undefined>(undefined);

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
    <div className="flex h-screen overflow-hidden bg-slate-900 text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        pendingAlertsCount={pendingAlertsCount}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Workspace Viewport */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        <Header
          activeModelVersion={activeModelVersion}
          pendingAlertsCount={pendingAlertsCount}
          selectedRecordId={selectedRecordId}
          onNavigateToAlerts={() => setCurrentTab('alerts_review')}
        />

        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 lg:p-6 bg-slate-900">
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
    </div>
  );
};

export default App;
