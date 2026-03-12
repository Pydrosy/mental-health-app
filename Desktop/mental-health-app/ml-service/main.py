# ml-service/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uvicorn
import numpy as np
import pandas as pd
from datetime import datetime
import os
from dotenv import load_dotenv
import random
import warnings
warnings.filterwarnings('ignore')

load_dotenv()

app = FastAPI(
    title="Mental Health GNN Matching Service",
    description="Therapist-patient matching (fallback mode)",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== Pydantic Models ====================
class PatientData(BaseModel):
    patient_id: str
    age: int
    gender: str
    concerns: List[str]
    previous_therapy: bool = False
    preferred_therapy_type: Optional[List[str]] = []
    insurance_provider: Optional[str] = None
    preferred_language: str = "English"

class RecommendationRequest(BaseModel):
    patient: PatientData
    top_k: int = Field(default=10, ge=1, le=50)

class RecommendationResponse(BaseModel):
    recommendations: List[Dict[str, Any]]
    patient_id: str
    timestamp: str
    source: str = "fallback"

# ==================== Matcher Class ====================
class TherapistMatcher:
    def __init__(self):
        self.is_trained = False
        print("Using fallback recommendation system")
        
    def generate_sample_therapists(self, num_therapists=20):
        """Generate sample therapists for testing"""
        therapists = []
        
        specializations_list = [
            ['cognitive-behavioral', 'anxiety', 'depression'],
            ['trauma-focused', 'emdr', 'ptsd'],
            ['mindfulness', 'stress', 'anxiety'],
            ['family-therapy', 'child-psychology'],
            ['couples-counseling', 'relationship'],
            ['addiction-counseling', 'cognitive-behavioral'],
            ['eating-disorders', 'self-esteem']
        ]
        
        languages_list = [
            ['English'], ['English', 'Spanish'], ['English', 'Mandarin'],
            ['English', 'French'], ['English', 'German']
        ]
        
        for i in range(num_therapists):
            therapist = {
                'therapist_id': f'therapist_{i+1}',
                'first_name': f'Therapist_{i+1}',
                'last_name': 'Smith',
                'specializations': random.choice(specializations_list),
                'years_experience': random.randint(3, 20),
                'languages': random.choice(languages_list),
                'session_rate': random.choice([100, 125, 150, 175, 200]),
                'accepts_insurance': random.choice([True, False]),
                'average_rating': round(random.uniform(3.5, 5.0), 1),
                'total_sessions': random.randint(50, 1000),
                'is_available': True
            }
            therapists.append(therapist)
        
        return pd.DataFrame(therapists)
    
    def recommend_therapists(self, patient_data, therapists_df, top_k=10):
        """Rule-based recommendations (fallback)"""
        print("Using fallback recommendation system...")
        
        patient_concerns = set(patient_data.get('concerns', []))
        scores = []
        
        for _, therapist in therapists_df.iterrows():
            score = 0
            therapist_dict = therapist.to_dict()
            
            # Specialization match (40%)
            therapist_specs = set(therapist_dict.get('specializations', []))
            common = patient_concerns.intersection(therapist_specs)
            if common:
                score += min(len(common) * 20, 40)
            
            # Experience (20%)
            exp = min(therapist_dict.get('years_experience', 0) / 20 * 20, 20)
            score += exp
            
            # Rating (20%)
            rating = therapist_dict.get('average_rating', 4.0) / 5 * 20
            score += rating
            
            # Language match (10%)
            if patient_data.get('preferred_language') in therapist_dict.get('languages', []):
                score += 10
            
            # Insurance (10%)
            if patient_data.get('insurance_provider') in therapist_dict.get('insurance_accepted', []):
                score += 10
            
            scores.append(score)
        
        top_indices = np.argsort(scores)[-top_k:][::-1]
        
        recommendations = []
        for idx in top_indices:
            therapist = therapists_df.iloc[idx].to_dict()
            recommendations.append({
                'therapist': {
                    'id': therapist.get('therapist_id', f'therapist_{idx}'),
                    'name': f"{therapist.get('first_name', 'Dr.')} {therapist.get('last_name', 'Therapist')}",
                    'specializations': therapist.get('specializations', []),
                    'experience': therapist.get('years_experience', 0),
                    'rating': therapist.get('average_rating', 4.0),
                    'session_rate': therapist.get('session_rate', 150),
                    'languages': therapist.get('languages', ['English']),
                    'accepts_insurance': therapist.get('accepts_insurance', False)
                },
                'match_score': round(scores[idx], 2),
                'explanation': self.generate_explanation(patient_data, therapist, scores[idx]/100)
            })
        
        return recommendations
    
    def generate_explanation(self, patient, therapist, score):
        """Generate human-readable explanation for the match"""
        explanations = []
        
        # Specialization match
        patient_concerns = set(patient.get('concerns', []))
        therapist_specs = set(therapist.get('specializations', []))
        
        matching_specs = patient_concerns.intersection(therapist_specs)
        if matching_specs:
            explanations.append(f"Specializes in: {', '.join(list(matching_specs)[:3])}")
        
        # Experience
        exp = therapist.get('years_experience', 0)
        if exp > 10:
            explanations.append(f"Extensive experience ({exp} years)")
        elif exp > 5:
            explanations.append(f"Experienced ({exp} years)")
        
        # Rating
        rating = therapist.get('average_rating', 0)
        if rating >= 4.5:
            explanations.append("Highly rated by patients")
        elif rating >= 4.0:
            explanations.append("Well rated")
        
        # Language
        if patient.get('preferred_language') in therapist.get('languages', []):
            explanations.append("Speaks your language")
        
        # Insurance
        if patient.get('insurance_provider') in therapist.get('insurance_accepted', []):
            explanations.append("Accepts your insurance")
        
        if not explanations:
            explanations.append("Good potential match")
        
        return explanations

# ==================== FastAPI Routes ====================

matcher = TherapistMatcher()

@app.get("/")
async def root():
    return {
        "service": "Mental Health Matching Service (Fallback Mode)",
        "version": "1.0.0",
        "status": "running",
        "model_trained": False,
        "note": "Running without PyTorch (fallback mode)"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "model_trained": False,
        "mode": "fallback"
    }

@app.post("/recommend", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """Get therapist recommendations for a patient (fallback mode)"""
    try:
        # Generate sample therapists
        therapists_df = matcher.generate_sample_therapists(num_therapists=20)
        
        # Get recommendations
        recommendations = matcher.recommend_therapists(
            request.patient.dict(),
            therapists_df,
            top_k=request.top_k
        )
        
        return RecommendationResponse(
            recommendations=recommendations,
            patient_id=request.patient.patient_id,
            timestamp=datetime.now().isoformat(),
            source="fallback"
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)