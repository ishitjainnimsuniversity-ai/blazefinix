"""
Prediction & Clinical Inference API Routes
Executes genuine classical ML (XGBoost) + PennyLane VQC quantum simulation + TreeSHAP explainability.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json
import uuid
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from app.backend.database.connection import get_db
from app.backend.database.models import PatientRecord, PredictionRecord, AlertRecord, AuditLogRecord
from app.backend.services.pipeline_service import pipeline_service
from app.backend.schemas.pydantic_models import PredictionRequest

router = APIRouter(prefix="/predict", tags=["Clinical Prediction"])

DEMO_PATIENT_CASES = [
    {
        "case_id": "DEMO-LOW-01",
        "label": "Low Risk Cohort Profile",
        "description": "36-year-old female with optimal blood pressure, normoglycemia, and favorable lipid ratio.",
        "expected_risk": "Low (<30%)",
        "features": {
            "age": 36.0,
            "sex": 0.0,
            "systolic_bp": 112.0,
            "diastolic_bp": 72.0,
            "fasting_glucose": 84.0,
            "hba1c": 5.1,
            "total_cholesterol": 168.0,
            "hdl_cholesterol": 68.0,
            "ldl_cholesterol": 85.0,
            "triglycerides": 95.0,
            "bmi": 22.4,
            "resting_heart_rate": 62.0,
            "smoking_status": 0.0,
            "physical_activity_hours": 5.5,
            "family_history_cad": 0.0,
            "hs_crp": 0.6,
            "egfr": 110.0
        }
    },
    {
        "case_id": "DEMO-MOD-02",
        "label": "Moderate Risk Profile (Intermediate Window)",
        "description": "54-year-old male with pre-hypertension, mild dyslipidemia, and sedentary lifestyle.",
        "expected_risk": "Moderate (30-60%)",
        "features": {
            "age": 54.0,
            "sex": 1.0,
            "systolic_bp": 134.0,
            "diastolic_bp": 84.0,
            "fasting_glucose": 108.0,
            "hba1c": 5.8,
            "total_cholesterol": 215.0,
            "hdl_cholesterol": 44.0,
            "ldl_cholesterol": 138.0,
            "triglycerides": 175.0,
            "bmi": 28.2,
            "resting_heart_rate": 74.0,
            "smoking_status": 1.0,
            "physical_activity_hours": 1.5,
            "family_history_cad": 0.0,
            "hs_crp": 2.1,
            "egfr": 82.0
        }
    },
    {
        "case_id": "DEMO-HIGH-03",
        "label": "High Risk Profile (Review Recommended)",
        "description": "63-year-old male smoker with stage 2 hypertension, hyperglycemia, and systemic inflammation.",
        "expected_risk": "High (60-80%)",
        "features": {
            "age": 63.0,
            "sex": 1.0,
            "systolic_bp": 158.0,
            "diastolic_bp": 96.0,
            "fasting_glucose": 146.0,
            "hba1c": 7.4,
            "total_cholesterol": 248.0,
            "hdl_cholesterol": 36.0,
            "ldl_cholesterol": 165.0,
            "triglycerides": 240.0,
            "bmi": 32.6,
            "resting_heart_rate": 84.0,
            "smoking_status": 2.0,
            "physical_activity_hours": 0.5,
            "family_history_cad": 1.0,
            "hs_crp": 4.8,
            "egfr": 68.0
        }
    },
    {
        "case_id": "DEMO-CRIT-04",
        "label": "Very High Risk Profile (Urgent Clinician Alert)",
        "description": "71-year-old female with severe systolic hypertension, uncontrolled diabetes, and reduced eGFR.",
        "expected_risk": "Very High (>80%)",
        "features": {
            "age": 71.0,
            "sex": 0.0,
            "systolic_bp": 178.0,
            "diastolic_bp": 104.0,
            "fasting_glucose": 195.0,
            "hba1c": 9.2,
            "total_cholesterol": 285.0,
            "hdl_cholesterol": 30.0,
            "ldl_cholesterol": 198.0,
            "triglycerides": 320.0,
            "bmi": 36.4,
            "resting_heart_rate": 92.0,
            "smoking_status": 2.0,
            "physical_activity_hours": 0.0,
            "family_history_cad": 1.0,
            "hs_crp": 7.6,
            "egfr": 46.0
        }
    }
]

@router.get("/demo-cases")
def get_demo_cases():
    """Returns curated synthetic demonstration profiles across risk spectrum."""
    return DEMO_PATIENT_CASES

@router.post("")
def predict_risk(payload: PredictionRequest, db: Session = Depends(get_db)):
    """
    Executes hybrid classical-quantum prediction, computes TreeSHAP attributions,
    runs real PennyLane shot measurements, evaluates safety thresholds, and creates alerts.
    """
    try:
        rec_id = payload.record_id or f"R-{uuid.uuid4().hex[:6].upper()}"
        qubits = payload.qubits or (payload.quantum_config.qubits if payload.quantum_config else None)
        shots = payload.shots or (payload.quantum_config.shots if payload.quantum_config else 1024)

        result = pipeline_service.predict_patient(
            features_dict=payload.features,
            record_id=rec_id,
            qubits=qubits,
            shots=shots
        )

        # 1. Store or update patient record
        patient = db.query(PatientRecord).filter(PatientRecord.record_id == rec_id).first()
        if not patient:
            patient = PatientRecord(
                record_id=rec_id,
                cohort_name="Active Clinical Evaluation",
                age=payload.features.get("age", 50.0),
                sex="Male" if payload.features.get("sex", 1.0) == 1.0 else "Female",
                features_json=json.dumps(payload.features),
                split_type="INFERENCE"
            )
            db.add(patient)
            db.flush()

        # 2. Store prediction
        pred_id = f"PRED-{uuid.uuid4().hex[:8].upper()}"
        pred_record = PredictionRecord(
            prediction_id=pred_id,
            record_id=rec_id,
            model_version=result["model_version"],
            classical_risk=result["classical_risk"],
            quantum_risk=result["quantum_risk"],
            hybrid_risk=result["hybrid_risk"],
            risk_category=result["risk_category"],
            confidence=result["confidence"],
            uncertainty_score=result["uncertainty_score"],
            contributing_factors=json.dumps(result["contributing_factors"]),
            explanation_summary=result["explanation_summary"]
        )
        db.add(pred_record)

        # 3. Store alert if generated
        alert_info = result.get("alert")
        if alert_info:
            alert_rec = AlertRecord(
                alert_id=alert_info["alert_id"],
                record_id=rec_id,
                prediction_id=pred_id,
                risk_score=alert_info["risk_score"],
                severity=alert_info["severity"],
                reason=alert_info["reason"],
                recommendation=alert_info["recommendation"],
                contributing_factors=json.dumps(alert_info["contributing_factors"]),
                status="PENDING",
                acknowledged=False
            )
            db.add(alert_rec)

        # 4. Record audit log
        db.add(AuditLogRecord(
            log_id=f"AUD-PRED-{uuid.uuid4().hex[:8]}",
            user_role="CLINICIAN",
            action="PATIENT_RISK_PREDICTION",
            record_id=rec_id,
            details_json=json.dumps({
                "hybrid_risk": result["hybrid_risk"],
                "risk_category": result["risk_category"],
                "alert_triggered": bool(alert_info),
                "qubits": result.get("quantum_telemetry", {}).get("qubits", 4)
            })
        ))

        db.commit()

        return {
            "prediction_id": pred_id,
            "record_id": rec_id,
            "model_version": result["model_version"],
            "classical_risk": result["classical_risk"],
            "quantum_risk": result["quantum_risk"],
            "hybrid_risk": result["hybrid_risk"],
            "risk_category": result["risk_category"],
            "confidence": result["confidence"],
            "uncertainty_score": result["uncertainty_score"],
            "contributing_factors": result["contributing_factors"],
            "explanation_summary": result["explanation_summary"],
            "quantum_telemetry": result.get("quantum_telemetry"),
            "provenance": result.get("provenance"),
            "alert": alert_info,
            "recommendation": result["recommendation"],
            "disclaimer": result["disclaimer"],
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Prediction pipeline failure: {str(e)}")

@router.get("/history")
def get_prediction_history(limit: int = 25, db: Session = Depends(get_db)):
    """Fetches recent patient predictions with clinical risk scores and explanations."""
    records = db.query(PredictionRecord).order_by(PredictionRecord.created_at.desc()).limit(limit).all()
    history = []
    for r in records:
        factors = json.loads(r.contributing_factors) if r.contributing_factors else []
        history.append({
            "prediction_id": r.prediction_id,
            "record_id": r.record_id,
            "model_version": r.model_version,
            "classical_risk": r.classical_risk,
            "quantum_risk": r.quantum_risk,
            "hybrid_risk": r.hybrid_risk,
            "risk_category": r.risk_category,
            "confidence": r.confidence,
            "uncertainty_score": r.uncertainty_score,
            "top_factor": factors[0]["feature"] if factors else "N/A",
            "created_at": r.created_at.isoformat() if r.created_at else None
        })
    return history
