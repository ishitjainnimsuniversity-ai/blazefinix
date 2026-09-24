"""
Unit Tests for Medical Report PDF Parser & Feature Mapping
Validates accurate extraction, honest missing-value handling, and 20-feature normalization.
"""

import pytest
from app.backend.services.pdf_parser_service import parse_patient_report_text, FEATURE_SCHEMA_20Q

def test_parse_patient_report_with_detected_mutations():
    """Validates regex extraction of oncogenic mutations and clinical labs."""
    sample_text = """
    CLINICAL ONCOLOGY REPORT
    PATIENT ID: TCGA-BH-A0B2
    AGE: 58 | SEX: Female
    PRIMARY DIAGNOSIS: Invasive Breast Carcinoma (Stage IIIA)
    MUTATIONS DETECTED:
    - TP53 pathogenic missense (p.R175H)
    - BRCA1 pathogenic variant (c.68_69delAG)
    - Tumor Mutational Burden: 14.8 mut/Mb
    - Variant Allele Frequency: 42.5%
    LABORATORY VITALS:
    - Systolic Blood Pressure: 138 mmHg
    - Fasting Glucose: 118 mg/dL
    - hs-CRP: 3.8 mg/L
    """
    
    parsed = parse_patient_report_text(sample_text, filename="test_report.pdf")
    
    assert parsed["patient_id"] == "TCGA-BH-A0B2"
    assert parsed["age"] == 58
    assert parsed["sex"] == "Female"
    assert "Breast" in parsed["diagnosis"]
    assert parsed["stage"] == "Stage III"
    assert parsed["tmb_score"] == 14.8
    assert parsed["vaf_pct"] == 42.5
    assert parsed["clinical_labs"]["systolic_bp"] == 138.0
    assert parsed["clinical_labs"]["fasting_glucose"] == 118.0
    assert parsed["clinical_labs"]["hs_crp"] == 3.8
    
    # Check detected mutations list
    genes_found = [m["gene"] for m in parsed["detected_mutations"]]
    assert "TP53" in genes_found
    assert "BRCA1/2" in genes_found
    
    # Check 20-feature vector
    assert len(parsed["features_20q"]) == 20
    for feat in parsed["features_20q"]:
        assert 0.0 <= feat["normalized_value"] <= 1.0
        assert 0.0 <= feat["quantum_theta"] <= 3.14159265

def test_parse_patient_report_without_mutations_no_hallucination():
    """Validates that a normal report does NOT fabricate TP53 or BRCA mutations."""
    normal_text = """
    WELLNESS CLINIC SCREENING REPORT
    PATIENT ID: PAT-NORM-001
    AGE: 34 | SEX: Male
    DIAGNOSIS: Normal Health Checkup
    CLINICAL LABS:
    - Blood Pressure: 118/76 mmHg
    - Fasting Glucose: 88 mg/dL
    - hs-CRP: 0.8 mg/L
    All genomic screens wild-type. No somatic pathogenic variants identified.
    """
    
    parsed = parse_patient_report_text(normal_text, filename="normal_report.pdf")
    
    assert parsed["patient_id"] == "PAT-NORM-001"
    assert parsed["age"] == 34
    assert parsed["sex"] == "Male"
    # Ensure no fabricated mutations
    assert len(parsed["detected_mutations"]) == 0
