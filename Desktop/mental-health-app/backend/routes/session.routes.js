// const express = require('express');
// const { authenticate, authorize } = require('../middleware/auth.middleware');
// const Session = require('../models/session.model');
// const User = require('../models/user.model');

// const router = express.Router();

// // Create a new session
// router.post('/', authenticate, async (req, res, next) => {
//   try {
//     const { therapistId, scheduledTime, duration, sessionType } = req.body;

//     // Check if therapist exists and is available
//     const therapist = await User.findOne({ 
//       _id: therapistId, 
//       role: 'therapist',
//       isActive: true,
//       'therapistDetails.isAvailable': true
//     });

//     if (!therapist) {
//       return res.status(404).json({
//         success: false,
//         message: 'Therapist not found or unavailable'
//       });
//     }

//     // Check if time slot is available
//     const conflictingSession = await Session.findOne({
//       therapist: therapistId,
//       scheduledTime: {
//         $gte: new Date(scheduledTime),
//         $lt: new Date(new Date(scheduledTime).getTime() + duration * 60000)
//       },
//       status: { $in: ['scheduled', 'ongoing'] }
//     });

//     if (conflictingSession) {
//       return res.status(400).json({
//         success: false,
//         message: 'This time slot is already booked'
//       });
//     }

//     // Create session
//     const session = new Session({
//       patient: req.userId,
//       therapist: therapistId,
//       scheduledTime,
//       duration,
//       sessionType
//     });

//     await session.save();

//     // Generate meeting link (using Agora)
//     const { generateAgoraToken } = require('../utils/agora');
//     const channelName = `session-${session._id}`;
//     const token = generateAgoraToken(channelName);

//     session.meetingDetails = {
//       channel: channelName,
//       token
//     };

//     await session.save();

//     res.status(201).json({
//       success: true,
//       message: 'Session scheduled successfully',
//       session
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// // Get user's sessions
// router.get('/my-sessions', authenticate, async (req, res, next) => {
//   try {
//     const { status, startDate, endDate, page = 1, limit = 10 } = req.query;

//     const query = req.userRole === 'patient' 
//       ? { patient: req.userId }
//       : { therapist: req.userId };

//     if (status) query.status = status;
//     if (startDate || endDate) {
//       query.scheduledTime = {};
//       if (startDate) query.scheduledTime.$gte = new Date(startDate);
//       if (endDate) query.scheduledTime.$lte = new Date(endDate);
//     }

//     const sessions = await Session.find(query)
//       .populate('patient', 'profile.firstName profile.lastName profile.profilePicture')
//       .populate('therapist', 'profile.firstName profile.lastName profile.profilePicture therapistDetails.specialization')
//       .limit(limit * 1)
//       .skip((page - 1) * limit)
//       .sort({ scheduledTime: -1 });

//     const total = await Session.countDocuments(query);

//     res.json({
//       success: true,
//       sessions,
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

// // Get session by ID
// router.get('/:id', authenticate, async (req, res, next) => {
//   try {
//     const session = await Session.findById(req.params.id)
//       .populate('patient', 'profile.firstName profile.lastName profile.profilePicture email')
//       .populate('therapist', 'profile.firstName profile.lastName profile.profilePicture email therapistDetails');

//     if (!session) {
//       return res.status(404).json({
//         success: false,
//         message: 'Session not found'
//       });
//     }

//     // Check if user is part of the session
//     if (session.patient._id.toString() !== req.userId && 
//         session.therapist._id.toString() !== req.userId &&
//         req.userRole !== 'admin') {
//       return res.status(403).json({
//         success: false,
//         message: 'You are not authorized to view this session'
//       });
//     }

//     res.json({
//       success: true,
//       session
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// // Update session status
// router.patch('/:id/status', authenticate, async (req, res, next) => {
//   try {
//     const { status } = req.body;
//     const session = await Session.findById(req.params.id);

//     if (!session) {
//       return res.status(404).json({
//         success: false,
//         message: 'Session not found'
//       });
//     }

