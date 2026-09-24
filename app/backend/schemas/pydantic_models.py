"""
Pydantic Schemas for Request and Response Validation
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class DataQualityMetric(BaseModel):
    total_records: int
    total_features: int
    missing_values_count: int
    missing_values_pct: float
    duplicate_records_count: int
    duplicate_records_pct: float
    class_distribution: Dict[str, int]
    quality_score: int
    quality_grade: str
    outliers_detected: int
    recommendation: str

class ContributingFactor(BaseModel):
    feature: str
    importance_value: float
    contribution: str
    clinical_note: str
    patient_value: Optional[Any] = None

class QuantumConfig(BaseModel):
    qubits: int = Field(default=4, ge=2, le=10)
    circuit_depth: int = Field(default=2, ge=1, le=6)
    shots: int = Field(default=1024, ge=100, le=4096)
    backend_name: str = "PennyLane.default.qubit"

class ModelTrainRequest(BaseModel):
    dataset_name: str = "cardiometabolic_cohort.csv"
    target_column: str = "disease_risk_label"
    selected_features_count: int = Field(default=4, ge=2, le=10)
    test_size: float = Field(default=0.2, ge=0.1, le=0.4)
    run_cross_validation: bool = True
    cv_folds: int = Field(default=5, ge=3, le=10)
    quantum_config: Optional[QuantumConfig] = None

class QuantumSimulationRequest(BaseModel):
    features: Dict[str, float]
    qubits: int = Field(default=4, ge=2, le=10)
    depth: int = Field(default=2, ge=1, le=6)
    shots: int = Field(default=1024, ge=64, le=4096)

class PredictionRequest(BaseModel):
    record_id: Optional[str] = None
    features: Dict[str, float]
    qubits: Optional[int] = Field(default=None, ge=2, le=10)
    shots: Optional[int] = Field(default=1024, ge=64, le=4096)
    model_version: Optional[str] = None
    quantum_config: Optional[QuantumConfig] = None

class AlertAcknowledgeRequest(BaseModel):
    clinician_name: str
    notes: Optional[str] = None

class DoctorFeedbackCreate(BaseModel):
    alert_id: Optional[str] = None
    record_id: str
    agreement: str
    clinical_notes: str
    recommended_action: Optional[str] = "Scheduled for follow-up testing"
    reviewer_name: str
    reviewer_role: str = "ATTENDING_PHYSICIAN"

class DoctorFeedbackResponse(BaseModel):
    feedback_id: str
    alert_id: Optional[str] = None
    record_id: str
    agreement: str
    clinical_notes: str
    recommended_action: Optional[str] = None
    reviewer_name: str
    reviewed_at: Optional[datetime] = None
    status_message: str

class NCBIGenomeRequest(BaseModel):
    accession: str = "GCF_000001405.40"
    enrich_risk_features: bool = True

