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

## 2. Serverless Feasibility & Blockers Audit

We conducted a technical evaluation of deploying the Python FastAPI backend on Vercel Python Functions vs using a client-side execution adapter.

| Operational Vector | Technical Requirement | Vercel Python Function Capability | Audit Conclusion |
|---|---|---|---|
| **API Server Routing** | FastAPI / ASGI application | Supported via `@vercel/python` / WSGI | Feasible for lightweight endpoints |
| **Package Size** | `torch`, `pennylane`, `xgboost`, `scikit-learn`, `pymupdf` (~1.2 GB) | Vercel Serverless Function limit: **250MB (uncompressed)** | ❌ **BLOCKER**: Python QML & PyTorch dependencies exceed bundle limits |
| **Execution Time** | QML Circuit optimization (50-200 iterations: 15-45s) | Vercel standard serverless timeout: **10-60s max** | ❌ **BLOCKER**: Heavy QML training times out on free/pro serverless tiers |
| **Model Weight Storage** | Pre-trained `.pkl` / `.pt` files (~400MB) | Ephemeral disk, 250MB bundle limit | ❌ **BLOCKER**: Storage quota exceeded |
| **Filesystem & State** | SQLite database (`blazefinix.db`), PDF file generation | Ephemeral filesystem (`/tmp` read-only root) | ⚠️ Requires external cloud DB & storage (S3/Cloudinary) |
| **Native C/C++ Extensions** | `PennyLane-Lightning` quantum C++ simulator extensions | Requires pre-compiled Linux x86_64 wheels | ⚠️ High risk of binary incompatibility |

### Audit Verdict:
While lightweight FastAPI routes can run on Vercel, **executing live multi-qubit PennyLane QML circuits, training XGBoost/Ensemble models, and persisting SQLite state exceed Vercel serverless platform constraints.**

Therefore, the system MUST implement a dual-mode architecture:
1. **REAL MODE** when hosted locally or on a dedicated Python container (e.g. Docker / Render / Cloud Run / local dev).
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
