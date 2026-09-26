import sys
from fastapi.testclient import TestClient
from app.backend.main import app

def test_real_backend():
    client = TestClient(app)
    
    # 1. Capabilities endpoint
    res_caps = client.get("/api/capabilities")
    print("Capabilities Status:", res_caps.status_code)
    print("Capabilities Payload:", res_caps.json())
    assert res_caps.status_code == 200
    assert res_caps.json()["mode"] == "real"
    
    # 2. Health endpoint
    res_health = client.get("/api/health")
    print("Health Status:", res_health.status_code)
    print("Health Payload:", res_health.json())
    assert res_health.status_code == 200
    
    # 3. Real prediction endpoint
    pred_payload = {
        "features": {
            "age": 62.0,
            "sex": 1.0,
            "systolic_bp": 154.0,
            "diastolic_bp": 96.0,
            "fasting_glucose": 146.0,
            "hba1c": 7.4,
            "total_cholesterol": 248.0,
            "hdl_cholesterol": 38.0,
            "ldl_cholesterol": 165.0,
            "triglycerides": 225.0,
            "bmi": 31.8,
            "resting_heart_rate": 82.0,
            "smoking_status": 1.0,
            "physical_activity_hours": 0.5,
            "family_history_cad": 1.0,
            "hs_crp": 4.2,
            "egfr": 68.0
        },
        "record_id": "TEST-REAL-001",
        "qubits": 4,
        "shots": 512
    }
    res_pred = client.post("/api/predict", json=pred_payload)
    print("Predict Status:", res_pred.status_code)
    pred_data = res_pred.json()
    print("Predict Hybrid Risk:", pred_data.get("hybrid_risk"))
    assert res_pred.status_code == 200
    assert "hybrid_risk" in pred_data
    
    print("LOCAL REAL MODE BACKEND VERIFICATION SUCCESSFUL!")

if __name__ == "__main__":
    test_real_backend()
