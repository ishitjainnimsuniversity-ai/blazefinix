# BlazeFinix — Vercel Deployment Audit & Capability Assessment

## Executive Summary
BlazeFinix includes both a frontend React interface and a Python FastAPI backend powering classical ML models (XGBoost, Random Forest, Logistic Regression), Variational Quantum Circuits (PennyLane QML simulators), genomic cross-referencing, and PDF report processing.

When deployed publicly to Vercel as a pure Vite static application, workflows relying on live FastAPI backend calls encounter 404/HTML rewrite failures. This audit evaluates the feasibility of running backend services on Vercel vs establishing a robust **Demonstration Mode Execution Adapter** to preserve full interactivity for SIH judges while ensuring 100% transparency.

---

## 1. Current Deployment Architecture

```text
CURRENT DEPLOYMENT (Vercel)
Vite Static Bundle (app/frontend/dist)
    │
    ├── HTML/JS/CSS rendered in browser
    │
    └── HTTP fetch to /api/* ──► Rewritten to /index.html (404/HTML Response)
                                        │
                                        └── Fails or triggers unhandled error state
```

```text
TARGET ARCHITECTURE
Frontend (Vite / React)
    │
    ├── Capability Auto-Detection (GET /api/capabilities)
    │
    ├── [Backend Available] ──► REAL MODE (FastAPI + ML + QML Pipeline)
    │
    └── [Backend Unavailable] ──► DEMO MODE (Deterministic Execution Adapter)
                                        │
                                        ├── Fully interactive UI workflow
                                        ├── Deterministic simulated results
                                        ├── Clear "Demonstration Result" tags
                                        └── PDF Report generation (Demo marked)
```

---

## 2. Serverless Capability & Deployment Audit

### Technical & Architectural Distinction:
- **Technically Possible in Principle**: Deploying FastAPI with Python Functions or Fluid Compute on Vercel or external container hosting platforms (Cloud Run / Render / AWS).
- **Currently Deployed**: The current public deployment at `https://blazefinix.vercel.app` intentionally uses a lightweight static Demo Mode.
- **Actually Tested**: Public Demo Mode on Vercel and local Real Mode backend on the local developer environment.

### Deployment Rationale:
The current public deployment intentionally uses a lightweight static Demo Mode. Although Vercel now supports larger Python Functions and longer-running workloads through Fluid Compute, the full BlazeFinix ML/QML pipeline has not been deployed to Vercel because its dependency footprint, model-loading requirements, computational workload, and runtime/resource characteristics have not yet been validated on Vercel.

Therefore, the system implements a dual-mode architecture:
1. **REAL MODE** when hosted locally or on a dedicated Python environment / container.
2. **DEMO MODE** when hosted on Vercel or when real backend endpoints are unreachable.

---

## 3. Required Runtime Dependencies

### Classical & Quantum ML Engine (Real Mode):
- `pennylane` >= 0.35.0
- `torch` >= 2.1.0
- `xgboost` >= 2.0.0
- `scikit-learn` >= 1.4.0
- `numpy` >= 1.26.0, `pandas` >= 2.2.0

### Backend Infrastructure (Real Mode):
- `fastapi` >= 0.110.0, `uvicorn` >= 0.28.0
- `sqlalchemy` >= 2.0.0, `sqlite3`
- `reportlab` >= 4.1.0, `pymupdf` >= 1.24.0

---

## 4. Execution Mode Architecture

```text
                       ┌───────────────────────────────┐
                       │   BlazeFinix Frontend SPA     │
                       └───────────────┬───────────────┘
                                       │
                         Auto-Detect Capabilities
                         GET /api/capabilities
                                       │
                     ┌─────────────────┴─────────────────┐
                     ▼                                   ▼
        [Real Backend Responsive]             [Backend Unreachable / Vercel]
                     │                                   │
                     ▼                                   ▼
         RealExecutionAdapter                DemoExecutionAdapter
                     │                                   │
      - Live FastAPI backend             - Deterministic sample cases
      - PennyLane QML simulator          - Client-side QNN simulator
      - Trained XGBoost inference        - Consistent SHAP/quantum attributions
      - Database persistent audit        - Demo marked PDF export
```

---

## 5. Security & Privacy Considerations
1. **Public Demo Data Privacy**: No genuine patient data or PHI/PII is stored or transmitted in public demo mode.
2. **Deterministic Inputs**: All demo cohort cases (`DEMO-LOW-01`, `DEMO-MOD-02`, etc.) use synthetic, de-identified parameters.
3. **Disclosure Transparency**: Every view, drawer, and PDF generated in Demo Mode explicitly bears the badge **"DEMONSTRATION RESULT / DEMO MODE"** to avoid false clinical diagnostic claims.

---

## 6. Next Steps & Implementation Plan
1. Implement runtime capability detection service.
2. Create central `ExecutionAdapter` managing Real vs Demo services.
3. Refactor UI pages (Overview, Patients, New Assessment, Clinical Decision, Model Lab, Quantum Lab, Reports) to call `ExecutionAdapter`.
4. Add top-level Demo Mode Disclosure banner and dynamic backend status indicator in `Header.tsx`.
5. Fix state semantics in `ModelLabPage.tsx` so failures never show misleading green styling.
6. Verify end-to-end judge workflow on Desktop and Mobile (390px / 430px).
