// const express = require('express');
// const { authenticate, authorize } = require('../middleware/auth.middleware');
// const User = require('../models/user.model');
// const Session = require('../models/session.model');

// const router = express.Router();

// // Get all therapists (public)
// router.get('/', async (req, res, next) => {
//   try {
//     const { 
//       specialization, 
//       minRating, 
//       maxRate, 
//       language,
//       availability,
//       page = 1, 
//       limit = 10 
//     } = req.query;

//     // Build query
//     const query = { 
//       role: 'therapist', 
//       isActive: true,
//       'therapistDetails.isAvailable': true 
//     };

//     if (specialization) {
//       query['therapistDetails.specialization'] = { $in: specialization.split(',') };
//     }

//     if (minRating) {
//       query['therapistDetails.averageRating'] = { $gte: parseFloat(minRating) };
//     }

//     if (maxRate) {
//       query['therapistDetails.sessionRate'] = { $lte: parseFloat(maxRate) };
//     }

//     if (language) {
//       query['therapistDetails.languages'] = { $in: language.split(',') };
//     }

//     // Get therapists
//     const therapists = await User.find(query)
//       .select('profile.firstName profile.lastName profile.profilePicture profile.bio therapistDetails')
//       .limit(limit * 1)
//       .skip((page - 1) * limit)
//       .sort({ 'therapistDetails.averageRating': -1 });

//     const total = await User.countDocuments(query);

//     res.json({
//       success: true,
//       therapists,
//       pagination: {
//         total,
//         page: parseInt(page),
//         pages: Math.ceil(total / limit)
//       }
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// // Get therapist by ID
// router.get('/:id', async (req, res, next) => {
//   try {
//     const therapist = await User.findOne({ 
//       _id: req.params.id, 
//       role: 'therapist',
//       isActive: true 
//     }).select('profile.firstName profile.lastName profile.profilePicture profile.bio therapistDetails email');

//     if (!therapist) {
//       return res.status(404).json({
//         success: false,
//         message: 'Therapist not found'
//       });
//     }

//     res.json({
//       success: true,
//       therapist
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// // Get therapist availability
// router.get('/:id/availability', async (req, res, next) => {
//   try {
//     const therapist = await User.findOne({ 
//       _id: req.params.id, 
//       role: 'therapist' 
//     }).select('therapistDetails.availability');

//     if (!therapist) {
//       return res.status(404).json({
//         success: false,
//         message: 'Therapist not found'
//       });
//     }

//     res.json({
//       success: true,
//       availability: therapist.therapistDetails.availability
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// // Update therapist availability (authenticated therapist only)
// router.put('/availability', authenticate, authorize('therapist'), async (req, res, next) => {
//   try {
//     const { availability } = req.body;

//     const therapist = await User.findByIdAndUpdate(
//       req.userId,
//       { 'therapistDetails.availability': availability },
//       { new: true }
//     ).select('therapistDetails.availability');

//     res.json({
//       success: true,
//       message: 'Availability updated successfully',
//       availability: therapist.therapistDetails.availability
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// // Get therapist reviews/ratings
// router.get('/:id/reviews', async (req, res, next) => {
//   try {
//     const { page = 1, limit = 10 } = req.query;

//     const sessions = await Session.find({
//       therapist: req.params.id,
//       status: 'completed',
//       'rating.score': { $exists: true }
//     })
//     .populate('patient', 'profile.firstName profile.lastName profile.profilePicture')
//     .limit(limit * 1)
//     .skip((page - 1) * limit)
//     .sort({ 'rating.submittedAt': -1 });

//     const total = await Session.countDocuments({
//       therapist: req.params.id,
//       status: 'completed',
//       'rating.score': { $exists: true }
//     });

//     // Calculate average rating
//     const avgRating = await Session.aggregate([
//       {
//         $match: {
//           therapist: req.params.id,
//           status: 'completed',
//           'rating.score': { $exists: true }
//         }
//       },
//       {
//         $group: {
//           _id: null,
//           average: { $avg: '$rating.score' },
//           total: { $sum: 1 }
//         }
//       }
//     ]);

