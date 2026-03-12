const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const User = require('../models/user.model');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { role, page = 1, limit = 10, search } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { 'profile.firstName': { $regex: search, $options: 'i' } },
        { 'profile.lastName': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get user by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has permission to view this profile
    if (req.userRole !== 'admin' && req.userId !== req.params.id) {
      // For therapists viewing patients or vice versa, only show limited info
      if (req.userRole === 'patient' && user.role === 'therapist') {
        // Show therapist public info
        const publicInfo = {
          id: user._id,
          profile: {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            profilePicture: user.profile.profilePicture,
            bio: user.profile.bio
          },
          therapistDetails: {
            specialization: user.therapistDetails.specialization,
            yearsOfExperience: user.therapistDetails.yearsOfExperience,
            languages: user.therapistDetails.languages,
            sessionRate: user.therapistDetails.sessionRate,
            averageRating: user.therapistDetails.averageRating,
            isAvailable: user.therapistDetails.isAvailable
          }
        };
        return res.json({ success: true, user: publicInfo });
      }
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const updates = req.body;
    
    // Remove sensitive fields
    delete updates.password;
    delete updates.role;
    delete updates.isEmailVerified;
    delete updates.isActive;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
});

// Update user role specific details
router.put('/:role/details', authenticate, async (req, res, next) => {
  try {
    const { role } = req.params;
    
    if (role !== req.userRole) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role for update'
      });
    }

    const updateField = role === 'therapist' ? 'therapistDetails' : 'patientDetails';
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      { [updateField]: req.body },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: `${role} details updated successfully`,
      user
    });
  } catch (error) {
    next(error);
  }
});

// Delete user (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;