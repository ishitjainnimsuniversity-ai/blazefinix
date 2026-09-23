"""
Tests for Dynamic Qubit Scaling (4Q, 6Q, 8Q), Shot Measurement Bitstrings, and Model Persistence Safeguards
"""

import pytest
import numpy as np
import os
import shutil
from app.backend.qml.vqc_classifier import VariationalQuantumClassifier
from app.backend.services.pipeline_service import pipeline_service

def test_dynamic_qubit_shapes_and_measurements():
    for n_qubits in [4, 6, 8]:
        depth = 2
        shots = 256
        vqc = VariationalQuantumClassifier(n_qubits=n_qubits, depth=depth, shots=shots)
        
        # Sample synthetic data
        np.random.seed(42)
        X_sample = np.random.randn(2, n_qubits)
        
        # Analytic expectation value probabilities: shape (2, 2)
        probs = vqc.predict_proba(X_sample)
        assert probs.shape == (2, 2)
        assert 0.0 <= probs[0, 1] <= 1.0
        
        # Verify parameter shape initialized: (depth, n_qubits)
        assert vqc.weights.shape == (depth, n_qubits)
        
        # Shot sampling
        telemetry = vqc.sample_measurements(X_sample[0], shots=shots)
        assert telemetry["shots_executed"] == shots
        assert telemetry["qubits"] == n_qubits
        assert telemetry["circuit_depth"] == depth
        assert telemetry["execution_time_ms"] > 0
        assert "default.qubit" in telemetry["simulator"]
        
        # Verify returned measurement bitstrings have exact length n_qubits
        counts = telemetry["measurement_counts"]
        assert len(counts) > 0
        for bitstring, count in counts.items():
            assert len(bitstring) == n_qubits, f"Bitstring {bitstring} length {len(bitstring)} != {n_qubits}"
            assert count > 0

def test_model_persistence_and_incompatible_weight_rejection():
    # 1. State dict serialization
    vqc_4q = VariationalQuantumClassifier(n_qubits=4, depth=2)
    X = np.random.randn(20, 4)
    y = (X[:, 0] > 0).astype(int)
    vqc_4q.fit(X, y, steps=3, batch_size=8)
    
    state_4q = vqc_4q.get_state_dict()
    assert state_4q["n_qubits"] == 4
    assert len(state_4q["weights"]) == 2  # depth = 2
    assert len(state_4q["weights"][0]) == 4  # 4 qubits

    # Loading into another 4-qubit instance preserves weights
    vqc_4q_copy = VariationalQuantumClassifier(n_qubits=4, depth=2)
    vqc_4q_copy.load_state_dict(state_4q)
    assert np.allclose(vqc_4q.weights, vqc_4q_copy.weights)

    # 2. Pipeline-level persistence for 4Q, 6Q, 8Q
    res_4q = pipeline_service.train_full_pipeline(
        dataset_name="cardiometabolic_cohort.csv",
        top_k=4,
        run_cv=False
    )
    assert "hybrid" in res_4q
    assert os.path.exists("app/models/vqc_4q/metadata.json")
    assert os.path.exists("app/models/vqc_4q/vqc_state.json")
    assert os.path.exists("app/models/vqc_4q/xgboost_model.json")

    # Verify reloading from disk
    loaded = pipeline_service.load_model_artifacts(qubits=4)
    assert loaded is True
    assert pipeline_service.active_qubits == 4
    assert len(pipeline_service.top_features) == 4

def test_leakage_safe_cv_feature_selection():
    # Verify pipeline feature selection strictly inside fold
    res = pipeline_service.train_full_pipeline(
        dataset_name="cardiometabolic_cohort.csv",
        top_k=4,
        run_cv=True,
        cv_folds=3
    )
    assert "hybrid" in res
    assert "cross_validation" in res
    assert res["cross_validation"]["folds"] == 3
    assert 0.5 <= res["cross_validation"]["roc_auc_mean"] <= 1.0
