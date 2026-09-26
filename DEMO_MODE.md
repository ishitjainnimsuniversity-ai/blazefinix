# BlazeFinix — Demonstration Mode Architecture & Operations

## Overview
BlazeFinix operates in two distinct execution modes:

1. **REAL MODE**: Operates when connected to a live Python FastAPI backend. Executes full classical machine learning (XGBoost, Random Forest, Logistic Regression), PennyLane Variational Quantum Circuits (VQC), genomic cross-referencing, and PDF report generation.
2. **DEMO MODE**: Operates when deployed on Vercel or when the backend service is offline. Uses a client-side execution adapter that generates deterministic, realistic demonstration results, SHAP/quantum attributions, and pre-computed research metrics.

---

## Key Principles of Demo Mode

### 1. 100% Honest Disclosure
Demo Mode **NEVER** claims to have executed a live QML circuit or XGBoost model when it did not. Every prediction card, technical drawer, model lab view, and generated PDF explicitly displays:

> **DEMONSTRATION RESULT**
> *Execution Mode: Simulated / Demonstration Mode*

### 2. Deterministic & Reproducible
Demo Mode does **NOT** use random numbers (`Math.random()`). Submitting the same patient data or selecting the same demo case will produce the exact same risk scores, metrics, and explanations every time.

### 3. End-to-End Judge Testable
Judges can open the hosted Vercel URL and test every single screen and feature:
- Patient Records & Demo Cases
- Clinical Decision Support & Multi-Modal Analysis
- New Risk Assessment Submission
- Model Lab & Benchmark Comparisons
- Quantum Lab Circuit Visualization & QNN Simulator
- PDF Clinical Report Download (clearly marked as a Demonstration Report)

---

## Execution Adapter Design

The application uses an automated capability check:

```typescript
GET /api/capabilities
```

- If the backend returns `{ mode: "real", ... }`, the application runs in **REAL MODE**.
- If the backend returns `{ mode: "demo", ... }` or if the request fails (e.g. Vercel static deployment), the application automatically switches to **DEMO MODE**.

```text
       Frontend Request
              │
              ▼
      ExecutionAdapter
     ┌────────┴────────┐
     ▼                 ▼
Real Service       Demo Service
 (FastAPI)       (Deterministic)
```

---

## How to Run Full Local System (REAL MODE)

To execute the complete classical ML, PennyLane QML, and FastAPI pipeline locally:

1. Clone repository & install dependencies:
   ```bash
   pip install -r requirements.txt
   cd app/frontend && npm install
   ```

2. Start the FastAPI backend:
   ```bash
   python app/backend/main.py
   # Serves API at http://localhost:8000
   ```

3. Start the frontend:
   ```bash
   npm run dev
   # Serves UI at http://localhost:3000
   ```

4. The frontend will auto-detect `http://localhost:8000/api/capabilities` and switch to **REAL MODE**.

---

## Disabling Demo Mode & Deploying Hosted Inference

To deploy a hosted version of BlazeFinix with live inference enabled:

1. Host the FastAPI backend container on Cloud Run, Render, Railway, or AWS.
2. Set the environment variable `VITE_API_BASE_URL` in Vercel to point to your hosted backend URL (e.g. `https://api.blazefinix.org`).
3. BlazeFinix frontend will automatically connect to the hosted backend and enable **REAL MODE**.
