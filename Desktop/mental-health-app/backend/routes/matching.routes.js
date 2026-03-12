const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const User = require('../models/user.model');
const axios = require('axios');

const router = express.Router();

// Get therapist recommendations for a patient
router.get('/recommendations', authenticate, async (req, res, next) => {
  try {
    // Check if user is a patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only patients can get therapist recommendations'
      });
    }

    const { limit = 10 } = req.query;

    // Get patient data with full details
    const patient = await User.findById(req.userId);
    
    // Extract patient concerns
    const patientConcerns = patient.patientDetails?.concerns || [];
    
    if (patientConcerns.length === 0) {
      return res.json({
        success: true,
        recommendations: [],
        message: 'Please update your profile with concerns to get recommendations'
      });
    }

    // Try to get ML-based recommendations first
    try {
      // Prepare data for ML service
      const patientData = {
        patient_id: patient._id.toString(),
        age: patient.profile?.dateOfBirth ? 
          new Date().getFullYear() - new Date(patient.profile.dateOfBirth).getFullYear() : 30,
        gender: patient.profile?.gender || 'other',
        concerns: patientConcerns,
        previous_therapy: patient.patientDetails?.previousTherapy || false,
        preferred_therapy_type: patient.patientDetails?.preferredTherapyType || ['individual'],
        insurance_provider: patient.patientDetails?.insuranceProvider,
        preferred_language: patient.profile?.preferredLanguage || 'English'
      };

      // Call ML service
      const mlResponse = await axios.post('http://localhost:8001/recommend', {
        patient: patientData,
        top_k: parseInt(limit)
      }, { timeout: 5000 });

      // Format ML recommendations
      const recommendations = mlResponse.data.recommendations.map(rec => ({
        therapist: {
          id: rec.therapist.id,
          name: rec.therapist.name,
          specializations: rec.therapist.specializations,
          experience: rec.therapist.experience,
          rating: rec.therapist.rating,
          session_rate: rec.therapist.session_rate,
          languages: rec.therapist.languages,
          accepts_insurance: rec.therapist.accepts_insurance
        },
        match_score: rec.match_score,
        explanation: rec.explanation
      }));

      return res.json({
        success: true,
        recommendations,
        source: 'gnn'
      });

    } catch (mlError) {
      console.log('ML service unavailable, using fallback:', mlError.message);
      
      // Fallback: Get all available therapists
      const therapists = await User.find({
        role: 'therapist',
        isActive: true,
        'therapistDetails.isAvailable': true
      }).select('profile.firstName profile.lastName profile.profilePicture therapistDetails');

      // Calculate match scores
      const recommendations = therapists.map(therapist => {
        let score = 0;
        const reasons = [];
        
        // Specialization match (40 points)
        const therapistSpecs = therapist.therapistDetails?.specializations || [];
        const matchingSpecs = patientConcerns.filter(c => therapistSpecs.includes(c));
        if (matchingSpecs.length > 0) {
          score += Math.min(matchingSpecs.length * 20, 40);
          reasons.push(`Specializes in: ${matchingSpecs.slice(0, 3).join(', ')}`);
        }

        // Experience (20 points)
        const experience = therapist.therapistDetails?.yearsExperience || 0;
        if (experience > 10) {
          score += 20;
          reasons.push(`Extensive experience (${experience} years)`);
        } else if (experience > 5) {
          score += 15;
          reasons.push(`Experienced (${experience} years)`);
        } else if (experience > 2) {
          score += 10;
          reasons.push(`${experience} years experience`);
        }

        // Rating (20 points)
        const rating = therapist.therapistDetails?.averageRating || 0;
        if (rating >= 4.5) {
          score += 20;
          reasons.push('Highly rated by patients');
        } else if (rating >= 4.0) {
          score += 15;
          reasons.push('Well rated');
        } else if (rating >= 3.5) {
          score += 10;
          reasons.push('Good rating');
        }

        // Language match (10 points)
        if (patient.profile?.preferredLanguage && 
            therapist.therapistDetails?.languages?.includes(patient.profile.preferredLanguage)) {
          score += 10;
          reasons.push('Speaks your language');
        }

        // Insurance (10 points)
        if (patient.patientDetails?.insuranceProvider && 
            therapist.therapistDetails?.insuranceAccepted?.includes(patient.patientDetails.insuranceProvider)) {
          score += 10;
          reasons.push('Accepts your insurance');
        }

        // Always add at least one reason
        if (reasons.length === 0) {
          reasons.push('Available therapist');
        }

        return {
          therapist: {
            id: therapist._id,
            name: `${therapist.profile.firstName} ${therapist.profile.lastName}`,
            specializations: therapist.therapistDetails?.specializations || [],
            experience: therapist.therapistDetails?.yearsExperience || 0,
            rating: therapist.therapistDetails?.averageRating || 0,
            session_rate: therapist.therapistDetails?.sessionRate || 0,
            languages: therapist.therapistDetails?.languages || ['English'],
            accepts_insurance: therapist.therapistDetails?.acceptsInsurance || false
          },
          match_score: Math.min(Math.round(score), 100),
          explanation: reasons
        };
      });

      // Sort by score and return top k
      recommendations.sort((a, b) => b.match_score - a.match_score);
      
      return res.json({
        success: true,
        recommendations: recommendations.slice(0, parseInt(limit)),
        source: 'fallback'
      });
    }
  } catch (error) {
    next(error);
  }
});

// Optional: Add a direct GNN endpoint for testing
router.get('/gnn-recommendations', authenticate, async (req, res, next) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Only patients can get therapist recommendations'
      });
    }

    const { limit = 10 } = req.query;
    const patient = await User.findById(req.userId);

    const patientData = {
      patient_id: patient._id.toString(),
      age: patient.profile?.dateOfBirth ? 
        new Date().getFullYear() - new Date(patient.profile.dateOfBirth).getFullYear() : 30,
      gender: patient.profile?.gender || 'other',
      concerns: patient.patientDetails?.concerns || [],
      previous_therapy: patient.patientDetails?.previousTherapy || false,
      preferred_language: patient.profile?.preferredLanguage || 'English'
    };

    const mlResponse = await axios.post('http://localhost:8001/recommend', {
      patient: patientData,
      top_k: parseInt(limit)
    });

    res.json({
      success: true,
      recommendations: mlResponse.data.recommendations,
      source: 'gnn-direct'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: 'ML service unavailable'
    });
  }
});

module.exports = router;