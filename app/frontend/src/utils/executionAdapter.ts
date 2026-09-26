import {
  PredictionResult,
  BenchmarkResult,
  SimulationExperimentResult,
  ContributingFactor
} from '../types';

export type ExecutionMode = 'real' | 'demo';

export interface SystemCapabilities {
  mode: ExecutionMode;
  inference: boolean;
  training: boolean;
  quantum: boolean;
  reports: boolean;
  vision: boolean;
  genomics: boolean;
  message: string;
}

let cachedCapabilities: SystemCapabilities | null = null;

const OVERRIDE_KEY = 'blazefinix_execution_mode_override';

export function getModeOverride(): ExecutionMode | null {
  try {
    const val = localStorage.getItem(OVERRIDE_KEY);
    if (val === 'real' || val === 'demo') return val;
  } catch {
    // Ignore localStorage errors
  }
  return null;
}

export function setModeOverride(mode: ExecutionMode | null): void {
  try {
    if (mode === null) {
      localStorage.removeItem(OVERRIDE_KEY);
    } else {
      localStorage.setItem(OVERRIDE_KEY, mode);
    }
    cachedCapabilities = null;
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Checks system capabilities from backend /api/capabilities or health check.
 * Automatically defaults to 'demo' if backend is unreachable or on Vercel deployment.
 */
export async function checkCapabilities(): Promise<SystemCapabilities> {
  const override = getModeOverride();
  if (override) {
    return {
      mode: override,
      inference: override === 'real',
      training: override === 'real',
      quantum: override === 'real',
      reports: true,
      vision: true,
      genomics: true,
      message: `Execution mode manually overridden to: ${override.toUpperCase()}`
    };
  }

  if (cachedCapabilities) {
    return cachedCapabilities;
  }

  const API_BASE = '/api';

  // Try /api/capabilities
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${API_BASE}/capabilities`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data && (data.mode === 'real' || data.mode === 'demo')) {
          cachedCapabilities = {
            mode: data.mode,
            inference: Boolean(data.inference),
            training: Boolean(data.training),
            quantum: Boolean(data.quantum),
            reports: true,
            vision: true,
            genomics: true,
            message: data.message || 'Backend capability verified.'
          };
          return cachedCapabilities;
        }
      }
    }
  } catch {
    // Network or server error
  }

  // Secondary check: /api/health
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${API_BASE}/health`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (data && (data.status === 'healthy' || data.status === 'HEALTHY')) {
          cachedCapabilities = {
            mode: 'real',
            inference: true,
            training: true,
            quantum: true,
            reports: true,
            vision: true,
            genomics: true,
            message: 'Real backend online and responsive.'
          };
          return cachedCapabilities;
        }
      }
    }
  } catch {
    // Network or server error
  }

  // Fallback to Hosted Demonstration Mode
  cachedCapabilities = {
    mode: 'demo',
    inference: false,
    training: false,
    quantum: false,
    reports: true,
    vision: true,
    genomics: true,
    message: 'Public demonstration deployment mode active (Simulated execution adapter).'
  };
  return cachedCapabilities;
}

/**
 * Deterministic calculation of patient risk score for Demo Mode.
 * Guarantees that identical feature inputs produce identical outputs every single time (No Math.random).
 */
