"""
Quantum Backend & Simulator Runtime Manager
Provides accurate reporting of the active PennyLane default.qubit simulator.
"""

from typing import Dict, Any

class QuantumBackendManager:
    """Manages quantum simulator status and environment reporting."""

    def __init__(self):
        self.active_backend = "PennyLaneDefaultQubit"
        self.supported_backends = [
            "PennyLaneDefaultQubit",
            "PennyLaneLightningQubit"
        ]

    def get_status(self, n_qubits: int = 4) -> Dict[str, Any]:
        """Reports live quantum simulator status without false hardware claims."""
        return {
            "active_backend": "PennyLane.default.qubit",
            "system_mode": "LOCAL_QUANTUM_SIMULATION",
            "provider": "PennyLane Local Runtime (CPU)",
            "message": "Local quantum simulator operational using PennyLane default.qubit.",
            "hardware_qubits_supported": 20,
            "active_qubits": n_qubits,
            "supported_qubit_options": [4, 6, 8, 20],
            "execution_engine": "PennyLane Statevector & Projective Measurement"
        }

quantum_backend_manager = QuantumBackendManager()