//     res.json({
//       success: true,
//       reviews: sessions.map(s => ({
//         id: s._id,
//         patient: s.patient,
//         rating: s.rating.score,
//         feedback: s.rating.feedback,
//         date: s.rating.submittedAt
//       })),
//       statistics: {
//         averageRating: avgRating[0]?.average || 0,
//         totalReviews: avgRating[0]?.total || 0
//       },
//       pagination: {
//         total,
//         page: parseInt(page),
//         pages: Math.ceil(total / limit)
//       }
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// // Toggle therapist availability status
// router.patch('/toggle-availability', authenticate, authorize('therapist'), async (req, res, next) => {
//   try {
//     const { isAvailable } = req.body;

//     const therapist = await User.findByIdAndUpdate(
//       req.userId,
//       { 'therapistDetails.isAvailable': isAvailable },
//       { new: true }
//     ).select('therapistDetails.isAvailable');

//     res.json({
//       success: true,
//       message: `You are now ${isAvailable ? 'available' : 'unavailable'} for new sessions`,
//       isAvailable: therapist.therapistDetails.isAvailable
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// // Get therapist statistics
// router.get('/stats/dashboard', authenticate, authorize('therapist'), async (req, res, next) => {
//   try {
//     const now = new Date();
//     const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//     const startOfYear = new Date(now.getFullYear(), 0, 1);

//     // Get session statistics
//     const [
//       totalSessions,
//       completedSessions,
//       upcomingSessions,
//       monthlySessions,
//       yearlySessions,
//       averageRating
//     ] = await Promise.all([
//       Session.countDocuments({ therapist: req.userId }),
//       Session.countDocuments({ therapist: req.userId, status: 'completed' }),
//       Session.countDocuments({ 
//         therapist: req.userId, 
//         scheduledTime: { $gt: now },
//         status: 'scheduled'
//       }),
//       Session.countDocuments({ 
//         therapist: req.userId, 
//         createdAt: { $gte: startOfMonth }
//       }),
//       Session.countDocuments({ 
//         therapist: req.userId, 
//         createdAt: { $gte: startOfYear }
//       }),
//       Session.aggregate([
//         {
//           $match: {
//             therapist: req.userId,
//             status: 'completed',
//             'rating.score': { $exists: true }
//           }
//         },
//         {
//           $group: {
//             _id: null,
//             average: { $avg: '$rating.score' }
//           }
//         }
//       ])
//     ]);

//     res.json({
//       success: true,
//       statistics: {
//         totalSessions,
//         completedSessions,
//         upcomingSessions,
//         monthlySessions,
//         yearlySessions,
//         averageRating: averageRating[0]?.average || 0,
//         completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0
//       }
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// module.exports = router;

const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const User = require('../models/user.model');
const Session = require('../models/session.model');

const router = express.Router();

// Get all therapists (public)
router.get('/', async (req, res, next) => {
  try {
    const { 
      specialization, 
      minRating, 
      maxRate, 
      language,
      page = 1, 
      limit = 10 
    } = req.query;

    // Build query
    const query = { 
      role: 'therapist', 
      isActive: true,
      'therapistDetails.isAvailable': true 
    };

    if (specialization) {
      query['therapistDetails.specializations'] = { $in: specialization.split(',') };
    }

    if (minRating) {
      query['therapistDetails.averageRating'] = { $gte: parseFloat(minRating) };
    }

    if (maxRate) {
      query['therapistDetails.sessionRate'] = { $lte: parseFloat(maxRate) };
    }

    if (language) {
      query['therapistDetails.languages'] = { $in: language.split(',') };
    }

    // Get therapists
    const therapists = await User.find(query)
      .select('profile.firstName profile.lastName profile.profilePicture profile.bio therapistDetails')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ 'therapistDetails.averageRating': -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      therapists,
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

// Get therapist by ID
router.get('/:id', async (req, res, next) => {
  try {
    const therapist = await User.findOne({ 
      _id: req.params.id, 
      role: 'therapist',
      isActive: true 
    }).select('profile firstName lastName profilePicture bio email therapistDetails');

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found'
      });
    }

    res.json({
      success: true,
      therapist
    });
  } catch (error) {
    next(error);
  }
});