//     // Check if user is part of the session
//     if (session.patient.toString() !== req.userId && 
//         session.therapist.toString() !== req.userId) {
//       return res.status(403).json({
//         success: false,
//         message: 'You are not authorized to update this session'
//       });
//     }

//     // Validate status transitions
//     const validTransitions = {
//       'scheduled': ['ongoing', 'cancelled', 'rescheduled'],
//       'ongoing': ['completed'],
//       'completed': [],
//       'cancelled': [],
//       'no-show': []
//     };

//     if (!validTransitions[session.status]?.includes(status)) {
//       return res.status(400).json({
//         success: false,
//         message: `Cannot transition from ${session.status} to ${status}`
//       });
//     }

//     session.status = status;
//     await session.save();

//     res.json({
//       success: true,
//       message: 'Session status updated',
//       session
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// // Add session notes
// router.post('/:id/notes', authenticate, async (req, res, next) => {
//   try {
//     const { content, type } = req.body; // type: 'therapist' or 'patient'
//     const session = await Session.findById(req.params.id);

//     if (!session) {
//       return res.status(404).json({
//         success: false,
//         message: 'Session not found'
//       });
//     }

//     // Check authorization
//     if (type === 'therapist' && session.therapist.toString() !== req.userId) {
//       return res.status(403).json({
//         success: false,
//         message: 'Only the therapist can add therapist notes'
//       });
//     }

//     if (type === 'patient' && session.patient.toString() !== req.userId) {
//       return res.status(403).json({
//         success: false,
//         message: 'Only the patient can add patient notes'
//       });
//     }

//     session.notes[type] = {
//       content,
//       lastUpdated: new Date()
//     };

//     await session.save();

//     res.json({
//       success: true,
//       message: 'Notes added successfully',
//       notes: session.notes
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// // Rate session
// router.post('/:id/rate', authenticate, async (req, res, next) => {
//   try {
//     const { score, feedback } = req.body;
//     const session = await Session.findById(req.params.id);

//     if (!session) {
//       return res.status(404).json({
//         success: false,
//         message: 'Session not found'
//       });
//     }

//     // Only patient can rate, and only after session is completed
//     if (session.patient.toString() !== req.userId) {
//       return res.status(403).json({
//         success: false,
//         message: 'Only the patient can rate the session'
//       });
//     }

//     if (session.status !== 'completed') {
//       return res.status(400).json({
//         success: false,
//         message: 'Cannot rate a session that is not completed'
//       });
//     }

//     if (session.rating && session.rating.submittedAt) {
//       return res.status(400).json({
//         success: false,
//         message: 'Session already rated'
//       });
//     }

//     session.rating = {
//       score,
//       feedback,
//       submittedAt: new Date()
//     };

//     await session.save();

//     // Update therapist's average rating
//     const therapistSessions = await Session.find({
//       therapist: session.therapist,
//       status: 'completed',
//       'rating.score': { $exists: true }
//     });

//     const avgRating = therapistSessions.reduce((acc, s) => acc + s.rating.score, 0) / therapistSessions.length;

//     await User.findByIdAndUpdate(session.therapist, {
//       'therapistDetails.averageRating': avgRating,
//       'therapistDetails.totalSessions': therapistSessions.length
//     });

//     res.json({
//       success: true,
//       message: 'Rating submitted successfully',
//       rating: session.rating
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// module.exports = router;
const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const Session = require('../models/session.model');
const User = require('../models/user.model');

const router = express.Router();

