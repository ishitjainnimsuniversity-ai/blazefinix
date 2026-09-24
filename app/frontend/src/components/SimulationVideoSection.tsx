import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Atom,
  Cpu,
  Dna,
  Layers,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  FileText,
  BarChart3,
  Activity,
  Info,
  Sliders,
  Maximize2
} from 'lucide-react';

interface Chapter {
  id: number;
  time: number; // seconds
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  description: string;
  classicalRole: string;
  quantumRole: string;
  symbiosisValue: string;
}

const CHAPTERS: Chapter[] = [
  {
    id: 1,
    time: 0,
    title: 'Multi-Modal Genomic & Clinical Ingestion',
    subtitle: 'Ensembl Exons + NCI GDC TCGA Cohorts + cBioPortal Driver Mutations',
    badge: 'STAGE 1 / 5',
    badgeColor: 'from-sky-500 to-blue-600',
    description: 'Ingests patient somatic driver mutations (TP53, BRCA1, BRAF, EGFR), exon splice depths, tumor mutational burden (TMB), dermoscopic optical asymmetry, and vital clinical co-factors.',
    classicalRole: 'Normalizes and validates continuous tabular co-factors (Age, BMI, Smoking, Histology Stage) into standardized feature vectors.',
    quantumRole: 'Compresses high-order genomic variance into 4 principal latent components for quantum phase encoding.',
    symbiosisValue: 'Prevents garbage-in/garbage-out; pairs clinical demographics with high-dimensional genomic signatures.'
  },
  {
    id: 2,
    time: 7,
    title: 'Classical Machine Learning: Dual Boosting',
    subtitle: 'XGBoost + AdaBoost Ensemble & TreeSHAP Driver Attribution',
    badge: 'STAGE 2 / 5',
    badgeColor: 'from-blue-500 to-indigo-600',
    description: 'XGBoost gradient-boosted decision trees and AdaBoost adaptive weighting partition non-linear risk thresholds across clinical covariates with tree-level SHAP explainability.',
    classicalRole: 'Computes calibrated base probability P_classical (e.g. 78.4%) and local feature attribution ranking (e.g. TP53 +0.28, TMB +0.19).',
    quantumRole: 'Identifies feature subspaces where classical decision boundaries encounter high epistemic uncertainty (entropy > 0.45).',
    symbiosisValue: 'Provides fast, deterministic baseline risk and auditable feature importances required by clinical guidelines.'
  },
  {
    id: 3,
    time: 15,
    title: 'Quantum Machine Learning: 4-Qubit VQC',
    subtitle: 'Angle Embedding Ry/Rz + CNOT Entanglement in Hilbert Space',
    badge: 'STAGE 3 / 5',
    badgeColor: 'from-purple-500 to-pink-600',
    description: 'Encodes the 4 principal genomic drivers into quantum states |psi> = U_enc(x)|0000> across 4 qubits, exploring a 16-dimensional complex Hilbert space C^16 via parameterized variational ansatz W(theta).',
    classicalRole: 'Pre-processes and bounds input features into phase angles theta in [-pi, pi] for angle embedding.',
    quantumRole: 'CNOT gates generate multi-qubit entanglement to capture subtle, non-linear multi-gene correlations invisible to orthogonal classical splits.',
    symbiosisValue: 'Resolves ambiguous border-zone patients by evaluating quantum state interference and measurement expectation values <Z_0>.'
  },
  {
    id: 4,
    time: 22,
    title: 'Symbiotic Fusion & Uncertainty Consensus',
    subtitle: 'Weighted Convex Ensemble & Dynamic Disagreement Quantification',
    badge: 'STAGE 4 / 5',
    badgeColor: 'from-amber-500 to-orange-600',
    description: 'Combines classical and quantum inferences into a calibrated hybrid consensus: P_hybrid = 0.65 P_classical + 0.35 P_quantum, while evaluating epistemic uncertainty U = |P_c - P_q|.',
    classicalRole: 'Anchors risk score in population-scale empirical clinical data (weight = 0.65).',
    quantumRole: 'Modulates risk score based on high-dimensional quantum kernel state separation (weight = 0.35).',
    symbiosisValue: 'If models disagree (|P_c - P_q| > 0.15), uncertainty triggers automated clinical escalation and flags the case for oncologist review.'
  },
  {
    id: 5,
    time: 29,
    title: 'Dual Clinical Report & Actionable Triage',
    subtitle: 'Comprehensive Oncologist Dossier + Plain-Language Patient Summary',
    badge: 'STAGE 5 / 5',
    badgeColor: 'from-emerald-500 to-teal-600',
    description: 'Generates dual auditable outputs: an exhaustive Oncologist Technical Dossier with SHAP drivers, quantum Bloch angles, and NCI guidelines; and an empathetic Patient Summary.',
    classicalRole: 'Supplies specific biomarker cutoffs, risk tiers, and survival statistics for clinical documentation.',
    quantumRole: 'Provides quantum confidence intervals and hardware execution metrics (circuit depth, simulated shots).',
    symbiosisValue: 'Delivers actionable, transparent decision support with zero black-box obscurity, fully grounded in live genomic evidence.'
  }
];

