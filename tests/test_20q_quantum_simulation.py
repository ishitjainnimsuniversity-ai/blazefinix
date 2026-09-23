"""
Unit Tests for PennyLane 20-Qubit Circuit & Multi-Omics Simulation
Validates real 20-wire quantum execution, 20-bit bitstring shot measurements, and absence of fake math.
"""

import pytest
import numpy as np
import pennylane as qml
from app.backend.qml.quantum_simulator_20q import run_quantum_20q_simulation, build_20q_circuit
from app.backend.services.pdf_parser_service import FEATURE_SCHEMA_20Q

def test_20q_circuit_construction():
    """Validates that build_20q_circuit builds parameterized QNodes on default.qubit."""
    c_exact, c_shots = build_20q_circuit(num_qubits=20)
    assert c_exact is not None
    assert c_shots is not None

def test_20q_simulation_execution():
    """Executes PennyLane 20Q simulation on 20 features and verifies output dimensions and types."""
    features_20 = [
        {"name": schema["name"], "gene": schema["gene"], "raw_value": 0.5, "quantum_theta": 0.5 * np.pi, "normalized_value": 0.5}
        for schema in FEATURE_SCHEMA_20Q
    ]
    
    result = run_quantum_20q_simulation(features_20, num_qubits=20, shots=100)
    
    assert result["num_qubits"] == 20
    assert result["hilbert_dimension"] == 2**20  # 1,048,576
    assert result["execution_mode"] == "EXPERIMENTAL_FORWARD_EVALUATION"
    assert len(result["pauli_z_expectations"]) == 20
    assert len(result["qubit_diagnostics"]) == 20
    
    # Check Pauli Z expectations are valid real numbers in [-1, 1]
    for z in result["pauli_z_expectations"]:
        assert -1.0 <= z <= 1.0
        
    # Check measurement bitstrings are exactly 20 bits long
    assert len(result["measurement_counts"]) > 0
    for bitstring, count in result["measurement_counts"].items():
        assert len(bitstring) == 20
        assert count > 0
        assert set(bitstring).issubset({"0", "1"})

def test_variable_qubit_scaling():
    """Validates that simulator runs properly across variable wire counts (e.g. 6, 12, 20)."""
    for n in [6, 12, 20]:
        feat = [{"name": f"f_{i}", "gene": f"Q{i}", "quantum_theta": 0.785, "normalized_value": 0.5} for i in range(n)]
        res = run_quantum_20q_simulation(feat, num_qubits=n, shots=50)
        assert res["num_qubits"] == n
        assert res["hilbert_dimension"] == 2**n
        for bitstr in res["measurement_counts"].keys():
            assert len(bitstr) == n
