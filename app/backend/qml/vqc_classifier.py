"""
Variational Quantum Classifier (VQC) Engine
Implements practical parameterized quantum circuits with angle encoding and entangling ansatz.
Uses PennyLane with default.qubit as the single source of truth for quantum simulation.
Supports dynamic qubit register scaling (4, 6, 8 qubits) and genuine shot-based measurements.
"""

import time
from typing import Dict, Any, Tuple, Optional
import numpy as np
import pennylane as qml
from pennylane import numpy as pnp
from sklearn.metrics import accuracy_score, recall_score, roc_auc_score, f1_score

class VariationalQuantumClassifier:
    """
    Practical Variational Quantum Classifier (VQC) using PennyLane default.qubit.
    Encodes top-K informative features into K quantum wires.
    """

    def __init__(self, n_qubits: int = 4, depth: int = 2, shots: int = 1024):
        if n_qubits < 2:
            raise ValueError(f"Quantum register requires at least 2 qubits, got {n_qubits}")
        
        self.n_qubits = int(n_qubits)
        self.depth = int(depth)
        self.shots = int(shots)
        
        # Primary PennyLane device for statevector & execution
        self.device = qml.device("default.qubit", wires=self.n_qubits)

        self.weights: Optional[np.ndarray] = None
        self.bias: float = 0.0
        self.is_fitted: bool = False
        
        # 1. Analytic QNode for training gradients & exact expectation <Z_0>
        def _circuit_analytic(weights, x):
            qml.AngleEmbedding(x, wires=range(self.n_qubits), rotation="Z")
            qml.BasicEntanglerLayers(weights, wires=range(self.n_qubits))
            return qml.expval(qml.PauliZ(0))

        self.qnode_analytic = qml.QNode(_circuit_analytic, self.device)

        # 2. Base Measurement QNode for computational basis counts
        def _circuit_shots(weights, x):
            qml.AngleEmbedding(x, wires=range(self.n_qubits), rotation="Z")
            qml.BasicEntanglerLayers(weights, wires=range(self.n_qubits))
            return qml.counts()

        self.qnode_shots = qml.QNode(_circuit_shots, self.device)

    def _init_weights_if_needed(self):
        if self.weights is None or self.weights.shape != (self.depth, self.n_qubits):
            np.random.seed(42)
            shape = (self.depth, self.n_qubits)
            self.weights = pnp.array(0.1 * np.random.randn(*shape), requires_grad=True)
            self.bias = pnp.array(0.0, requires_grad=True)

    def _feature_scale(self, X: np.ndarray) -> np.ndarray:
        """Scales inputs to [-pi, pi] for angle embedding."""
        X_sub = X[:, :self.n_qubits]
        return np.clip(X_sub, -2.5, 2.5) * (np.pi / 2.5)

    def fit(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        steps: int = 25,
        batch_size: int = 32,
        stepsize: float = 0.15
    ) -> Dict[str, Any]:
        """Trains variational weights using mini-batch Adam optimizer on PennyLane analytic QNode."""
        t_start = time.perf_counter()
        X_scaled = self._feature_scale(X_train)
        
        shape = (self.depth, self.n_qubits)
        np.random.seed(42)
        weights = pnp.array(0.1 * np.random.randn(*shape), requires_grad=True)
        bias = pnp.array(0.0, requires_grad=True)

        opt = qml.AdamOptimizer(stepsize=stepsize)

        def cost_fn(w, b, X_batch, y_batch):
            loss = 0.0
            for x_i, y_i in zip(X_batch, y_batch):
                expval = self.qnode_analytic(w, x_i)
                prob = 1.0 / (1.0 + pnp.exp(-(expval + b) * 2.0))
                prob = pnp.clip(prob, 1e-6, 1.0 - 1e-6)
                loss = loss - (y_i * pnp.log(prob) + (1.0 - y_i) * pnp.log(1.0 - prob))
            return loss / len(X_batch)

        n_samples = len(X_scaled)
        batch_size = min(batch_size, n_samples)
        
        last_loss = 0.0
        for step in range(steps):
            indices = np.random.choice(n_samples, batch_size, replace=False)
            X_b = pnp.array(X_scaled[indices], requires_grad=False)
            y_b = pnp.array(y_train[indices], requires_grad=False)

            (weights, bias), loss_val = opt.step_and_cost(
                lambda w, b: cost_fn(w, b, X_b, y_b), weights, bias
            )
            last_loss = float(loss_val)

        self.weights = np.array(weights, dtype=float)
        self.bias = float(bias)
        self.is_fitted = True
        train_time = time.perf_counter() - t_start

        return {
            "training_time_seconds": round(train_time, 3),
            "final_loss": round(last_loss, 4),
            "qubits_used": self.n_qubits,
            "circuit_depth": self.depth,
            "iterations": steps,
            "simulator": "PennyLane.default.qubit (Analytic Statevector)"
        }

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        """Computes quantum model probability array via analytic expectation."""
        self._init_weights_if_needed()
        X_scaled = self._feature_scale(X)
        probs = []
        for x_i in X_scaled:
            expval = float(self.qnode_analytic(self.weights, x_i))
            prob = 1.0 / (1.0 + np.exp(-(expval + self.bias) * 2.0))
            probs.append([1.0 - prob, prob])

        return np.array(probs)

    def predict(self, X: np.ndarray, threshold: float = 0.5) -> np.ndarray:
        probs = self.predict_proba(X)[:, 1]
        return (probs >= threshold).astype(int)

    def sample_measurements(
        self,
        x_vector: np.ndarray,
        shots: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Executes real shot-based projective measurement on a single feature vector.
        Returns actual collapsed bitstring counts (e.g. 4-bit, 6-bit, 8-bit keys),
        real expectation value, and execution latency.
        """
        t_start = time.perf_counter()
        self._init_weights_if_needed()
        
        shot_count = shots if shots is not None else self.shots
        shot_runner = qml.set_shots(self.qnode_shots, shots=shot_count)
            
        x_flat = np.asarray(x_vector, dtype=float).flatten()
        if len(x_flat) < self.n_qubits:
            x_pad = np.zeros(self.n_qubits, dtype=float)
            x_pad[:len(x_flat)] = x_flat
            x_flat = x_pad
        else:
            x_flat = x_flat[:self.n_qubits]
            
        x_scaled = np.clip(x_flat, -2.5, 2.5) * (np.pi / 2.5)

        # 1. Execute real shot measurements
        raw_counts = shot_runner(self.weights, x_scaled)
        
        counts_dict: Dict[str, int] = {}
        for k, v in raw_counts.items():
            if isinstance(k, tuple):
                bitstr = "".join(str(b) for b in k)
            elif isinstance(k, (int, np.integer)):
                bitstr = f"{k:0{self.n_qubits}b}"
            else:
                bitstr = str(k)
            counts_dict[bitstr] = int(v)

        sorted_counts = dict(sorted(counts_dict.items(), key=lambda item: item[1], reverse=True))

        # 2. Compute exact analytic expectation value & probability
        expval = float(self.qnode_analytic(self.weights, x_scaled))
        quantum_risk = float(1.0 / (1.0 + np.exp(-(expval + self.bias) * 2.0)))

        exec_time_ms = round((time.perf_counter() - t_start) * 1000.0, 2)

        return {
            "simulator": "PennyLane.default.qubit",
            "execution_mode": "SHOT_BASED_MEASUREMENT",
            "qubits": self.n_qubits,
            "circuit_depth": self.depth,
            "shots_executed": shot_count,
            "execution_time_ms": exec_time_ms,
            "pauli_z_expectation": round(expval, 4),
            "quantum_probability": round(quantum_risk, 4),
            "measurement_counts": sorted_counts,
            "total_observed_states": len(sorted_counts),
            "top_state": next(iter(sorted_counts.keys())) if sorted_counts else "0" * self.n_qubits
        }

    def evaluate(self, X_test: np.ndarray, y_test: np.ndarray) -> Dict[str, Any]:
        """Evaluates QML model on test partition."""
        t_start = time.perf_counter()
        probs = self.predict_proba(X_test)[:, 1]
        preds = (probs >= 0.5).astype(int)
        inference_time_ms = (time.perf_counter() - t_start) * 1000.0 / len(X_test)

        acc = float(accuracy_score(y_test, preds))
        sens = float(recall_score(y_test, preds, zero_division=0))
        f1 = float(f1_score(y_test, preds, zero_division=0))
        try:
            auc = float(roc_auc_score(y_test, probs))
        except Exception:
            auc = 0.5

        return {
            "accuracy": round(acc, 4),
            "sensitivity": round(sens, 4),
            "recall": round(sens, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(auc, 4),
            "inference_time_ms": round(inference_time_ms, 3),
            "circuit_qubits": self.n_qubits,
            "circuit_depth": self.depth
        }

    def get_state_dict(self) -> Dict[str, Any]:
        """Returns serializable dictionary representing the trained VQC state."""
        return {
            "n_qubits": self.n_qubits,
            "depth": self.depth,
            "shots": self.shots,
            "weights": self.weights.tolist() if self.weights is not None else None,
            "bias": float(self.bias),
            "is_fitted": bool(self.is_fitted)
        }

    def load_state_dict(self, state: Dict[str, Any]):
        """Loads trained weights and configuration safely with strict shape validation."""
        n_q = int(state["n_qubits"])
        depth = int(state["depth"])
        shots = int(state.get("shots", 1024))

        if state.get("weights") is not None:
            w = np.array(state["weights"], dtype=float)
            expected_shape = (depth, n_q)
            if w.shape != expected_shape:
                raise ValueError(
                    f"Incompatible weight shape {w.shape} for model with {n_q} qubits and depth {depth}. Expected {expected_shape}."
                )
            self.weights = w

        self.n_qubits = n_q
        self.depth = depth
        self.shots = shots
        self.bias = float(state.get("bias", 0.0))
        self.is_fitted = bool(state.get("is_fitted", False))
        
        self.device = qml.device("default.qubit", wires=self.n_qubits)