export function generateDeterministicPrediction(
  features: Record<string, number>,
  recordId?: string,
  qubits = 4,
  shots = 1024
): PredictionResult {
  const age = features.age ?? 55;
  const sysBp = features.systolic_bp ?? 135;
  const glucose = features.fasting_glucose ?? 115;
  const hba1c = features.hba1c ?? 6.2;
  const crp = features.hs_crp ?? 2.5;
  const smoker = features.smoking_status ?? 0;
  const egfr = features.egfr ?? 85;
  const ldl = features.ldl_cholesterol ?? 130;

  // Deterministic risk formula
  let baseScore = 0.15;
  baseScore += Math.max(0, (age - 40) * 0.006);
  baseScore += Math.max(0, (sysBp - 120) * 0.005);
  baseScore += Math.max(0, (glucose - 100) * 0.004);
  baseScore += Math.max(0, (hba1c - 5.7) * 0.06);
  baseScore += Math.max(0, (crp - 1.0) * 0.04);
  baseScore += smoker > 0 ? 0.10 : 0.0;
  baseScore += Math.max(0, (90 - egfr) * 0.003);
  baseScore += Math.max(0, (ldl - 100) * 0.002);

  const hybridRisk = Math.min(0.96, Math.max(0.06, Number(baseScore.toFixed(3))));
  const classicalRisk = Math.min(0.98, Math.max(0.04, Number((hybridRisk * 0.95 + 0.01).toFixed(3))));
  const quantumRisk = Math.min(0.98, Math.max(0.04, Number((hybridRisk * 1.03 - 0.01).toFixed(3))));

  let riskCategory: string;
  let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  if (hybridRisk < 0.30) {
    riskCategory = 'Low';
    severity = 'LOW';
  } else if (hybridRisk < 0.60) {
    riskCategory = 'Moderate';
    severity = 'MEDIUM';
  } else if (hybridRisk < 0.80) {
    riskCategory = 'High';
    severity = 'HIGH';
  } else {
    riskCategory = 'Critical';
    severity = 'CRITICAL';
  }

  const factors: ContributingFactor[] = [
    {
      feature: 'systolic_bp',
      importance_value: 0.28,
      contribution: sysBp > 135 ? 'Elevated (+0.28)' : 'Normal (-0.12)',
      clinical_note: `Systolic Blood Pressure recorded at ${sysBp} mmHg.`,
      patient_value: sysBp
    },
    {
      feature: 'fasting_glucose',
      importance_value: 0.24,
      contribution: glucose > 110 ? 'Elevated (+0.24)' : 'Optimal (-0.08)',
      clinical_note: `Fasting Blood Glucose measured at ${glucose} mg/dL.`,
      patient_value: glucose
    },
    {
      feature: 'hs_crp',
      importance_value: 0.19,
      contribution: crp > 2.0 ? 'Pro-inflammatory (+0.19)' : 'Low (-0.05)',
      clinical_note: `High-sensitivity C-Reactive Protein at ${crp} mg/L.`,
      patient_value: crp
    },
    {
      feature: 'hba1c',
      importance_value: 0.16,
      contribution: hba1c > 6.0 ? 'Glycated (+0.16)' : 'Normoglycemic (-0.06)',
      clinical_note: `Glycated Hemoglobin level at ${hba1c}%.`,
      patient_value: hba1c
    }
  ];

  const rec = hybridRisk > 0.60
    ? 'Urgent cardiometabolic consultation recommended. Initiate intensive lipid management, blood pressure control, and follow-up biomarker tracking in 14 days.'
    : 'Maintain active lifestyle intervention, annual lipid panel, and quarterly BP monitoring.';

  const id = recordId || `DEMO-CASE-${Math.floor(hybridRisk * 1000)}`;

  return {
    prediction_id: `PRED-DEMO-${id}`,
    record_id: id,
    model_version: 'v1.4.0-hybrid-qml (Demonstration Adapter)',
    classical_risk: classicalRisk,
    quantum_risk: quantumRisk,
    hybrid_risk: hybridRisk,
    risk_category: riskCategory,
    confidence: '92.4% (Deterministic Demo Confidence)',
    uncertainty_score: 0.042,
    contributing_factors: factors,
    explanation_summary: `Demonstration Assessment: Hybrid decision boundary calculated 10-year cardiometabolic risk at ${(hybridRisk * 100).toFixed(1)}% based on provided blood pressure, glucose, and inflammatory biomarkers.`,
    quantum_telemetry: {
      simulator: 'PennyLane Statevector Simulator (Demonstration Execution Mode)',
      execution_mode: 'Simulated / Demonstration Mode',
      qubits,
      circuit_depth: 2,
      shots_executed: shots,
      execution_time_ms: 18.5,
      pauli_z_expectation: Number((hybridRisk * 2 - 1).toFixed(3)),
      measurement_counts: { '|0000>': 320, '|0001>': 140, '|0010>': 90, '|0011>': 210, '|1111>': 264 },
      total_observed_states: 5,
      top_state: '|0000>',
      encoded_biomarkers: ['systolic_bp', 'fasting_glucose', 'hs_crp', 'hba1c']
    },
    provenance: {
      dataset_source: 'Demonstration Synthetic Cohort (n=600)',
      feature_selection: `Top ${qubits} Cardiometabolic Features`,
      classical_engine: 'XGBoost 2.0 (Pre-trained Baseline)',
      quantum_engine: 'PennyLane 0.35 VQC Simulator (Demo Adapter)',
      execution_locality: 'Client-Side Execution Adapter (Hosted Vercel Demo)',
      timestamp: new Date().toISOString()
    },
    alert: severity === 'HIGH' || severity === 'CRITICAL' ? {
      alert_id: `ALT-DEMO-${id}`,
      record_id: id,
      risk_score: hybridRisk,
      severity,
      reason: `Elevated cardiometabolic risk score (${(hybridRisk * 100).toFixed(1)}%) detected in demonstration profile.`,
      recommendation: rec,
      contributing_factors: ['systolic_bp', 'fasting_glucose', 'hs_crp'],
      status: 'PENDING',
      acknowledged: false,
      created_at: new Date().toISOString()
    } : null,
    recommendation: rec,
    disclaimer: 'DEMONSTRATION RESULT — Hosted public demo uses simulated execution. Complete hybrid ML/QML pipeline is implemented and executable in the local deployment environment.',
    timestamp: new Date().toISOString(),
    features,
    is_demo: true,
    execution_mode: 'demo',
    execution_details: {
      planned_pipeline: 'Classical XGBoost Ensembling -> 4-Qubit Variational Quantum Circuit (Angle Embedding + Entanglement) -> Hybrid Soft-Voting Fusion',
      actual_execution: 'Deterministic demonstration execution adapter. Full classical ML / PennyLane QML backend is executable locally.',
      mode_label: 'DEMONSTRATION RESULT'
    }
  };
}

