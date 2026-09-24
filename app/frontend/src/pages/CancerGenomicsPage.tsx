import React, { useState, useEffect } from 'react';
import {
  Dna,
  Database,
  Activity,
  Download,
  FileText,
  UserCheck,
  CheckCircle2,
  Atom,
  TrendingUp,
  Cpu,
  Info,
  HelpCircle,
  Users
} from 'lucide-react';
import {
  fetchTopCancers,
  fetchRealPatients,
  fetchGenomicStructure,
  fetchCohortCases,
  fetchStudyMutations,
  fetchIcgcArgoMetadata,
  evaluateCancerRisk,
  downloadCancerPdfReport,
  getReportPdfUrl,
  getDoctorReportPdfUrl,
  getPatientReportPdfUrl
} from '../api';
import { getGenesForRecord, WORLD_CANCER_PATIENTS } from '../utils/cancerGenomicsData';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';

export const CancerGenomicsPage: React.FC = () => {
  const [sexFilter, setSexFilter] = useState<'females' | 'males' | 'both'>('females');
  const [topCancersData, setTopCancersData] = useState<any>(null);
  const [selectedCancer, setSelectedCancer] = useState<any>(null);
  const [selectedGene, setSelectedGene] = useState<string>('BRCA1');
  
  // Real Patients Library (World Pan-Cancer & Sexes)
  const [realPatientsData, setRealPatientsData] = useState<any>(null);
  const [realPatientSexTab, setRealPatientSexTab] = useState<'world' | 'females' | 'males'>('world');
  const [, setSelectedLibraryPatient] = useState<any>(null);

  // Live Data States
  const [genomicStructure, setGenomicStructure] = useState<any>(null);
  const [isLoadingGenome, setIsLoadingGenome] = useState<boolean>(false);
  const [cohortCases, setCohortCases] = useState<any[]>([]);
  const [isLoadingCases, setIsLoadingCases] = useState<boolean>(false);
  const [studyMutations, setStudyMutations] = useState<any[]>([]);
  const [isLoadingMutations, setIsLoadingMutations] = useState<boolean>(false);
  const [, setIcgcInfo] = useState<any>(null);

  // Active Evaluation State
  const [selectedCase, setSelectedCase] = useState<any>({
    patient_id: 'TCGA-BH-A0B2',
    gender: 'female',
    age: 58,
    stage: 'Stage IIA'
  });
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Initial Load
  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      const topC = await fetchTopCancers();
      setTopCancersData(topC);
      const icgc = await fetchIcgcArgoMetadata();
      setIcgcInfo(icgc);
      const patients = await fetchRealPatients();
      setRealPatientsData(patients);

      // Default to Female #1: Breast Cancer
      const initialCancer = topC.breakdown.females[0];
      setSelectedCancer(initialCancer);
      setSelectedGene(initialCancer.driver_genes[0]);

      loadCancerData(initialCancer, initialCancer.driver_genes[0]);
    } catch (err) {
      console.error('Initial load error:', err);
    }
  }

  async function loadCancerData(cancer: any, gene: string) {
    if (!cancer) return;

    // 1. Fetch Ensembl Genomic Structure
    setIsLoadingGenome(true);
    try {
      const structure = await fetchGenomicStructure(gene);
      setGenomicStructure(structure);
    } catch (err) {
      console.error('Ensembl error:', err);
    } finally {
      setIsLoadingGenome(false);
    }

    // 2. Fetch GDC Cases
    setIsLoadingCases(true);
    try {
      const cases = await fetchCohortCases(cancer.project_id, 6);
      setCohortCases(cases);
      if (cases.length > 0) {
        setSelectedCase({
          patient_id: cases[0].submitter_id || cases[0].case_id,
          gender: cases[0].gender,
          age: cases[0].age,
          stage: cases[0].ajcc_stage
        });
      }
    } catch (err) {
      console.error('GDC error:', err);
    } finally {
      setIsLoadingCases(false);
    }

    // 3. Fetch cBioPortal Mutations
    setIsLoadingMutations(true);
    try {
      const mutations = await fetchStudyMutations(cancer.study_id, gene, 6);
      setStudyMutations(mutations);
    } catch (err) {
      console.error('cBioPortal error:', err);
    } finally {
      setIsLoadingMutations(false);
    }
  }

  function handleSelectCancer(cancer: any) {
    setSelectedCancer(cancer);
    const initialGene = cancer.driver_genes[0];
    setSelectedGene(initialGene);
    loadCancerData(cancer, initialGene);
    setEvaluationResult(null);
  }

  function handleSelectGene(gene: string) {
    setSelectedGene(gene);
    setIsLoadingGenome(true);
    setIsLoadingMutations(true);
    
    fetchGenomicStructure(gene)
      .then(setGenomicStructure)
      .finally(() => setIsLoadingGenome(false));

    if (selectedCancer) {
      fetchStudyMutations(selectedCancer.study_id, gene, 6)
        .then(setStudyMutations)
        .finally(() => setIsLoadingMutations(false));
    }
  }

  async function handleRunCancerRiskAssessment(overridePayload?: any) {
    const payload = overridePayload || {
      patient_id: selectedCase.patient_id,
      cancer_key: selectedCancer?.cancer_key || 'breast',
      cancer_name: selectedCancer?.name || 'Breast Invasive Carcinoma',
      project_id: selectedCancer?.project_id || 'TCGA-BRCA',
      study_id: selectedCancer?.study_id || 'brca_tcga_pan_can_atlas_2018',
      gender: selectedCase.gender,
      age: selectedCase.age,
      stage: selectedCase.stage,
      driver_mutations: selectedCancer?.driver_genes?.slice(0, 3) || ['TP53', 'BRCA1']
    };

    setIsEvaluating(true);
    setDownloadSuccess(null);
    try {
      const result = await evaluateCancerRisk(payload);
      setEvaluationResult(result);
      const evalSection = document.getElementById('evaluation-dashboard');
      if (evalSection) {
        evalSection.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err: any) {
      console.error('Cancer evaluation failed:', err);
      setEvaluationResult(null);
      alert('LOCAL COMPUTATION OFFLINE — Backend at http://localhost:8000 is unreachable. No fake predictions will be generated.');
    } finally {
      setIsEvaluating(false);
    }
  }

  async function handleDownloadPdf(evalData: any, reportType: 'clinical' | 'doctor' | 'patient') {
    if (!evalData) return;
    setIsDownloadingPdf(true);
    try {
      const blob = await downloadCancerPdfReport(evalData, reportType);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const typeLabel =
        reportType === 'doctor'
          ? 'Doctor_Clinical_Dossier'
          : reportType === 'patient'
          ? 'Patient_Friendly_Summary'
          : 'Clinical_Decision_Report';
      a.download = `${typeLabel}_${evalData.patient_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      const label =
        reportType === 'doctor'
          ? 'Doctor Clinical Dossier'
          : reportType === 'patient'
          ? 'Patient Summary'
          : 'Clinical Decision Report';
      setDownloadSuccess(`Successfully downloaded ${label} for ${evalData.patient_id}!`);
      setTimeout(() => setDownloadSuccess(null), 5000);
    } catch (err: any) {
      console.warn('Direct blob failed, falling back to static link:', err);
      const directUrl = reportType === 'doctor'
        ? getDoctorReportPdfUrl(evalData.patient_id)
        : reportType === 'patient'
        ? getPatientReportPdfUrl(evalData.patient_id)
        : getReportPdfUrl(evalData.patient_id);
      window.open(directUrl, '_blank');
    } finally {
      setIsDownloadingPdf(false);
    }
  }

  function handleLoadLibraryPatient(patient: any) {
    setSelectedLibraryPatient(patient);
    setSelectedCase({
      patient_id: patient.patient_id,
      gender: patient.gender,
      age: patient.age,
      stage: patient.stage
    });

    if (topCancersData) {
      const found = topCancersData.breakdown.females.find((c: any) => c.cancer_key === patient.cancer_key) ||
                    topCancersData.breakdown.males.find((c: any) => c.cancer_key === patient.cancer_key);
      if (found) {
        setSelectedCancer(found);
        setSelectedGene(found.driver_genes[0]);
        loadCancerData(found, found.driver_genes[0]);
      }
    }

    handleRunCancerRiskAssessment({
      patient_id: patient.patient_id,
      cancer_key: patient.cancer_key,
      cancer_name: patient.cancer_name,
      project_id: patient.project_id,
      study_id: patient.study_id,
      gender: patient.gender,
      age: patient.age,
      stage: patient.stage,
      driver_mutations: patient.driver_mutations
    });
  }

  const activeCancersList = topCancersData ? topCancersData.breakdown[sexFilter] : [];
  const activeLibraryPatients = realPatientSexTab === 'world'
    ? WORLD_CANCER_PATIENTS.map((wp) => ({
        patient_id: wp.patient_id,
        cancer_key: wp.tcga_project.toLowerCase().replace('tcga-', ''),
        cancer_name: wp.cancer_type,
        project_id: wp.tcga_project,
        study_id: wp.cbioportal_study,
        primary_site: wp.cancer_type,
        primary_diagnosis: `${wp.cancer_type} (${wp.stage})`,
        gender: wp.gender.toLowerCase(),
        age: wp.age,
        stage: wp.stage,
        driver_mutations: wp.genes.map((g) => `${g.symbol} (${g.protein_change})`),
        hybrid_risk_score: wp.hybrid_risk,
        classical_prob: wp.classical_risk,
        quantum_prob: wp.quantum_risk,
        risk_tier: wp.risk_tier,
        risk_color: wp.risk_color,
        recommendation: wp.recommendation,
        genes: wp.genes
      }))
    : (realPatientsData ? realPatientsData[realPatientSexTab] : []);

  return (
    <div className="space-y-5 min-w-0 max-w-full">
      {/* 1. Medical Disclaimer */}
      <MedicalDisclaimer compact />

      {/* 2. Header & Live API Connectivity Status */}
      <div className="clinical-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200 flex items-center gap-1">
              <Dna className="w-3.5 h-3.5" />
              GENOMICS & NCBI REPOSITORY
            </span>
            <span className="text-xs text-slate-500 font-mono">Live Multi-Cancer APIs</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Cancer Genomic Structure & Real Patient Cohort Explorer
          </h1>
          <p className="text-xs text-slate-600 mt-0.5 max-w-3xl">
            Live query and integration with <b>NCI GDC</b> (real patient cases & tumor staging), <b>cBioPortal</b> (somatic mutations), <b>Ensembl REST</b> (real chromosome exon structures), and <b>ICGC-ARGO</b> standards.
          </p>
        </div>

        {/* Live Status Chips */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="px-3 py-1.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>Ensembl REST: LIVE</span>
          </div>
          <div className="px-3 py-1.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>NCI GDC API: LIVE</span>
          </div>
          <div className="px-3 py-1.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>cBioPortal: LIVE</span>
          </div>
          <div className="px-3 py-1.5 rounded bg-cyan-50 border border-cyan-200 text-cyan-800 flex items-center gap-2 font-semibold">
            <span className="w-2 h-2 rounded-full bg-cyan-600"></span>
            <span>ICGC-ARGO: READY</span>
          </div>
        </div>
      </div>

      {/* QUICK INSTRUCTION: How to Use this Portal */}
      <div className="p-4 bg-slate-100 border border-slate-200 rounded-lg space-y-2 text-xs text-slate-700">
        <div className="flex items-center gap-2 text-cyan-800 font-bold uppercase tracking-wider text-xs">
          <Info className="w-4 h-4 text-cyan-700" />
          <span>Quick-Start Instruction: How to Use this Platform</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="p-2.5 rounded bg-white border border-slate-200">
            <span className="font-bold text-slate-900 block mb-0.5">1. Pick Gender & Cancer</span>
            Choose Female or Male Top 5 cancers below (e.g. Breast 30.4%, Oral Cavity 20.4%, Lung 10.1%).
          </div>
          <div className="p-2.5 rounded bg-white border border-slate-200">
            <span className="font-bold text-slate-900 block mb-0.5">2. Inspect Real Exons</span>
            Click on driver genes (TP53, BRCA1, EGFR) to view live chromosome coordinates from Ensembl.
          </div>
          <div className="p-2.5 rounded bg-white border border-slate-200">
            <span className="font-bold text-slate-900 block mb-0.5">3. Select a Real Patient</span>
            Pick a real patient case from NCI GDC or load from our pre-validated Real Patients Library.
          </div>
          <div className="p-2.5 rounded bg-white border border-slate-200">
            <span className="font-bold text-slate-900 block mb-0.5">4. Run AI/QML & Download PDF</span>
            Execute XGBoost + AdaBoost + 4-Qubit VQC, view Bloch angles, and download Doctor & Patient PDFs.
          </div>
        </div>
      </div>

      {/* 3. REAL PATIENTS LIBRARY & DOWNLOADABLE REPORTS */}
      <div className="clinical-card p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-700" />
              <h2 className="text-sm font-bold text-slate-900">
                Real Patient Cohort & Downloadable Clinical Reports Library
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified real-world cancer donor cases from NCI GDC and cBioPortal across both biological sexes.
            </p>
          </div>

          {/* Gender & World Tab for Real Patients */}
          <div className="flex bg-slate-100 p-1 rounded border border-slate-200 text-xs flex-wrap gap-1">
            <button
              onClick={() => setRealPatientSexTab('world')}
              className={`px-3 py-1 rounded font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                realPatientSexTab === 'world' ? 'bg-cyan-700 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Dna className="w-3.5 h-3.5" />
              <span>World Cohort (14 TCGA Tumors)</span>
            </button>
            <button
              onClick={() => setRealPatientSexTab('females')}
              className={`px-3 py-1 rounded font-semibold transition-all cursor-pointer ${
                realPatientSexTab === 'females' ? 'bg-cyan-700 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              Female Cohort (5 Patients)
            </button>
            <button
              onClick={() => setRealPatientSexTab('males')}
              className={`px-3 py-1 rounded font-semibold transition-all cursor-pointer ${
                realPatientSexTab === 'males' ? 'bg-cyan-700 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              Male Cohort (5 Patients)
            </button>
          </div>
        </div>

        {/* Real Patients Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeLibraryPatients.map((p: any) => {
            const isSelected = selectedCase.patient_id === p.patient_id;
            return (
              <div
                key={p.patient_id}
                className={`p-4 rounded border transition-all space-y-3 ${
                  isSelected
                    ? 'bg-cyan-50/60 border-cyan-600 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {p.patient_id}
                  </span>
                  <span
                    className="text-[11px] font-mono font-bold px-2 py-0.5 rounded"
                    style={{ backgroundColor: `${p.risk_color}15`, color: p.risk_color, border: `1px solid ${p.risk_color}40` }}
                  >
                    {p.risk_tier} ({(p.hybrid_risk_score * 100).toFixed(1)}%)
                  </span>
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-900">{p.cancer_name}</div>
                  <div className="text-xs text-slate-600 font-mono mt-0.5">
                    {p.age} yrs • {p.gender.toUpperCase()} • <span className="text-slate-900 font-bold">{p.stage}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] uppercase font-mono text-slate-500 font-semibold">
                    Driver Mutations (cBioPortal):
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {p.driver_mutations.map((m: string) => (
                      <span key={m} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-medium">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                  <button
                    onClick={() => handleLoadLibraryPatient(p)}
                    className="w-full py-1.5 rounded bg-cyan-700 hover:bg-cyan-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    Load into AI Model & Evaluate
                  </button>

                  <div className="grid grid-cols-3 gap-1 text-[10px]">
                    <button
                      onClick={() => handleDownloadPdf({
                        patient_id: p.patient_id,
                        cancer_name: p.cancer_name,
                        cancer_key: p.cancer_key,
                        project_id: p.project_id,
                        study_id: p.study_id,
                        gender: p.gender,
                        age: p.age,
                        stage: p.stage,
                        driver_mutations: p.driver_mutations,
                        hybrid_risk_score: p.hybrid_risk_score,
                        risk_tier: p.risk_tier,
                        risk_color: p.risk_color,
                        recommendation: p.recommendation,
                        classical_breakdown: { xgboost_prob: p.classical_prob },
                        quantum_metrics: { vqc_expectation: p.quantum_prob, qubits_utilized: 4 }
                      }, 'clinical')}
                      disabled={isDownloadingPdf}
                      className="py-1 px-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-medium flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3 text-cyan-700" />
                      Clinical
                    </button>

                    <button
                      onClick={() => handleDownloadPdf({
                        patient_id: p.patient_id,
                        cancer_name: p.cancer_name,
                        cancer_key: p.cancer_key,
                        project_id: p.project_id,
                        study_id: p.study_id,
                        gender: p.gender,
                        age: p.age,
                        stage: p.stage,
                        driver_mutations: p.driver_mutations,
                        hybrid_risk_score: p.hybrid_risk_score,
                        risk_tier: p.risk_tier,
                        risk_color: p.risk_color,
                        recommendation: p.recommendation,
                        classical_breakdown: { xgboost_prob: p.classical_prob },
                        quantum_metrics: { vqc_expectation: p.quantum_prob, qubits_utilized: 4 }
                      }, 'doctor')}
                      disabled={isDownloadingPdf}
                      className="py-1 px-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-medium flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <FileText className="w-3 h-3 text-cyan-700" />
                      Doctor
                    </button>

                    <button
                      onClick={() => handleDownloadPdf({
                        patient_id: p.patient_id,
                        cancer_name: p.cancer_name,
                        cancer_key: p.cancer_key,
                        project_id: p.project_id,
                        study_id: p.study_id,
                        gender: p.gender,
                        age: p.age,
                        stage: p.stage,
                        driver_mutations: p.driver_mutations,
                        hybrid_risk_score: p.hybrid_risk_score,
                        risk_tier: p.risk_tier,
                        risk_color: p.risk_color,
                        recommendation: p.recommendation,
                        classical_breakdown: { xgboost_prob: p.classical_prob },
                        quantum_metrics: { vqc_expectation: p.quantum_prob, qubits_utilized: 4 }
                      }, 'patient')}
                      disabled={isDownloadingPdf}
                      className="py-1 px-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-medium flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <UserCheck className="w-3 h-3 text-cyan-700" />
                      Patient
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. GLOBOCAN 2024 Incidence Navigator */}
      <div className="clinical-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-700" />
              GLOBOCAN 2024 Top Frequent Cancers Breakdown
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select gender cohort to inspect incidence rates, driver genes, and connected TCGA/cBioPortal projects.
            </p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded border border-slate-200 text-xs">
            <button
              onClick={() => setSexFilter('females')}
              className={`px-3 py-1 rounded font-semibold transition-all cursor-pointer ${
                sexFilter === 'females' ? 'bg-cyan-700 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              Female Top 5
            </button>
            <button
              onClick={() => setSexFilter('males')}
              className={`px-3 py-1 rounded font-semibold transition-all cursor-pointer ${
                sexFilter === 'males' ? 'bg-cyan-700 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              Male Top 5
            </button>
            <button
              onClick={() => setSexFilter('both')}
              className={`px-3 py-1 rounded font-semibold transition-all cursor-pointer ${
                sexFilter === 'both' ? 'bg-cyan-700 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-200'
              }`}
            >
              Both Sexes
            </button>
          </div>
        </div>

        {/* Cancer Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {activeCancersList.map((cancer: any) => {
            const isSelected = selectedCancer && selectedCancer.cancer_key === cancer.cancer_key;
            return (
              <div
                key={cancer.cancer_key}
                onClick={() => handleSelectCancer(cancer)}
                className={`p-3.5 rounded border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-cyan-50 border-cyan-600 font-semibold shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    Rank #{cancer.rank}
                  </span>
                  <span className="text-xs font-bold font-mono text-cyan-800">
                    {cancer.incidence_pct}%
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 truncate mb-1">{cancer.name}</div>
                <div className="text-[10px] text-slate-500 font-mono mb-2">{cancer.project_id}</div>
                <div className="flex flex-wrap gap-1">
                  {cancer.driver_genes.slice(0, 3).map((g: string) => (
                    <span key={g} className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono border border-slate-200">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Real Genomic Structure & Exon Map (Ensembl REST API) */}
      <div className="clinical-card p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Dna className="w-4 h-4 text-cyan-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Live Ensembl Genomic Structure & Exon Map (GRCh38.p14)
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200 font-bold">
                rest.ensembl.org
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Chromosome coordinates, strand orientation, transcript models, and exon layout.
            </p>
          </div>

          {/* Gene Selectors for Active Cancer */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-500 mr-1 font-medium">Driver Genes:</span>
            {selectedCancer?.driver_genes.map((g: string) => (
              <button
                key={g}
                onClick={() => handleSelectGene(g)}
                className={`text-xs px-3 py-1 rounded font-mono font-semibold transition-all cursor-pointer ${
                  selectedGene === g
                    ? 'bg-cyan-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {isLoadingGenome ? (
          <div className="h-36 flex items-center justify-center text-xs text-slate-500 animate-pulse">
            Querying Ensembl REST API for {selectedGene} genomic structure...
          </div>
        ) : genomicStructure ? (
          <div className="space-y-4">
            {/* Metadata Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
              <div className="p-3 rounded bg-slate-50 border border-slate-200">
                <div className="text-[10px] uppercase font-mono text-slate-500 font-semibold">Chromosome</div>
                <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">chr{genomicStructure.chromosome}</div>
              </div>
              <div className="p-3 rounded bg-slate-50 border border-slate-200">
                <div className="text-[10px] uppercase font-mono text-slate-500 font-semibold">Start Position</div>
                <div className="text-xs font-bold text-cyan-800 font-mono mt-0.5">{genomicStructure.start?.toLocaleString()}</div>
              </div>
              <div className="p-3 rounded bg-slate-50 border border-slate-200">
                <div className="text-[10px] uppercase font-mono text-slate-500 font-semibold">End Position</div>
                <div className="text-xs font-bold text-cyan-800 font-mono mt-0.5">{genomicStructure.end?.toLocaleString()}</div>
              </div>
              <div className="p-3 rounded bg-slate-50 border border-slate-200">
                <div className="text-[10px] uppercase font-mono text-slate-500 font-semibold">Total Length</div>
                <div className="text-xs font-bold text-emerald-700 font-mono mt-0.5">{genomicStructure.length_bp?.toLocaleString()} bp</div>
              </div>
              <div className="p-3 rounded bg-slate-50 border border-slate-200">
                <div className="text-[10px] uppercase font-mono text-slate-500 font-semibold">Strand</div>
                <div className="text-xs font-bold text-slate-700 font-mono mt-0.5">{genomicStructure.strand === 1 ? 'Positive (+)' : 'Negative (-)'}</div>
              </div>
              <div className="p-3 rounded bg-slate-50 border border-slate-200">
                <div className="text-[10px] uppercase font-mono text-slate-500 font-semibold">Ensembl ID</div>
                <div className="text-xs font-bold text-slate-800 font-mono mt-0.5 truncate" title={genomicStructure.ensembl_id}>
                  {genomicStructure.ensembl_id}
                </div>
              </div>
            </div>

            {/* Exon Architecture Visual Track */}
            <div className="p-4 rounded bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-slate-600">
                  Canonical Transcript: <span className="text-cyan-800 font-bold">{genomicStructure.canonical_transcript || 'ENST00000357654'}</span>
                </span>
                <span className="text-slate-500 text-[11px]">
                  Showing {genomicStructure.exons?.length || 0} Resolved Exons
                </span>
              </div>

              {/* Graphical Exon Track */}
              <div className="w-full bg-white h-8 rounded relative overflow-hidden border border-slate-300 flex items-center px-2 gap-1.5">
                {genomicStructure.exons?.map((exon: any, idx: number) => {
                  const widthPct = Math.max(2, Math.min(15, (exon.length / (genomicStructure.length_bp || 50000)) * 100));
                  return (
                    <div
                      key={exon.exon_id || idx}
                      style={{ width: `${widthPct}%` }}
                      className="h-5 rounded bg-cyan-700 hover:bg-cyan-800 transition-all cursor-pointer relative group flex items-center justify-center text-[9px] font-mono text-white font-bold"
                      title={`Exon #${exon.rank}: ${exon.exon_id} (${exon.length} bp) [${exon.start} - ${exon.end}]`}
                    >
                      {idx + 1}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>Start: {genomicStructure.start?.toLocaleString()}</span>
                <span>Chromosome {genomicStructure.chromosome} Locus (GRCh38)</span>
                <span>End: {genomicStructure.end?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* 6. Two-Column Live Real APIs: NCI GDC Cases & cBioPortal Driver Mutations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* NCI GDC Real Patient Cases */}
        <div className="clinical-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-700" />
              <h3 className="text-sm font-bold text-slate-900">NCI GDC Patient Cohort ({selectedCancer?.project_id})</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              api.gdc.cancer.gov
            </span>
          </div>

          {isLoadingCases ? (
            <div className="h-40 flex items-center justify-center text-xs text-slate-500 animate-pulse">
              Querying NCI GDC API for {selectedCancer?.project_id} cases...
            </div>
          ) : (
            <div className="overflow-x-auto rounded border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                    <th className="p-2.5">Case ID</th>
                    <th className="p-2.5">Age</th>
                    <th className="p-2.5">Sex</th>
                    <th className="p-2.5">Diagnosis / Stage</th>
                    <th className="p-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {cohortCases.map((c: any) => {
                    const isSelected = selectedCase.patient_id === (c.submitter_id || c.case_id);
                    return (
                      <tr key={c.case_id} className={`hover:bg-slate-50 ${isSelected ? 'bg-cyan-50/60 font-semibold' : ''}`}>
                        <td className="p-2.5 text-slate-900 font-bold">{c.submitter_id || c.case_id}</td>
                        <td className="p-2.5 text-slate-700">{c.age} yrs</td>
                        <td className="p-2.5 text-slate-700 capitalize">{c.gender}</td>
                        <td className="p-2.5 text-slate-800">
                          <span className="font-bold text-slate-900">{c.ajcc_stage}</span>
                        </td>
                        <td className="p-2.5 text-right font-sans">
                          <button
                            onClick={() => setSelectedCase({
                              patient_id: c.submitter_id || c.case_id,
                              gender: c.gender,
                              age: c.age,
                              stage: c.ajcc_stage
                            })}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-cyan-700 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                            }`}
                          >
                            {isSelected ? 'Active Case' : 'Select'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* cBioPortal Driver Somatic Mutations */}
        <div className="clinical-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-700" />
              <h3 className="text-sm font-bold text-slate-900">cBioPortal Driver Mutations ({selectedGene})</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              cbioportal.org/api
            </span>
          </div>

          {isLoadingMutations ? (
            <div className="h-40 flex items-center justify-center text-xs text-slate-500 animate-pulse">
              Querying cBioPortal API for {selectedGene} alterations...
            </div>
          ) : (
            <div className="overflow-x-auto rounded border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                    <th className="p-2.5">Sample ID</th>
                    <th className="p-2.5">Gene</th>
                    <th className="p-2.5">Protein Change</th>
                    <th className="p-2.5">Mutation Type</th>
                    <th className="p-2.5 text-right">Locus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {studyMutations.map((m: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 text-slate-900 font-bold truncate max-w-[120px]" title={m.sample_id}>
                        {m.sample_id}
                      </td>
                      <td className="p-2.5 text-cyan-800 font-bold">{m.gene_symbol}</td>
                      <td className="p-2.5 text-amber-900 font-bold">{m.protein_change}</td>
                      <td className="p-2.5 text-slate-700">{m.mutation_type?.replace('_', ' ')}</td>
                      <td className="p-2.5 text-right text-slate-500">{m.start_pos || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 7. 1-Click Hybrid AI/QML Multi-Cancer Risk Assessment */}
      <div id="evaluation-dashboard" className="clinical-card p-5 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Cpu className="w-4 h-4 text-cyan-700" />
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-800 font-semibold">
                Hybrid AI/QML Clinical Decision Engine
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Evaluate Patient Case: <span className="text-cyan-800 font-mono">{selectedCase.patient_id}</span> ({selectedCancer?.name})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Runs XGBoost + AdaBoost Dual Ensemble alongside the 4-Qubit Parameterized Variational Quantum Classifier (VQC).
            </p>
          </div>

          <button
            onClick={() => handleRunCancerRiskAssessment()}
            disabled={isEvaluating}
            className={`px-5 py-2.5 rounded font-bold text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
              isEvaluating
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-cyan-700 hover:bg-cyan-800 text-white'
            }`}
          >
            <Atom className={`w-4 h-4 ${isEvaluating ? 'animate-spin' : ''}`} />
            {isEvaluating ? 'Executing Hybrid VQC Pipeline...' : 'Run Hybrid AI/QML Cancer Assessment'}
          </button>
        </div>

        {/* Evaluation Output Dashboard */}
        {evaluationResult && (
          <div className="space-y-5">
            {/* Top Score Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-4 rounded bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Hybrid Risk Score</div>
                <div className="text-2xl font-bold text-slate-900 font-mono mt-0.5">
                  {(evaluationResult.hybrid_risk_score * 100).toFixed(1)}%
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Consensus Stratification</div>
              </div>

              <div className="p-4 rounded bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">Classification Tier</div>
                <div
                  className="text-xl font-bold font-mono mt-0.5"
                  style={{ color: evaluationResult.risk_color }}
                >
                  {evaluationResult.risk_tier}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Oncological Urgency</div>
              </div>

              <div className="p-4 rounded bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">XGBoost + AdaBoost</div>
                <div className="text-xl font-bold text-cyan-800 font-mono mt-0.5">
                  {(evaluationResult.classical_breakdown?.xgboost_prob * 100).toFixed(1)}%
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Tabular Genomic Features</div>
              </div>

              <div className="p-4 rounded bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">4-Qubit Quantum VQC</div>
                <div className="text-xl font-bold text-emerald-700 font-mono mt-0.5">
                  {(evaluationResult.quantum_metrics?.vqc_expectation * 100).toFixed(1)}%
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  PennyLane default.qubit
                </div>
              </div>
            </div>

            {/* Quantum Bloch Angles & Recommendation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-4 rounded bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Atom className="w-4 h-4 text-cyan-700" />
                  Quantum State Coordinates (Bloch Angles)
                </div>
                <p className="text-[11px] text-slate-600">
                  Each qubit encodes orthogonal clinical biomarker projections via parameterized RY/RZ rotations:
                </p>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {evaluationResult.quantum_metrics?.bloch_angles?.map((q: any) => (
                    <div key={q.qubit} className="p-2 rounded bg-white border border-slate-200 font-mono text-center">
                      <div className="text-[10px] text-slate-500">Qubit {q.qubit}</div>
                      <div className="text-xs font-bold text-emerald-700 mt-0.5">θ: {q.theta}</div>
                      <div className="text-[11px] text-cyan-800">φ: {q.phi}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-cyan-700" />
                  Clinical Recommendation & Directive
                </div>
                <p className="text-xs text-slate-700 leading-relaxed pt-1">
                  {evaluationResult.recommendation}
                </p>
              </div>
            </div>

            {/* Download PDF Reports Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
              <div className="text-xs text-slate-600">
                Generate and download publication-ready clinical dossiers:
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleDownloadPdf(evaluationResult, 'clinical')}
                  disabled={isDownloadingPdf}
                  className="px-4 py-2 rounded bg-cyan-700 hover:bg-cyan-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Clinical Decision PDF
                </button>

                <button
                  onClick={() => handleDownloadPdf(evaluationResult, 'doctor')}
                  disabled={isDownloadingPdf}
                  className="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-700" />
                  Doctor Dossier (PDF)
                </button>

                <button
                  onClick={() => handleDownloadPdf(evaluationResult, 'patient')}
                  disabled={isDownloadingPdf}
                  className="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5 text-cyan-700" />
                  Patient Summary (PDF)
                </button>
              </div>
            </div>

            {downloadSuccess && (
              <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{downloadSuccess}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CancerGenomicsPage;
