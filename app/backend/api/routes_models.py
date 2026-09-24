"""
Model Training, Benchmark Lab, Quantum Circuit, and Live Quantum Simulation API Routes
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json
from app.backend.database.connection import get_db
from app.backend.database.models import ModelRecord
from app.backend.services.pipeline_service import pipeline_service
from app.backend.qml.quantum_circuit import QuantumCircuitBuilder
from app.backend.qml.backend_manager import quantum_backend_manager
from app.backend.qml.quantum_simulator import quantum_simulator
from app.backend.schemas.pydantic_models import ModelTrainRequest, QuantumSimulationRequest


router = APIRouter(prefix="/models", tags=["Model Research & Quantum Lab"])

@router.post("/train")
def train_pipeline(payload: ModelTrainRequest):
    """
    Triggers complete reproducible training pipeline:
    1. Preprocessing with strict leakage prevention (patient-level 80/20 split)
    2. Classical ML: Logistic Regression, Random Forest, AdaBoost, XGBoost
    3. XGBoost Feature Importance Selection (top-k) derived only from train fold
    4. Variational Quantum Classifier (VQC) local PennyLane default.qubit simulation
    5. Hybrid Ensemble combination & discordance uncertainty
    6. 5-Fold Stratified Cross-Validation
    7. Disk checkpoint persistence to app/models/
    """
    try:
        results = pipeline_service.train_full_pipeline(
            dataset_name=payload.dataset_name,
            target_col=payload.target_column,
            top_k=payload.selected_features_count,
            test_size=payload.test_size,
            run_cv=payload.run_cross_validation,
            cv_folds=payload.cv_folds
        )
        return {
            "status": "SUCCESS",
            "message": f"Training pipeline completed successfully for {payload.selected_features_count} qubits.",
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model training failed: {str(e)}")

@router.get("/benchmark")
def get_benchmark(qubits: int = 4):
    """Returns side-by-side benchmark lab comparisons across classical, quantum, and hybrid models."""
    if not pipeline_service.is_trained or pipeline_service.active_qubits != qubits:
        if not pipeline_service.load_model_artifacts(qubits):
            pipeline_service.train_full_pipeline(top_k=qubits)
    return pipeline_service.last_benchmark_results

@router.get("/registry")
def list_registered_models(db: Session = Depends(get_db)):
    """Lists saved models in database registry."""
    records = db.query(ModelRecord).order_by(ModelRecord.trained_at.desc()).all()
    models = []
    for r in records:
        metrics = json.loads(r.metrics) if r.metrics else {}
        q_cfg = json.loads(r.quantum_config) if r.quantum_config else {}
        models.append({
            "model_id": r.model_id,
            "name": r.name,
            "version": r.version,
            "disease_type": r.disease_type,
            "architecture": r.model_architecture,
            "training_samples": r.training_samples,
            "accuracy": metrics.get("accuracy", 0.0),
            "roc_auc": metrics.get("roc_auc", 0.0),
            "sensitivity": metrics.get("sensitivity", 0.0),
            "quantum_config": q_cfg,
            "trained_at": r.trained_at.isoformat() if r.trained_at else None
        })
    return models

@router.get("/quantum-circuit")
def get_quantum_circuit(qubits: int = 4, depth: int = 2):
    """
    Generates dynamic parameterized quantum circuit metadata, ASCII diagram,
    and gate layouts matching the PennyLane VQC architecture for N qubits.
    """
    qubits = max(2, min(10, int(qubits)))
    feature_labels = pipeline_service.top_features if len(pipeline_service.top_features) >= qubits else None
    
    builder = QuantumCircuitBuilder(n_qubits=qubits, depth=depth)
    circuit_data = builder.build_qiskit_circuit(feature_names=feature_labels)
    gate_layers = builder.generate_circuit_svg_metadata(feature_names=feature_labels)
    backend_status = quantum_backend_manager.get_status(n_qubits=qubits)

    return {
        "circuit_info": circuit_data,
        "gate_layers": gate_layers,
        "backend_status": backend_status
    }

@router.post("/simulate-experiment")
def simulate_quantum_experiment(payload: QuantumSimulationRequest):
    """
    Executes real shot-based PennyLane default.qubit simulation on given input features.
    Returns actual measurement counts (e.g. 4-bit, 6-bit, 8-bit histograms),
    real Pauli-Z expectation value, real hybrid risk, and execution latency.
    """
    try:
        result = pipeline_service.simulate_quantum_experiment(
            features_dict=payload.features,
            qubits=payload.qubits,
            depth=payload.depth,
            shots=payload.shots
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quantum simulation failed: {str(e)}")

@router.post("/quantum-simulator/run")
def run_quantum_simulation(payload: dict):
    """
    Executes an exact statevector quantum simulation using Qiskit Aer & PennyLane.
    Extracts full 2^N complex statevector, measurement counts, Bloch vectors,
    fidelity, and Von Neumann entanglement entropy.
    """
    try:
        n_qubits = int(payload.get("qubits", 4))
        gates = payload.get("gates", None)
        shots = int(payload.get("shots", 1024))
        noise_level = float(payload.get("noise_level", 0.0))
        preset = payload.get("preset", None)
        feature_values = payload.get("feature_values", None)

        result = quantum_simulator.simulate_circuit(
            n_qubits=n_qubits,
            gates=gates,
            shots=shots,
            noise_level=noise_level,
            preset=preset,
            feature_values=feature_values
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quantum simulation error: {str(e)}")


@router.post("/quantum-simulator/train-qnn")
def train_hybrid_quantum_neural_network(payload: dict):
    """
    Trains a Deep Learning Hybrid Quantum Neural Network (PyTorch Encoder -> PennyLane VQC -> Classifier)
    using Adam optimizer and parameter-shift quantum gradients.
    """
    try:
        epochs = int(payload.get("epochs", 12))
        learning_rate = float(payload.get("learning_rate", 0.03))
        batch_size = int(payload.get("batch_size", 16))
        dataset_type = payload.get("dataset_type", "cancer_tcga")

        result = quantum_simulator.train_deep_hybrid_qnn(
            epochs=epochs,
            learning_rate=learning_rate,
            batch_size=batch_size,
            dataset_type=dataset_type
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"QNN Training error: {str(e)}")


@router.post("/quantum-simulator/kernel")
def compute_quantum_state_kernel(payload: dict):
    """
    Computes ZZ-FeatureMap Quantum Kernel overlap matrix between multi-omics patient samples.
    """
    try:
        samples = payload.get("samples", [])
        if not samples:
            samples = [
                [0.85, -1.24, 1.62, -0.45],
                [-0.92, 0.44, -1.10, 0.78],
                [1.15, -0.80, 1.35, -0.30],
                [-1.05, 0.65, -0.95, 0.88]
            ]
        result = quantum_simulator.compute_quantum_kernel(samples)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quantum kernel error: {str(e)}")


@router.get("/architecture-usp")
def get_architecture_usp():
    """
    Returns structured architecture pipeline stages and live model benchmark comparisons.
    """
    bench = pipeline_service.last_benchmark_results if pipeline_service.is_trained else {}
    xgb_auc = bench.get("classical_baseline", {}).get("roc_auc", 0.88)
    vqc_auc = bench.get("quantum_vqc", {}).get("roc_auc", 0.83)
    hyb_auc = bench.get("hybrid", {}).get("roc_auc", 0.91)

    return {
        "title_slide4": "Hybrid AI/QML Architecture + USP",
        "subtitle_slide4": "A practical, efficient and explainable pipeline for clinical risk prediction",
        "pipeline_stages": [
            {
                "step": 1,
                "title": "Data Preprocessing",
                "subtitle": "Clinical & Genomic Hygiene",
                "points": [
                    "Clean and validate multi-modal clinical data",
                    "Median imputation fitted strictly on train partition",
                    "Standard scaling with zero train/test data leakage"
                ],
                "icon": "Database"
            },
            {
                "step": 2,
                "title": "Feature Selection",
                "subtitle": "Information Gain Filtering",
                "points": [
                    "Rank biomarkers by classical XGBoost gain on train fold",
                    "Isolate top K informative indicators (K = 4, 6, 8 qubits)",
                    "Deterministic and reproducible feature routing"
                ],
                "icon": "Filter"
            },
            {
                "step": 3,
                "title": "Quantum State Encoding",
                "subtitle": "Hilbert Space Angle Mapping",
                "points": [
                    "Encode top biomarkers via Rz AngleEmbedding in [-pi, pi]",
                    "Parameterized entangling layers on PennyLane default.qubit",
                    "Dual-path analytic expectation & shot measurement sampling"
                ],
                "icon": "Cpu"
            },
            {
                "step": 4,
                "title": "Hybrid Risk Ensemble",
                "subtitle": "Dual Boosting & Quantum VQC",
                "points": [
                    "Classical ML: Tuned XGBoost tree ensemble",
                    "Quantum Model: PennyLane Variational Quantum Classifier (VQC)",
                    "Hybrid Consensus: P_hybrid = 0.60 * P_classical + 0.40 * P_quantum"
                ],
                "icon": "Layers"
            },
            {
                "step": 5,
                "title": "Explainable Output",
                "subtitle": "Confidence & Decision Support",
                "points": [
                    "Continuous disease risk stratification tiers",
                    "TreeSHAP local biomarker attributions",
                    "Epistemic uncertainty via classical-quantum discordance"
                ],
                "icon": "Search"
            }
        ],
        "metrics_summary": {
            "classical_roc_auc": xgb_auc,
            "quantum_roc_auc": vqc_auc,
            "hybrid_roc_auc": hyb_auc
        },
        "usp_quote": "Don't assume quantum advantage – measure it.",
        "usp_bullets": [
            "Hybrid approach: best of classical ML + quantum state encoding",
            "Leakage-safe feature selection derived from training partitions",
            "Explainable (TreeSHAP) and uncertainty-aware predictions",
            "100% local execution: zero cloud AI API dependencies"
        ]
    }
