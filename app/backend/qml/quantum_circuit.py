"""
Quantum Circuit Builder (Visualization and Representation Layer)
Generates parameterized gate metadata and ASCII representations corresponding
directly to the PennyLane VQC architecture executed on default.qubit.
"""

from typing import Dict, Any, List, Optional
import qiskit
from qiskit import QuantumCircuit
from qiskit.circuit import ParameterVector

class QuantumCircuitBuilder:
    """Constructs parameterized quantum circuits matching the PennyLane VQC specification."""

    def __init__(self, n_qubits: int = 4, depth: int = 2):
        self.n_qubits = max(2, int(n_qubits))
        self.depth = max(1, int(depth))

    def build_qiskit_circuit(
        self,
        feature_names: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Builds complete parameterized QuantumCircuit corresponding to:
        1. Hadamard Superposition
        2. Rz Angle Embedding (features x_0 .. x_{n-1})
        3. Basic Entangler Layers with Parameterized Ry rotations & CNOTs
        4. Measurement
        """
        n = self.n_qubits
        qc = QuantumCircuit(n)
        
        # 1. Feature Map Parameters
        x_params = ParameterVector("x", n)
        
        # Superposition layer
        for i in range(n):
            qc.h(i)

        # Angle Embedding (Rz rotation per feature)
        for i in range(n):
            qc.rz(x_params[i], i)

        qc.barrier()

        # 2. Variational Entangling Layers
        theta_count = n * self.depth
        theta_params = ParameterVector("theta", theta_count)
        
        param_idx = 0
        for d in range(self.depth):
            for i in range(n):
                qc.ry(theta_params[param_idx], i)
                param_idx += 1
            
            # Entangling CNOT ring / ladder
            for i in range(n):
                qc.cx(i, (i + 1) % n)
            qc.barrier()

        # Circuit statistics
        circuit_depth = qc.depth()
        gate_counts = {k: int(v) for k, v in qc.count_ops().items()}
        total_parameters = len(qc.parameters)
        
        # Text ASCII representation
        ascii_diagram = str(qc.draw(output="text"))

        labels = feature_names[:n] if feature_names and len(feature_names) >= n else [f"x[{i}]" for i in range(n)]

        return {
            "num_qubits": n,
            "circuit_depth": circuit_depth,
            "gate_counts": gate_counts,
            "total_parameters": total_parameters,
            "feature_params_count": n,
            "variational_params_count": theta_count,
            "ascii_diagram": ascii_diagram,
            "feature_labels": labels,
            "feature_map": "AngleEmbedding (Rz)",
            "ansatz": "BasicEntanglerLayers (Ry + CNOT Ring)"
        }

    def generate_circuit_svg_metadata(self, feature_names: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """Provides structured layout metadata for rendering interactive UI circuit gates."""
        layers = []
        n = self.n_qubits
        labels = feature_names[:n] if feature_names and len(feature_names) >= n else [f"x[{i}]" for i in range(n)]

        # Layer 1: H gates
        h_layer = [{"qubit": q, "gate": "H", "param": None} for q in range(n)]
        layers.append({"name": "Superposition", "gates": h_layer})

        # Layer 2: Rz feature encoding
        rz_layer = [{"qubit": q, "gate": "Rz", "param": labels[q]} for q in range(n)]
        layers.append({"name": "Angle Feature Encoding", "gates": rz_layer})

        # Layer 3+: Variational Ry + CNOT layers
        for d in range(self.depth):
            ry_layer = [{"qubit": q, "gate": "Ry", "param": f"θ[{d},{q}]"} for q in range(n)]
            layers.append({"name": f"Variational Rotation L{d+1}", "gates": ry_layer})

            cnot_layer = []
            for q in range(n):
                cnot_layer.append({"qubit": q, "target": (q + 1) % n, "gate": "CNOT", "param": None})
            layers.append({"name": f"Entanglement CNOT Ring L{d+1}", "gates": cnot_layer})

        # Final Layer: Measurement
        measure_layer = [{"qubit": q, "gate": "Measure", "param": "Z"} for q in range(n)]
        layers.append({"name": "Pauli-Z Expectation / Shot Measurement", "gates": measure_layer})

        return layers
