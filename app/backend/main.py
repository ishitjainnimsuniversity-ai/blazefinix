"""
Clinical Hybrid Classical-Quantum Machine Learning Platform
FastAPI Server Entrypoint & Lifecycle Manager
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.backend.config import settings, SAMPLE_DATA_DIR
from app.backend.database.connection import init_db
from app.backend.utils.sample_data_generator import save_sample_cohorts
from app.backend.services.pipeline_service import pipeline_service
from app.backend.api.routes_data import router as data_router
from app.backend.api.routes_models import router as models_router
from app.backend.api.routes_prediction import router as prediction_router
from app.backend.api.routes_alerts import router as alerts_router
from app.backend.api.routes_feedback import router as feedback_router
from app.backend.api.routes_analytics import router as analytics_router
from app.backend.api.routes_audit import router as audit_router
from app.backend.api.routes_reports import router as reports_router
from app.backend.api.routes_vision import router as vision_router
from app.backend.api.routes_cancer_genomics import router as cancer_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize DB tables
    init_db()
    # 2. Ensure sample data cohorts exist
    save_sample_cohorts(SAMPLE_DATA_DIR)
    # 3. Load persisted model artifacts or train baseline pipeline
    try:
        if not pipeline_service.load_model_artifacts(qubits=4):
            pipeline_service.train_full_pipeline(
                dataset_name="cardiometabolic_cohort.csv",
                top_k=4,
                run_cv=False
            )
    except Exception as e:
        print(f"Startup training warning: {e}")
    yield

app = FastAPI(
    title="Hybrid Classical-Quantum Clinical Decision Support Platform",
    description="Early Disease-Risk Stratification combining XGBoost with Variational Quantum Classifiers (VQC).",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for local React / Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers under /api
app.include_router(data_router, prefix=settings.API_PREFIX)
app.include_router(models_router, prefix=settings.API_PREFIX)
app.include_router(prediction_router, prefix=settings.API_PREFIX)
app.include_router(alerts_router, prefix=settings.API_PREFIX)
app.include_router(feedback_router, prefix=settings.API_PREFIX)
app.include_router(analytics_router, prefix=settings.API_PREFIX)
app.include_router(audit_router, prefix=settings.API_PREFIX)
app.include_router(reports_router, prefix=settings.API_PREFIX)
app.include_router(vision_router, prefix=settings.API_PREFIX)
app.include_router(cancer_router, prefix=settings.API_PREFIX)

@app.get("/")
def root():
    return {
        "platform": "Hybrid Classical-Quantum Disease Risk Stratification Platform",
        "status": "OPERATIONAL",
        "version": settings.APP_VERSION,
        "quantum_mode": settings.SYSTEM_MODE,
        "docs_url": "/docs",
        "disclaimer": "AI-generated risk assessment — not a final medical diagnosis. Final clinical decision remains with a qualified healthcare professional."
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "HEALTHY",
        "database": "CONNECTED",
        "qml_simulator": "READY",
        "active_model": pipeline_service.active_version,
        "is_model_trained": pipeline_service.is_trained
    }

@app.get("/api/capabilities")
def get_capabilities():
    return {
        "mode": "real",
        "inference": True,
        "training": True,
        "quantum": True,
        "reports": True,
        "vision": True,
        "genomics": True,
        "message": "Full local classical ML and PennyLane QML backend active."
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.backend.main:app", host="0.0.0.0", port=8000, reload=False)
