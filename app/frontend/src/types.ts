export interface ContributingFactor {
  feature: string;
  importance_value: number;
  contribution: string;
  clinical_note: string;
  patient_value?: any;
}

export interface AlertData {
  alert_id: string;
  record_id: string;
  prediction_id?: string;
  risk_score: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_category?: string;
  reason: string;
  recommendation: string;
  contributing_factors: string[];
  uncertainty_flag?: boolean;
  status: 'PENDING' | 'REVIEWED' | 'ESCALATED' | 'CLOSED';
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  created_at: string;
  disclaimer?: string;
}

export interface QuantumTelemetry {
  simulator: string;
  execution_mode: string;
  qubits: number;
  circuit_depth: number;
  shots_executed: number;
  execution_time_ms: number;
  pauli_z_expectation: number;
  measurement_counts: Record<string, number>;
  total_observed_states: number;
  top_state: string;
  encoded_biomarkers?: string[];
}

export interface ProvenanceData {
  dataset_source: string;
  feature_selection: string;
  classical_engine: string;
  quantum_engine: string;
  execution_locality: string;
  timestamp: string;
}

export interface PredictionResult {
  prediction_id: string;
  record_id: string;
  model_version: string;
  classical_risk: number;
  quantum_risk: number;
  hybrid_risk: number;
  risk_category: string;
  confidence: string;
  uncertainty_score: number;
  contributing_factors: ContributingFactor[];
  explanation_summary: string;
  quantum_telemetry?: QuantumTelemetry;
  provenance?: ProvenanceData;
  alert?: AlertData | null;
  recommendation: string;
  disclaimer: string;
  timestamp: string;
  features?: Record<string, number>;
  is_demo?: boolean;
  execution_mode?: 'real' | 'demo';
  execution_details?: {
    planned_pipeline: string;
    actual_execution: string;
    mode_label: string;
  };
}

export interface SimulationExperimentResult {
  record_id: string;
  model_version: string;
  classical_risk: number;
  quantum_risk: number;
  hybrid_risk: number;
  uncertainty_score: number;
  shots_executed: number;
  circuit_depth: number;
  qubit_count: number;
  execution_time_ms: number;
  pauli_z_expectation: number;
  measurement_counts: Record<string, number>;
  total_observed_states: number;
  top_state: string;
  encoded_biomarkers: string[];
  simulator: string;
}

export interface DemoCase {
  case_id: string;
  label: string;
  description: string;
  expected_risk: string;
  features: Record<string, number>;
}

export interface ModelComparison {
  model_name: string;
  architecture: string;
  accuracy: number;
  sensitivity: number;
  specificity: number;
  f1_score: number;
  roc_auc: number;
  pr_auc: number;
  training_time: number;
  inference_time_ms: number;
  generalization_gap: number;
  overfitting_status: string;
  is_winner: boolean;
}

export interface BenchmarkResult {
  dataset_name: string;
  total_samples: number;
  train_samples: number;
  test_samples: number;
  model_version: string;
  qubits?: number;
  selected_features: string[];
  feature_importances: { feature: string; importance: number; original_index: number }[];
  models_comparison: ModelComparison[];
  cross_validation: {
    folds: number;
    roc_auc_mean: number;
    roc_auc_std: number;
    sensitivity_mean: number;
    sensitivity_std: number;
    precision_mean?: number;
    precision_std?: number;
    f1_mean: number;
    f1_std: number;
    fold_aucs: number[];
  };
  scientific_summary: string;
  classical_baseline: any;
  quantum_vqc: any;
  hybrid: any;
  is_demo?: boolean;
  execution_mode?: 'real' | 'demo';
}

export interface DataQualityAudit {
  total_records: number;
  total_features: number;
  missing_values_count: number;
  missing_values_pct: number;
  duplicate_records_count: number;
  duplicate_records_pct: number;
  class_distribution: Record<string, number>;
  class_balance_status: string;
  outliers_detected: number;
  quality_score: number;
  quality_grade: string;
  recommendation: string;
}

