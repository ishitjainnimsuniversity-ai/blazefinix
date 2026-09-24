"""
Unit Tests for Model Compatibility & Incompatible Weight Rejection
Validates that 4Q/6Q/8Q/20Q models maintain strict compatibility and reject mismatched weights.
"""

import pytest
import numpy as np
from app.backend.qml.vqc_classifier import VariationalQuantumClassifier

def test_vqc_incompatible_weight_shape_rejection():
    """Validates that loading weights with mismatched dimensions raises ValueError."""
    vqc_4q = VariationalQuantumClassifier(n_qubits=4, depth=2)
    
    # Incompatible state from an 8-qubit model (depth 2, 8 qubits -> shape (2, 8))
    incompatible_state = {
        "n_qubits": 4,
        "depth": 2,
        "shots": 1024,
        "weights": [[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8], [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]],
        "bias": 0.0,
        "is_fitted": True
    }
    
    with pytest.raises(ValueError, match="Incompatible weight shape"):
        vqc_4q.load_state_dict(incompatible_state)

def test_vqc_compatible_weight_loading():
    """Validates that loading correctly shaped weights succeeds."""
    vqc_4q = VariationalQuantumClassifier(n_qubits=4, depth=2)
    
    valid_state = {
        "n_qubits": 4,
        "depth": 2,
        "shots": 1024,
        "weights": [[0.1, 0.2, 0.3, 0.4], [0.5, 0.6, 0.7, 0.8]],
        "bias": 0.15,
        "is_fitted": True
    }
    
    vqc_4q.load_state_dict(valid_state)
    assert vqc_4q.weights.shape == (2, 4)
    assert vqc_4q.bias == 0.15
    assert vqc_4q.is_fitted is True