// Create a new session
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { therapistId, scheduledTime, duration, sessionType } = req.body;

    // Check if therapist exists and is available
    const therapist = await User.findOne({ 
      _id: therapistId, 
      role: 'therapist',
      isActive: true,
      'therapistDetails.isAvailable': true
    });

    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found or unavailable'
      });
    }

    // Check if time slot is available
    const conflictingSession = await Session.findOne({
      therapist: therapistId,
      scheduledTime: {
        $gte: new Date(scheduledTime),
        $lt: new Date(new Date(scheduledTime).getTime() + duration * 60000)
      },
      status: { $in: ['scheduled', 'ongoing'] }
    });

    if (conflictingSession) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }

    // Create session
    const session = new Session({
      patient: req.userId,
      therapist: therapistId,
      scheduledTime,
      duration,
      sessionType
    });

    await session.save();

    // Generate meeting link (using Agora)
    try {
      const { generateAgoraToken } = require('../utils/agora');
      const channelName = `session-${session._id}`;
      const token = generateAgoraToken(channelName);

      session.meetingDetails = {
        channel: channelName,
        token
      };

      await session.save();
    } catch (agoraError) {
      console.warn('Agora token generation failed:', agoraError.message);
      // Continue without token - will be generated when joining
    }

    res.status(201).json({
      success: true,
      message: 'Session scheduled successfully',
      session
    });
  } catch (error) {
    console.error('Error creating session:', error);
    next(error);
  }
});

// Get user's sessions
router.get('/my-sessions', authenticate, async (req, res, next) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 10, search, type } = req.query;

    const query = req.userRole === 'patient' 
      ? { patient: req.userId }
      : { therapist: req.userId };

    if (status) query.status = status;
    if (type) query.sessionType = type;
    
    if (startDate || endDate) {
      query.scheduledTime = {};
      if (startDate) query.scheduledTime.$gte = new Date(startDate);
      if (endDate) query.scheduledTime.$lte = new Date(endDate);
    }

    // Search by patient name (for therapists)
    if (search && req.userRole === 'therapist') {
      const patients = await User.find({
        role: 'patient',
        $or: [
          { 'profile.firstName': { $regex: search, $options: 'i' } },
          { 'profile.lastName': { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const patientIds = patients.map(p => p._id);
      if (patientIds.length > 0) {
        query.patient = { $in: patientIds };
      }
    }

    console.log('Session query:', JSON.stringify(query, null, 2));

    const sessions = await Session.find(query)
      .populate('patient', 'profile.firstName profile.lastName profile.profilePicture patientDetails.concerns')
      .populate('therapist', 'profile.firstName profile.lastName profile.profilePicture therapistDetails.specializations')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ scheduledTime: -1 });

    const total = await Session.countDocuments(query);

    res.json({
      success: true,
      sessions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    next(error);
  }
});

// Get session by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const session = await Session.findById(req.params.id)
      .populate('patient', 'profile.firstName profile.lastName profile.profilePicture email patientDetails')
      .populate('therapist', 'profile.firstName profile.lastName profile.profilePicture email therapistDetails');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user is part of the session
    const patientId = session.patient?._id?.toString() || session.patient?.toString();
    const therapistId = session.therapist?._id?.toString() || session.therapist?.toString();
    
    if (patientId !== req.userId && 
        therapistId !== req.userId &&
        req.userRole !== 'admin') {
      console.log('Authorization failed:', {
        userId: req.userId,
        patientId,
        therapistId,
        role: req.userRole
      });
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this session'
      });
    }

    res.json({
      success: true,
      session
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    next(error);
  }
});