export const SimulationVideoSection: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(36);
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [videoError, setVideoError] = useState<boolean>(false);

  // Sync active chapter with video current time
  useEffect(() => {
    let currentIdx = 0;
    for (let i = CHAPTERS.length - 1; i >= 0; i--) {
      if (currentTime >= CHAPTERS[i].time) {
        currentIdx = i;
        break;
      }
    }
    setActiveChapterIndex(currentIdx);
  }, [currentTime]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.duration) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    }
  };

  const handleSeek = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      setCurrentTime(seconds);
      if (!isPlaying) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  };

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const activeChapter = CHAPTERS[activeChapterIndex];

  return (
    <div className="space-y-6">
      {/* Disclaimer Header */}
      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3 text-slate-800 text-xs shadow-xs">
        <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-800" />
        <div>
          <b className="text-amber-950">MANDATORY MEDICAL DISCLAIMER:</b> <span className="text-slate-800 font-medium">AI-generated risk assessment — not a final medical diagnosis. Final clinical decision remains with a qualified healthcare professional. This simulation demonstrates computational pipeline dynamics.</span>
        </div>
      </div>

      {/* Main Video & Interactive Player Card */}
      <div className="glass-panel-elevated rounded-2xl p-6 border border-slate-800 space-y-5 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950">
        
        {/* Header Title */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-gradient-to-r from-purple-500/20 to-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" /> ARCHITECTURAL SYMBIOSIS SIMULATION
              </span>
              <span className="text-xs text-slate-400 font-mono">1280x720 HD / 25 FPS</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white mt-1 tracking-tight">
              Quantum Machine Learning & Classical ML Symbiosis Simulation
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl">
              Watch how our 4-Qubit Variational Quantum Classifier (VQC) and Classical Dual Boosting (XGBoost + AdaBoost) collaborate synergistically to ingest live cancer genomes, extract somatic driver mutations, and generate dual clinical reports.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="/quantum_classical_simulation.mp4"
              download="quantum_classical_simulation.mp4"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Download Full Simulation Video"
            >
              <Download className="w-4 h-4 text-sky-400" />
              Download MP4
            </a>
          </div>
        </div>

        {/* Video Player Display Container */}
        <div className="relative rounded-xl overflow-hidden bg-black border border-slate-800 shadow-2xl aspect-video max-h-[540px] flex items-center justify-center">
          <video
            ref={videoRef}
            src="/quantum_classical_simulation.mp4"
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            onLoadedData={() => setVideoError(false)}
            onCanPlay={() => setVideoError(false)}
            onError={() => setVideoError(true)}
            muted
            playsInline
          />

          {/* Overlay when paused or at start */}
          {!isPlaying && !videoError && (
            <div
              onClick={togglePlay}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-pointer group transition-all"
            >
              <div className="w-16 h-16 rounded-full bg-indigo-600/90 group-hover:bg-indigo-500 text-white flex items-center justify-center shadow-xl shadow-indigo-900/50 group-hover:scale-110 transition-transform">
                <Play className="w-7 h-7 ml-1" />
              </div>
              <span className="text-xs font-bold text-white mt-3 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-700">
                Click to Play Hybrid Simulation Video
              </span>
            </div>
          )}

          {/* Overlay error state fallback */}
          {videoError && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center">
              <Info className="w-10 h-10 text-amber-400 mb-2" />
              <div className="text-sm font-bold text-white">Video Rendering Ready</div>
              <p className="text-xs text-slate-400 max-w-md mt-1">
                The video file is located at <code className="text-sky-300">/quantum_classical_simulation.mp4</code>. You can download it directly using the button above.
              </p>
            </div>
          )}

          {/* Floating Chapter Badge inside Video Player */}
          <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-black text-white bg-gradient-to-r ${activeChapter.badgeColor}`}>
              {activeChapter.badge}
            </span>
            <span className="font-semibold text-slate-200 truncate max-w-[280px]">
              {activeChapter.title}
            </span>
          </div>

          {/* Floating Time indicator */}
          <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
            {Math.floor(currentTime)}s / {Math.floor(duration)}s
          </div>
        </div>

        {/* Video Controls Bar */}
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-2.5">
          {/* Progress Slider */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400 w-10 text-right">
              {Math.floor(currentTime)}s
            </span>
            <input
              type="range"
              min={0}
              max={duration || 36}
              step={0.2}
              value={currentTime}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              className="flex-1 accent-indigo-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-xs font-mono text-slate-400 w-10">
              {Math.floor(duration || 36)}s
            </span>
          </div>

          {/* Control Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-950/40"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isPlaying ? 'Pause' : 'Play'}
              </button>

              <button
                onClick={handleRestart}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all"
                title="Restart from beginning"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Playback speed selector */}
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
                {[0.75, 1, 1.25, 1.5].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
                    className={`px-2 py-1 rounded ${
                      playbackSpeed === speed
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            {/* Current Chapter quick label */}
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Active: <b className="text-slate-200">{activeChapter.title}</b></span>
            </div>
          </div>
        </div>

        {/* 5 Interactive Chapter Navigation Tabs */}
        <div className="space-y-2 pt-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" /> Jump to Simulation Chapters
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
            {CHAPTERS.map((ch, idx) => {
              const isSelected = activeChapterIndex === idx;
              return (
                <button
                  key={ch.id}
                  onClick={() => handleSeek(ch.time)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-950/60 border-indigo-500/80 shadow-lg shadow-indigo-950/40'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className={`px-1.5 py-0.5 rounded font-bold text-white bg-gradient-to-r ${ch.badgeColor}`}>
                        {ch.badge}
                      </span>
                      <span className="text-slate-400 font-mono">00:{ch.time < 10 ? '0' : ''}{ch.time}</span>
                    </div>
                    <div className="text-xs font-bold text-white line-clamp-2 mt-1">
                      {ch.title}
                    </div>
                  </div>
                  <div className="text-[10px] text-indigo-300 font-medium mt-2 flex items-center gap-1">
                    <span>Click to seek</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Chapter Deep-Dive Architecture Breakdown */}
        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="text-[11px] font-mono text-indigo-400 font-bold uppercase tracking-wider">
                Detailed Symbiosis Breakdown &bull; {activeChapter.badge}
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                {activeChapter.title}
              </h3>
              <div className="text-xs text-slate-400">{activeChapter.subtitle}</div>
            </div>
            <div className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono text-indigo-300 self-start md:self-auto">
              Simulated Timestamp: 00:{activeChapter.time < 10 ? '0' : ''}{activeChapter.time}s
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {activeChapter.description}
          </p>

          {/* Three-Column Role Breakdown: Classical vs Quantum vs Symbiotic Synergy */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
            {/* Classical ML Role */}
            <div className="p-3.5 rounded-lg bg-blue-950/20 border border-blue-800/40 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                <Cpu className="w-4 h-4 text-blue-400" />
                Classical Machine Learning Role
              </div>
              <p className="text-xs text-slate-300 leading-normal">
                {activeChapter.classicalRole}
              </p>
            </div>

            {/* Quantum ML Role */}
            <div className="p-3.5 rounded-lg bg-purple-950/20 border border-purple-800/40 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                <Atom className="w-4 h-4 text-purple-400" />
                Quantum Machine Learning Role
              </div>
              <p className="text-xs text-slate-300 leading-normal">
                {activeChapter.quantumRole}
              </p>
            </div>

            {/* Symbiotic Consensus Synergy */}
            <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-800/40 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Symbiosis & Clinical Impact
              </div>
              <p className="text-xs text-slate-300 leading-normal">
                {activeChapter.symbiosisValue}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Technical FAQ: How Classical and Quantum Support Each Other */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Dna className="w-5 h-5 text-indigo-400" />
          Technical FAQ: How Quantum Machine Learning Supports Classical Machine Learning
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Question 1 */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-sky-400">
              Q: Why can't Classical Machine Learning (XGBoost) do this alone?
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Classical gradient-boosted trees partition data using axis-aligned orthogonal splits. When dealing with complex multi-genic somatic driver interactions (e.g. concurrent TP53 mutations + BRAF V600E + high TMB + abnormal exon splice depths), classical trees require exponential depth to represent non-linear cross-correlations, causing overfitting or high uncertainty in borderline patients.
            </p>
          </div>

          {/* Question 2 */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-purple-400">
              Q: What exact advantage does the Parameterized VQC provide?
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              The 4-Qubit Variational Quantum Classifier (VQC) maps 4 normalized latent drivers into a 16-dimensional complex Hilbert state space (<span className="font-mono text-purple-300">C^16</span>). Controlled-NOT (CNOT) entangling gates create quantum superposition and entanglement, naturally computing non-linear kernel transformations that separate ambiguous risk profiles that appear inseparable to Euclidean classical models.
            </p>
          </div>

          {/* Question 3 */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-emerald-400">
              Q: How do both models support each other in consensus?
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              We employ convex probability ensemble fusion: <span className="font-mono text-emerald-300">P_hybrid = 0.65 P_classical + 0.35 P_quantum</span>. Classical ML provides calibrated population baselines and TreeSHAP driver attribution; Quantum ML provides quantum state interference to resolve border cases. The absolute difference <span className="font-mono text-amber-300">|P_c - P_q|</span> quantifies epistemic model uncertainty.
            </p>
          </div>

          {/* Question 4 */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-amber-400">
              Q: How are real live APIs (Ensembl, NCI GDC, cBioPortal) identified?
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <b>Ensembl REST API</b> maps chromosomal coordinates, transcript IDs, and exon structures; <b>NCI GDC API</b> queries real TCGA patient cohorts for somatic mutations and clinical stages; <b>cBioPortal API</b> verifies specific driver alterations (e.g. BRAF V600E, EGFR L858R). These live API streams are injected directly into the feature vector.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
export default SimulationVideoSection;