export function generateDeterministicBenchmark(qubits = 4): BenchmarkResult {
  return {
    dataset_name: 'cardiometabolic_cohort.csv',
    total_samples: 600,
    train_samples: 480,
    test_samples: 120,
    model_version: 'v1.4.0-hybrid-qml (Demonstration Benchmark)',
    qubits,
    selected_features: ['systolic_bp', 'fasting_glucose', 'hs_crp', 'hba1c'],
    feature_importances: [
      { feature: 'systolic_bp', importance: 0.32, original_index: 2 },
      { feature: 'fasting_glucose', importance: 0.28, original_index: 4 },
      { feature: 'hs_crp', importance: 0.22, original_index: 15 },
      { feature: 'hba1c', importance: 0.18, original_index: 5 }
    ],
    models_comparison: [
      {
        model_name: 'Hybrid Classical-Quantum (VQC + XGBoost)',
        architecture: 'Hybrid Soft-Voting Ensemble',
        accuracy: 0.917,
        sensitivity: 0.938,
        specificity: 0.896,
        f1_score: 0.913,
        roc_auc: 0.952,
        pr_auc: 0.941,
        training_time: 14.2,
        inference_time_ms: 18.4,
        generalization_gap: 0.018,
        overfitting_status: 'Optimal (Clean Partition)',
        is_winner: true
      },
      {
        model_name: 'Standalone XGBoost Classifier',
        architecture: 'Gradient Boosted Trees (100 Trees)',
        accuracy: 0.883,
        sensitivity: 0.875,
        specificity: 0.891,
        f1_score: 0.878,
        roc_auc: 0.924,
        pr_auc: 0.912,
        training_time: 1.8,
        inference_time_ms: 4.2,
        generalization_gap: 0.042,
        overfitting_status: 'Slight Variance',
        is_winner: false
      },
      {
        model_name: `Standalone PennyLane VQC (${qubits} Qubits)`,
        architecture: `Variational Quantum Circuit (${qubits} Qubits, 2 Layers)`,
        accuracy: 0.858,
        sensitivity: 0.864,
        specificity: 0.852,
        f1_score: 0.851,
        roc_auc: 0.898,
        pr_auc: 0.885,
        training_time: 32.5,
        inference_time_ms: 42.1,
        generalization_gap: 0.024,
        overfitting_status: 'Regularized',
        is_winner: false
      },
      {
        model_name: 'Logistic Regression Baseline',
        architecture: 'L2 Regularized Linear Model',
        accuracy: 0.808,
        sensitivity: 0.792,
        specificity: 0.824,
        f1_score: 0.798,
        roc_auc: 0.856,
        pr_auc: 0.840,
        training_time: 0.2,
        inference_time_ms: 0.8,
        generalization_gap: 0.012,
        overfitting_status: 'Underfitting Bias',
        is_winner: false
      }
    ],
    cross_validation: {
      folds: 5,
      roc_auc_mean: 0.948,
      roc_auc_std: 0.012,
      sensitivity_mean: 0.932,
      sensitivity_std: 0.015,
      precision_mean: 0.908,
      precision_std: 0.018,
      f1_mean: 0.919,
      f1_std: 0.014,
      fold_aucs: [0.952, 0.941, 0.960, 0.938, 0.949]
    },
    scientific_summary: 'Demonstration Benchmark Baseline: Hybrid QML classifier achieves 95.2% ROC-AUC with superior sensitivity (93.8%) on cardiometabolic test partitions. (Pre-computed / Demonstration Baseline Metrics)',
    classical_baseline: { model: 'XGBoost', roc_auc: 0.924 },
    quantum_vqc: { model: 'PennyLane VQC', roc_auc: 0.898 },
    hybrid: { model: 'Hybrid Ensembling', roc_auc: 0.952 },
    is_demo: true,
    execution_mode: 'demo'
  };
}

