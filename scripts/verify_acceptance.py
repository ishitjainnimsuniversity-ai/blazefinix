"""
End-to-End Acceptance Verification Script for BlazeFinix
Validates 4Q, 6Q, 8Q, and 20Q execution, bitstring outputs, PDF ingestion, and ReportLab PDF compilation.
"""

import sys
import os
import json
import time
import numpy as np

# Ensure root in path
sys.path.insert(0, os.path.abspath("."))

from app.backend.database.connection import init_db
from app.backend.services.pipeline_service import pipeline_service
from app.backend.services.pdf_parser_service import parse_patient_report_text
from app.backend.qml.quantum_simulator_20q import run_quantum_20q_simulation
from app.backend.api.routes_reports import _evaluate_qml_cml_internal, SAMPLE_PATIENT_DOSSIERS
from app.backend.utils.pdf_generator import generate_qml_cml_patient_report_pdf
from app.backend.qml.vqc_classifier import VariationalQuantumClassifier

def run_acceptance():
    print("================================================================================")
    print("BLAZEFINIX FULL UNIFIED END-TO-END ACCEPTANCE AUDIT")
    print("================================================================================")
    init_db()

    # 1. 4Q Verification
    print("\n[1/5] Verifying 4Q Baseline Pipeline...")
    res_4q = pipeline_service.train_full_pipeline(top_k=4, run_cv=True)
    pred_4q = pipeline_service.predict_patient(
        {"age": 62, "systolic_bp": 154, "fasting_glucose": 140, "hs_crp": 4.2},
        qubits=4,
        shots=1024
    )
    counts_4q = pred_4q["quantum_telemetry"]["measurement_counts"]
    sample_key_4q = next(iter(counts_4q.keys()))
    print(f"   -> 4Q Trained VQC ROC-AUC: {res_4q['quantum_vqc']['roc_auc']:.4f}")
    print(f"   -> 4Q Hybrid ROC-AUC: {res_4q['hybrid']['roc_auc']:.4f}")
    print(f"   -> 4Q Bitstring Length: {len(sample_key_4q)} bits (sample: '{sample_key_4q}')")
    assert len(sample_key_4q) == 4, "4Q bitstring must be 4 bits"

    # 2. 6Q Verification
    print("\n[2/5] Verifying 6Q Extended Pipeline...")
    res_6q = pipeline_service.train_full_pipeline(top_k=6, run_cv=False)
    pred_6q = pipeline_service.predict_patient(
        {"age": 62, "systolic_bp": 154, "fasting_glucose": 140, "hs_crp": 4.2, "bmi": 31.0, "total_cholesterol": 240},
        qubits=6,
        shots=1024
    )
    counts_6q = pred_6q["quantum_telemetry"]["measurement_counts"]
    sample_key_6q = next(iter(counts_6q.keys()))
    print(f"   -> 6Q Trained VQC ROC-AUC: {res_6q['quantum_vqc']['roc_auc']:.4f}")
    print(f"   -> 6Q Bitstring Length: {len(sample_key_6q)} bits (sample: '{sample_key_6q}')")
    assert len(sample_key_6q) == 6, "6Q bitstring must be 6 bits"

    # 3. 8Q Verification
    print("\n[3/5] Verifying 8Q High Capacity Pipeline...")
    res_8q = pipeline_service.train_full_pipeline(top_k=8, run_cv=False)
    pred_8q = pipeline_service.predict_patient(
        {"age": 62, "systolic_bp": 154, "fasting_glucose": 140, "hs_crp": 4.2, "bmi": 31.0, "total_cholesterol": 240, "ldl_cholesterol": 160, "triglycerides": 210},
        qubits=8,
        shots=1024
    )
    counts_8q = pred_8q["quantum_telemetry"]["measurement_counts"]
    sample_key_8q = next(iter(counts_8q.keys()))
    print(f"   -> 8Q Trained VQC ROC-AUC: {res_8q['quantum_vqc']['roc_auc']:.4f}")
    print(f"   -> 8Q Bitstring Length: {len(sample_key_8q)} bits (sample: '{sample_key_8q}')")
    assert len(sample_key_8q) == 8, "8Q bitstring must be 8 bits"

    # 4. 20Q Multi-Omics Pipeline Verification
    print("\n[4/5] Verifying 20Q Multi-Omics PDF -> QML Pipeline...")
    sample = SAMPLE_PATIENT_DOSSIERS[0]
    parsed = parse_patient_report_text(sample["raw_text"], filename="TCGA_Dossier.pdf")
    print(f"   -> Parsed Patient ID: {parsed['patient_id']} ({parsed['age']} y/o {parsed['sex']})")
    print(f"   -> Extracted Somatic Mutations: {[m['gene'] for m in parsed['detected_mutations']]}")
    print(f"   -> Normalized 20-Feature Schema: {len(parsed['features_20q'])} biomarkers")
    
    eval_20q = _evaluate_qml_cml_internal(parsed["features_20q"], num_qubits=20)
    counts_20q = eval_20q["qml_metrics"]["measurement_counts"]
    sample_key_20q = next(iter(counts_20q.keys()))
    print(f"   -> 20Q PennyLane Execution Mode: {eval_20q['qml_metrics']['execution_mode']}")
    print(f"   -> 20Q Classical ML Risk: {eval_20q['cml_metrics']['classical_risk_score']:.4f}")
    print(f"   -> 20Q Quantum VQC Risk: {eval_20q['qml_metrics']['quantum_risk_score']:.4f}")
    print(f"   -> 20Q Hybrid Consensus: {eval_20q['hybrid_metrics']['hybrid_risk_score']:.4f} ({eval_20q['hybrid_metrics']['risk_tier']})")
    print(f"   -> 20Q Epistemic Uncertainty: {eval_20q['hybrid_metrics']['epistemic_uncertainty']:.4f}")
    print(f"   -> 20Q Bitstring Length: {len(sample_key_20q)} bits (sample: '{sample_key_20q}')")
    print(f"   -> 20Q Unique Sampled States: {eval_20q['qml_metrics']['total_observed_states']} out of 1,048,576 theoretical states")
    assert len(sample_key_20q) == 20, "20Q bitstring must be 20 bits"

    # PDF Compilation Check
    report_payload = {
        **parsed,
        **eval_20q,
        "patient_demographics": {
            "patient_id": parsed["patient_id"],
            "age": parsed["age"],
            "sex": parsed["sex"],
            "diagnosis": parsed["diagnosis"],
            "stage": parsed["stage"]
        }
    }
    pdf_bytes = generate_qml_cml_patient_report_pdf(report_payload)
    print(f"   -> Compiled ReportLab Publication PDF: {len(pdf_bytes):,} bytes")
    assert len(pdf_bytes) > 2000, "PDF must be valid and non-empty"

    # 5. Strict Model Incompatibility Check
    print("\n[5/5] Verifying Strict Model Incompatibility Rejection...")
    vqc_test = VariationalQuantumClassifier(n_qubits=4, depth=2)
    try:
        vqc_test.load_state_dict({
            "n_qubits": 4, "depth": 2, "shots": 1024,
            "weights": [[0.1]*20, [0.2]*20], # 20Q weights into 4Q model
            "bias": 0.0, "is_fitted": True
        })
        print("   -> FAIL: Mismatched weights were accepted!")
        sys.exit(1)
    except ValueError as e:
        print(f"   -> PASS: Incompatible 20Q weights rejected by 4Q classifier ({e})")

    print("\n================================================================================")
    print("ALL 5 UNIFIED ACCEPTANCE CRITERIA PASSED SUCCESSFULLY.")
    print("================================================================================")

if __name__ == "__main__":
    run_acceptance()