// Get therapist availability
router.get('/:id/availability', async (req, res, next) => {
  try {
    const therapist = await User.findOne({ 
      _id: req.params.id, 
      role: 'therapist' 
    }).select('therapistDetails.availability');

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found'
      });
    }

    res.json({
      success: true,
      availability: therapist.therapistDetails.availability || []
    });
  } catch (error) {
    next(error);
  }
});

// Update therapist availability (authenticated therapist only)
router.put('/availability', authenticate, authorize('therapist'), async (req, res, next) => {
  try {
    const { availability } = req.body;
    
    console.log('Updating availability for user:', req.userId);
    console.log('Availability data:', availability);

    if (!availability) {
      return res.status(400).json({
        success: false,
        message: 'Availability data is required'
      });
    }

    const therapist = await User.findByIdAndUpdate(
      req.userId,
      { 'therapistDetails.availability': availability },
      { new: true, runValidators: true }
    ).select('therapistDetails.availability');

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found'
      });
    }

    console.log('Availability updated successfully:', therapist.therapistDetails.availability);

    res.json({
      success: true,
      message: 'Availability updated successfully',
      availability: therapist.therapistDetails.availability
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    next(error);
  }
});

// Get therapist reviews/ratings
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const sessions = await Session.find({
      therapist: req.params.id,
      status: 'completed',
      'rating.score': { $exists: true }
    })
    .populate('patient', 'profile.firstName profile.lastName profile.profilePicture')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ 'rating.submittedAt': -1 });

    const total = await Session.countDocuments({
      therapist: req.params.id,
      status: 'completed',
      'rating.score': { $exists: true }
    });

    // Calculate average rating
    const avgRating = await Session.aggregate([
      {
        $match: {
          therapist: req.params.id,
          status: 'completed',
          'rating.score': { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          average: { $avg: '$rating.score' },
          total: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      reviews: sessions.map(s => ({
        id: s._id,
        patient: s.patient,
        rating: s.rating.score,
        feedback: s.rating.feedback,
        date: s.rating.submittedAt
      })),
      statistics: {
        averageRating: avgRating[0]?.average || 0,
        totalReviews: avgRating[0]?.total || 0
      },
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

// Toggle therapist availability status
router.patch('/toggle-availability', authenticate, authorize('therapist'), async (req, res, next) => {
  try {
    const { isAvailable } = req.body;

    const therapist = await User.findByIdAndUpdate(
      req.userId,
      { 'therapistDetails.isAvailable': isAvailable },
      { new: true }
    ).select('therapistDetails.isAvailable');

    res.json({
      success: true,
      message: `You are now ${isAvailable ? 'available' : 'unavailable'} for new sessions`,
      isAvailable: therapist.therapistDetails.isAvailable
    });
  } catch (error) {
    next(error);
  }
});

// Get therapist statistics
router.get('/stats/dashboard', authenticate, authorize('therapist'), async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get session statistics
    const [
      totalSessions,
      completedSessions,
      upcomingSessions,
      monthlySessions,
      yearlySessions,
      averageRating
    ] = await Promise.all([
      Session.countDocuments({ therapist: req.userId }),
      Session.countDocuments({ therapist: req.userId, status: 'completed' }),
      Session.countDocuments({ 
        therapist: req.userId, 
        scheduledTime: { $gt: now },
        status: 'scheduled'
      }),
      Session.countDocuments({ 
        therapist: req.userId, 
        createdAt: { $gte: startOfMonth }
      }),
      Session.countDocuments({ 
        therapist: req.userId, 
        createdAt: { $gte: startOfYear }
      }),
      Session.aggregate([
        {
          $match: {
            therapist: req.userId,
            status: 'completed',
            'rating.score': { $exists: true }
          }
        },
        {
          $group: {
            _id: null,
            average: { $avg: '$rating.score' }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      statistics: {
        totalSessions,
        completedSessions,
        upcomingSessions,
        monthlySessions,
        yearlySessions,
        averageRating: averageRating[0]?.average || 0,
        completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;