export function generateDeterministicQuantumExperiment(
  features?: Record<string, number>,
  qubits = 4,
  depth = 2,
  shots = 1024
): SimulationExperimentResult {
  const feat = features || {
    age: 62.0,
    sex: 1.0,
    systolic_bp: 154.0,
    fasting_glucose: 140.0,
    hba1c: 7.1,
    hs_crp: 4.2
  };

  const sysBp = feat.systolic_bp ?? 135;
  const glucose = feat.fasting_glucose ?? 115;
  const hybridRisk = Math.min(0.95, Math.max(0.10, Number((0.20 + (sysBp - 120) * 0.008 + (glucose - 100) * 0.005).toFixed(3))));

  return {
    record_id: `EXP-DEMO-${qubits}Q-${depth}D`,
    model_version: 'v1.4.0-pennylane-sim (Demonstration Adapter)',
    classical_risk: Number((hybridRisk * 0.96).toFixed(3)),
    quantum_risk: Number((hybridRisk * 1.02).toFixed(3)),
    hybrid_risk: hybridRisk,
    uncertainty_score: 0.038,
    shots_executed: shots,
    circuit_depth: depth,
    qubit_count: qubits,
    execution_time_ms: 22.4,
    pauli_z_expectation: Number((hybridRisk * 2 - 1).toFixed(3)),
    measurement_counts: {
      '|0000>': Math.floor(shots * 0.35),
      '|0001>': Math.floor(shots * 0.15),
      '|0010>': Math.floor(shots * 0.10),
      '|0011>': Math.floor(shots * 0.20),
      '|1111>': Math.floor(shots * 0.20)
    },
    total_observed_states: 5,
    top_state: '|0000>',
    encoded_biomarkers: ['systolic_bp', 'fasting_glucose', 'hs_crp', 'hba1c'].slice(0, qubits),
    simulator: 'PennyLane Statevector Simulator (Demonstration Mode)'
  };
}
