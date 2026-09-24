"""
Empirical Quantum Runtime Benchmark Script
Measures actual CPU simulation latencies on PennyLane default.qubit for 4, 6, 8, and 20 qubits across varying shot budgets.
"""

import time
import numpy as np
import json
from app.backend.qml.vqc_classifier import VariationalQuantumClassifier
from app.backend.qml.quantum_simulator_20q import run_quantum_20q_simulation
from app.backend.services.pdf_parser_service import FEATURE_SCHEMA_20Q

def benchmark():
    configs = [
        {"qubits": 4, "depth": 2, "shots": 1024, "type": "vqc"},
        {"qubits": 6, "depth": 2, "shots": 1024, "type": "vqc"},
        {"qubits": 8, "depth": 2, "shots": 1024, "type": "vqc"},
        {"qubits": 20, "depth": 23, "shots": 1024, "type": "20q_forward"}
    ]

    results = []
    print("================================================================================")
    print("BLAZEFINIX PENNYLANE default.qubit HARDWARE BENCHMARK (CPU LOCAL EXECUTION)")
    print("================================================================================")

    for cfg in configs:
        q = cfg["qubits"]
        d = cfg["depth"]
        s = cfg["shots"]
        cfg_type = cfg["type"]

        latencies = []
        last_res = {}

        if cfg_type == "vqc":
            vqc = VariationalQuantumClassifier(n_qubits=q, depth=d, shots=s)
            np.random.seed(42)
            X_sample = np.random.randn(q)

            # Warmup
            _ = vqc.sample_measurements(X_sample, shots=s)

            # 5 Benchmark Iterations
            for _ in range(5):
                res = vqc.sample_measurements(X_sample, shots=s)
                latencies.append(res["execution_time_ms"])
                last_res = res

            top_state = last_res.get("top_state", "N/A")
            observed_states = last_res.get("total_observed_states", 0)
            mode = "TRAINED_VQC_INFERENCE"

        else:
            # 20Q Forward Simulation
            features_20 = [
                {"name": schema["name"], "gene": schema["gene"], "raw_value": 0.5, "quantum_theta": 0.5 * np.pi, "normalized_value": 0.5}
                for schema in FEATURE_SCHEMA_20Q
            ]
            # Warmup
            _ = run_quantum_20q_simulation(features_20, num_qubits=20, shots=s)

            # 5 Benchmark Iterations
            for _ in range(5):
                res = run_quantum_20q_simulation(features_20, num_qubits=20, shots=s)
                latencies.append(res["execution_time_ms"])
                last_res = res

            top_state = next(iter(last_res["measurement_counts"].keys())) if last_res["measurement_counts"] else "N/A"
            observed_states = last_res.get("total_observed_states", 0)
            mode = "EXPERIMENTAL_FORWARD_EVALUATION"

        mean_lat = round(float(np.mean(latencies)), 2)
        std_lat = round(float(np.std(latencies)), 2)
        min_lat = round(float(np.min(latencies)), 2)
        max_lat = round(float(np.max(latencies)), 2)

        record = {
            "qubit_count": q,
            "circuit_depth": d,
            "shots": s,
            "execution_mode": mode,
            "theoretical_state_space": 2 ** q,
            "device": "PennyLane default.qubit (CPU)",
            "mean_execution_ms": mean_lat,
            "std_execution_ms": std_lat,
            "min_execution_ms": min_lat,
            "max_execution_ms": max_lat,
            "sample_top_bitstring": top_state,
            "observed_unique_states_in_shots": observed_states
        }
        results.append(record)
        print(f"[{q} Qubits | Depth {d} | {s} Shots | {mode}]")
        print(f"   Theoretical Hilbert space: {2**q:,} states")
        print(f"   Observed unique bitstrings in {s} shots: {observed_states}")
        print(f"   Latency: Mean={mean_lat}ms, Min={min_lat}ms, Max={max_lat}ms (std={std_lat}ms)\n")

    print("================================================================================")
    with open("benchmark_results.json", "w") as f:
        json.dump(results, f, indent=2)
    print("Saved benchmark results to benchmark_results.json")

if __name__ == "__main__":
    benchmark()
