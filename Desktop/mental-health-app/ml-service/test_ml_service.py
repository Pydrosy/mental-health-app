import requests
import json
import time

BASE_URL = "http://localhost:8001"

def test_service():
    print("🧪 Testing GNN ML Service")
    print("=" * 50)
    
    # Test health
    print("\n1️⃣ Health Check")
    response = requests.get(f"{BASE_URL}/health")
    print(f"   Status: {response.json()['status']}")
    print(f"   Model trained: {response.json()['model_trained']}")
    
    # Train model
    print("\n2️⃣ Training Model")
    train_data = {
        "use_sample_data": True,
        "epochs": 50,
        "learning_rate": 0.001
    }
    response = requests.post(f"{BASE_URL}/train", json=train_data)
    print(f"   {response.json()['message']}")
    
    # Test recommendations
    print("\n3️⃣ Getting Recommendations")
    patient_data = {
        "patient_id": "test_patient_1",
        "age": 32,
        "gender": "female",
        "concerns": ["anxiety", "stress", "insomnia"],
        "previous_therapy": True,
        "preferred_therapy_type": ["individual"],
        "insurance_provider": "Blue Cross",
        "preferred_language": "English"
    }
    
    request_data = {
        "patient": patient_data,
        "top_k": 5
    }
    
    response = requests.post(f"{BASE_URL}/recommend", json=request_data)
    recommendations = response.json()
    
    print(f"   Got {len(recommendations['recommendations'])} recommendations")
    for i, rec in enumerate(recommendations['recommendations'], 1):
        print(f"\n   #{i} - {rec['therapist']['name']} - Match: {rec['match_score']}%")
        for reason in rec['explanation']:
            print(f"       • {reason}")

if __name__ == "__main__":
    test_service()