// Update session status - FIXED VERSION
router.patch('/:id/status', authenticate, async (req, res, next) => {
  try {
    const { status, cancellationReason, rescheduledTime } = req.body;
    
    console.log('Updating session status:', {
      sessionId: req.params.id,
      requestedStatus: status,
      userId: req.userId,
      userRole: req.userRole
    });

    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    console.log('Found session:', {
      id: session._id,
      patient: session.patient?.toString(),
      therapist: session.therapist?.toString(),
      currentStatus: session.status
    });

    // Check if user is part of the session (with proper string conversion)
    const patientId = session.patient?.toString();
    const therapistId = session.therapist?.toString();
    const userId = req.userId?.toString();

    const isPatient = patientId === userId;
    const isTherapist = therapistId === userId;

    console.log('Authorization check:', {
      userId,
      patientId,
      therapistId,
      isPatient,
      isTherapist,
      userRole: req.userRole
    });

    if (!isPatient && !isTherapist && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this session'
      });
    }

    // Validate status transitions based on user role
    const validTransitions = {
      'scheduled': {
        'patient': ['cancelled'], // Patients can only cancel
        'therapist': ['ongoing', 'cancelled', 'rescheduled', 'no-show'], // Therapists can do more
        'admin': ['ongoing', 'cancelled', 'rescheduled', 'completed', 'no-show']
      },
      'ongoing': {
        'patient': [],
        'therapist': ['completed'],
        'admin': ['completed', 'cancelled']
      },
      'completed': {
        'patient': [],
        'therapist': [],
        'admin': []
      },
      'cancelled': {
        'patient': [],
        'therapist': [],
        'admin': []
      },
      'no-show': {
        'patient': [],
        'therapist': [],
        'admin': ['completed']
      },
      'rescheduled': {
        'patient': ['cancelled'],
        'therapist': ['cancelled'],
        'admin': ['cancelled', 'scheduled']
      }
    };

    const role = req.userRole === 'admin' ? 'admin' : (isTherapist ? 'therapist' : 'patient');
    const allowedTransitions = validTransitions[session.status]?.[role] || [];

    if (!allowedTransitions.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `As a ${role}, you cannot transition from ${session.status} to ${status}`
      });
    }

    // Update session based on status
    session.status = status;
    
    if (status === 'cancelled' && cancellationReason) {
      session.cancellationReason = cancellationReason;
    }
    
    if (status === 'rescheduled' && rescheduledTime) {
      session.rescheduledFrom = session._id;
      session.scheduledTime = new Date(rescheduledTime);
    }

    await session.save();

    console.log('Session status updated successfully');

    res.json({
      success: true,
      message: 'Session status updated successfully',
      session
    });
  } catch (error) {
    console.error('Error updating session status:', error);
    next(error);
  }
});

// Add session notes
router.post('/:id/notes', authenticate, async (req, res, next) => {
  try {
    const { content, type } = req.body; // type: 'therapist' or 'patient'
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check authorization
    const patientId = session.patient?.toString();
    const therapistId = session.therapist?.toString();
    const userId = req.userId?.toString();

    if (type === 'therapist' && therapistId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the therapist can add therapist notes'
      });
    }

    if (type === 'patient' && patientId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the patient can add patient notes'
      });
    }

    session.notes = session.notes || {};
    session.notes[type] = {
      content,
      lastUpdated: new Date()
    };

    await session.save();

    res.json({
      success: true,
      message: 'Notes added successfully',
      notes: session.notes
    });
  } catch (error) {
    console.error('Error adding notes:', error);
    next(error);
  }
});

// Rate session
router.post('/:id/rate', authenticate, async (req, res, next) => {
  try {
    const { score, feedback } = req.body;
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const patientId = session.patient?.toString();

    // Only patient can rate
    if (patientId !== req.userId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the patient can rate the session'
      });
    }

    if (session.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot rate a session that is not completed'
      });
    }

    if (session.rating && session.rating.submittedAt) {
      return res.status(400).json({
        success: false,
        message: 'Session already rated'
      });
    }

    session.rating = {
      score,
      feedback,
      submittedAt: new Date()
    };

    await session.save();

    // Update therapist's average rating
    const therapistSessions = await Session.find({
      therapist: session.therapist,
      status: 'completed',
      'rating.score': { $exists: true }
    });

    const avgRating = therapistSessions.length > 0 
      ? therapistSessions.reduce((acc, s) => acc + s.rating.score, 0) / therapistSessions.length 
      : 0;

    await User.findByIdAndUpdate(session.therapist, {
      'therapistDetails.averageRating': avgRating,
      'therapistDetails.totalSessions': therapistSessions.length,
      'therapistDetails.totalReviews': therapistSessions.length
    });

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      rating: session.rating
    });
  } catch (error) {
    console.error('Error rating session:', error);
    next(error);
  }
});

module.exports = router;