export interface AnalyticsOverview {
  records_analyzed: number;
  total_predictions: number;
  total_alerts: number;
  critical_alerts: number;
  high_risk_cases: number;
  pending_doctor_reviews: number;
  doctor_agreement_rate: number;
  quantum_runs_executed: number;
  active_models: number;
}

export interface DoctorFeedbackItem {
  feedback_id: string;
  alert_id?: string;
  record_id: string;
  agreement: 'AGREE' | 'PARTIAL' | 'DISAGREE' | 'NEEDS_REVIEW';
  clinical_notes: string;
  recommended_action?: string;
  reviewer_name: string;
  reviewer_role: string;
  reviewed_at: string;
}

export interface AuditLog {
  log_id: string;
  timestamp: string;
  user_role: string;
  action: string;
  record_id?: string;
  details: Record<string, any>;
}

export interface TestedPatientItem {
  record_id: string;
  cohort_name: string;
  age: number;
  sex: string;
  hybrid_risk: number;
  classical_risk: number;
  quantum_risk: number;
  risk_category: string;
  confidence: string;
  uncertainty_score: number;
  top_factor: string;
  top_factor_value: string | number;
  alert_severity: string;
  has_alert: boolean;
  created_at?: string;
  pdf_url: string;
  html_url: string;
}

export interface PhototypeRiskPoint {
  phototype: string;
  category: string;
  ita_degrees: number;
  melanin_index: number;
  xgboost_risk: number;
  adaboost_risk: number;
  quantum_risk: number;
  hybrid_risk: number;
  risk_tier: string;
  is_patient_phototype: boolean;
}

export interface MultiModalPredictResponse {
  record_id: string;
  patient_name: string;
  patient_age: number;
  patient_sex: string;
  model_version: string;
  classical_xgboost_risk: number;
  classical_adaboost_risk: number;
  quantum_vqc_risk: number;
  hybrid_decision_score: number;
  risk_category: string;
  epistemic_uncertainty: number;
  fitzpatrick_phototype: string;
  ita_degrees: number;
  melanin_index: number;
  tp53_mutation_score: number;
  tumor_mutational_burden: number;
  contributing_factors: any[];
  phototype_risk_graph: PhototypeRiskPoint[];
  quantum_bloch_coordinates?: any;
  alert?: any;
  recommendation: string;
  disclaimer: string;
  pdf_url: string;
  html_url: string;
}

export interface VisionAnalysisResult {
  l_star: number;
  a_star: number;
  b_star: number;
  ita_degrees: number;
  fitzpatrick_phototype: string;
  skin_category: string;
  clinical_description: string;
  melanin_index: number;
  erythema_index: number;
  lesion_detected: boolean;
  border_irregularity_score: number;
  asymmetry_score: number;
  color_variegation_score: number;
  image_annotated_b64: string;
}

export interface SkinReferenceSample {
  index: number;
  name: string;
  phototype: string;
  category: string;
  ita_degrees: number;
  melanin_index: number;
  description: string;
  thumbnail_b64: string;
}

export interface PipelineStage {
  step: number;
  title: string;
  subtitle: string;
  points: string[];
  icon: string;
}

export interface MetricComparisonPoint {
  metric: string;
  xgboost: number;
  vqc: number;
  hybrid: number;
  description: string;
}

export interface PillarItem {
  id: string;
  title: string;
  icon: string;
  bullets: string[];
}

export interface OtherMetricItem {
  name: string;
  description: string;
  xgboost_val: string;
  vqc_val: string;
  hybrid_val: string;
}

export interface ArchitectureUspData {
  title_slide4: string;
  subtitle_slide4: string;
  pipeline_stages: PipelineStage[];
  usp_quote: string;
  usp_bullets: string[];
  title_slide5: string;
  subtitle_slide5: string;
  metrics_comparison: MetricComparisonPoint[];
  other_metrics: OtherMetricItem[];
  pillars: PillarItem[];
  national_scalability_roadmap: string;
  tagline: string;
}
