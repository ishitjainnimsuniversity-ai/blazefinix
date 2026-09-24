"""
Integration Tests for PDF Extraction -> 20Q Dual QML/CML -> ReportLab PDF Generation
Validates complete end-to-end data flow without mocks or external AI dependencies.
"""

import pytest
from app.backend.services.pdf_parser_service import parse_patient_report_text
from app.backend.api.routes_reports import _evaluate_qml_cml_internal, SAMPLE_PATIENT_DOSSIERS
from app.backend.utils.pdf_generator import generate_qml_cml_patient_report_pdf

def test_end_to_end_pdf_to_20q_evaluation():
    """Validates text parsing -> 20-feature normalization -> dual QML/CML execution."""
    sample = SAMPLE_PATIENT_DOSSIERS[0]
    parsed = parse_patient_report_text(sample["raw_text"], filename="test_dossier.pdf")
    
    assert len(parsed["features_20q"]) == 20
    
    eval_res = _evaluate_qml_cml_internal(parsed["features_20q"], num_qubits=20)
    
    assert "cml_metrics" in eval_res
    assert "qml_metrics" in eval_res
    assert "hybrid_metrics" in eval_res
    assert "qubit_diagnostics" in eval_res
    assert "shap_attributions" in eval_res
    
    assert eval_res["qml_metrics"]["num_qubits"] == 20
    assert eval_res["qml_metrics"]["hilbert_dimension"] == 1048576
    assert 0.0 <= eval_res["hybrid_metrics"]["hybrid_risk_score"] <= 1.0
    assert eval_res["hybrid_metrics"]["epistemic_uncertainty"] >= 0.0

def test_qml_cml_pdf_generation():
    """Validates that generate_qml_cml_patient_report_pdf creates valid non-empty PDF bytes."""
    sample = SAMPLE_PATIENT_DOSSIERS[0]
    parsed = parse_patient_report_text(sample["raw_text"], filename="test_dossier.pdf")
    eval_res = _evaluate_qml_cml_internal(parsed["features_20q"], num_qubits=20)
    
    report_payload = {
        **parsed,
        **eval_res,
        "patient_demographics": {
            "patient_id": parsed["patient_id"],
            "age": parsed["age"],
            "sex": parsed["sex"],
            "diagnosis": parsed["diagnosis"],
            "stage": parsed["stage"]
        }
    }
    
    pdf_bytes = generate_qml_cml_patient_report_pdf(report_payload)
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 1000
    assert pdf_bytes.startswith(b"%PDF")
