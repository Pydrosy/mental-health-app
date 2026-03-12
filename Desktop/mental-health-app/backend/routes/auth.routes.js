// const express = require('express');
// const { body, validationResult } = require('express-validator');
// const jwt = require('jsonwebtoken');
// const crypto = require('crypto');
// const User = require('../models/user.model');
// const { authenticate } = require('../middleware/auth.middleware');

// const router = express.Router();

// // Validation rules
// const validateSignup = [
//   body('email').isEmail().normalizeEmail(),
//   body('password').isLength({ min: 6 }),
//   body('role').isIn(['patient', 'therapist']),
//   body('profile.firstName').notEmpty(),
//   body('profile.lastName').notEmpty()
// ];

// const validateLogin = [
//   body('email').isEmail().normalizeEmail(),
//   body('password').notEmpty()
// ];

// // Signup - NO EMAIL VERIFICATION
// router.post('/signup', validateSignup, async (req, res, next) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         success: false,
//         errors: errors.array()
//       });
//     }

//     const { email, password, role, profile, patientDetails, therapistDetails } = req.body;

//     // Check if user exists
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         message: 'User already exists with this email'
//       });
//     }

//     // Create user (automatically verified for development)
//     const user = new User({
//       email,
//       password,
//       role,
//       profile,
//       patientDetails: role === 'patient' ? patientDetails : undefined,
//       therapistDetails: role === 'therapist' ? therapistDetails : undefined,
//       isEmailVerified: true // Auto-verify for development
//     });

//     await user.save();

//     // Generate JWT token
//     const token = jwt.sign(
//       { userId: user._id, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: process.env.JWT_EXPIRE || '7d' }
//     );

//     // NO EMAIL SENT - REMOVED COMPLETELY

//     res.status(201).json({
//       success: true,
//       message: 'User created successfully',
//       token,
//       user: {
//         id: user._id,
//         email: user.email,
//         role: user.role,
//         profile: user.profile,
//         isEmailVerified: user.isEmailVerified
//       }
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// // Login
// // Login
// router.post('/login', validateLogin, async (req, res, next) => {
//   try {
//     console.log('🔐 Login attempt started');
//     console.log('Request body:', req.body);
    
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       console.log('Validation errors:', errors.array());
//       return res.status(400).json({
//         success: false,
//         errors: errors.array()
//       });
//     }

//     const { email, password } = req.body;
//     console.log('Login attempt for email:', email);

//     // Find user with password
//     console.log('Querying database for user...');
//     const user = await User.findOne({ email }).select('+password');
//     console.log('Database query completed');

//     if (!user) {
//       console.log('User not found:', email);
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid email or password'
//       });
//     }

//     console.log('User found:', user.email);
//     console.log('User role:', user.role);
//     console.log('User ID:', user._id);
//     console.log('Comparing password...');

//     // Check password
//     const isMatch = await user.comparePassword(password);
//     console.log('Password comparison result:', isMatch);

//     if (!isMatch) {
//       console.log('Password mismatch for user:', email);
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid email or password'
//       });
//     }

//     console.log('Password matched, checking account status...');

//     if (!user.isActive) {
//       console.log('Account is deactivated for user:', email);
//       return res.status(401).json({
//         success: false,
//         message: 'Your account has been deactivated. Please contact support.'
//       });
//     }

//     console.log('Updating last login...');
//     // Update last login
//     user.lastLogin = new Date();
//     await user.save();
//     console.log('Last login updated');

//     console.log('Generating JWT token...');
//     // Generate token
//     const token = jwt.sign(
//       { userId: user._id, role: user.role },
//       process.env.JWT_SECRET || 'your-secret-key',
//       { expiresIn: '7d' }
//     );
//     console.log('Token generated successfully');

//     console.log('Login successful for user:', email);

//     res.json({
//       success: true,
//       token,
//       user: {
//         id: user._id,
//         email: user.email,
//         role: user.role,
//         profile: user.profile,
//         isEmailVerified: user.isEmailVerified,
//         ...(user.role === 'therapist' && { therapistDetails: user.therapistDetails }),
//         ...(user.role === 'patient' && { patientDetails: user.patientDetails })
//       }
//     });
//   } catch (error) {
//     console.error('❌ Login error details:');
//     console.error('Error name:', error.name);
//     console.error('Error message:', error.message);
//     console.error('Error stack:', error.stack);
//     next(error);
//   }
// });

// // Email verification endpoints - REMOVED/COMMENTED OUT
// // router.get('/verify-email/:token', ...) - REMOVED

// // Forgot password - KEPT but modified to not send email (for development)
// router.post('/forgot-password', [
//   body('email').isEmail().normalizeEmail()
// ], async (req, res, next) => {
//   try {
//     const { email } = req.body;

//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: 'No user found with this email'
//       });
//     }

//     // Generate reset token
//     const resetToken = crypto.randomBytes(32).toString('hex');
//     user.passwordResetToken = resetToken;
//     user.passwordResetExpires = Date.now() + 3600000; // 1 hour
//     await user.save();

//     // NO EMAIL SENT - Just return the token for development
//     res.json({
//       success: true,
//       message: 'Password reset token generated',
//       resetToken: resetToken, // Only for development! Remove in production
//       resetUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// // Reset password
// router.post('/reset-password/:token', [
//   body('password').isLength({ min: 6 })
// ], async (req, res, next) => {
//   try {
//     const { token } = req.params;
//     const { password } = req.body;

//     const user = await User.findOne({
//       passwordResetToken: token,
//       passwordResetExpires: { $gt: Date.now() }
//     });

//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid or expired reset token'
//       });
//     }

//     user.password = password;
//     user.passwordResetToken = undefined;
//     user.passwordResetExpires = undefined;
//     await user.save();

//     res.json({
//       success: true,
//       message: 'Password reset successful'
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// // Change password (authenticated)
// router.post('/change-password', [
//   authenticate,
//   body('currentPassword').notEmpty(),
//   body('newPassword').isLength({ min: 6 })
// ], async (req, res, next) => {
//   try {
//     const { currentPassword, newPassword } = req.body;

//     const user = await User.findById(req.userId).select('+password');

//     const isMatch = await user.comparePassword(currentPassword);
//     if (!isMatch) {
//       return res.status(400).json({
//         success: false,
//         message: 'Current password is incorrect'
//       });
//     }

//     user.password = newPassword;
//     await user.save();

//     res.json({
//       success: true,
//       message: 'Password changed successfully'
//     });
//   } catch (error) {
//     next(error);
//   }
// });

// // Get current user
// router.get('/me', authenticate, async (req, res) => {
//   res.json({
//     success: true,
//     user: req.user
//   });
// });

// module.exports = router;
const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user.model');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Validation rules
const validateSignup = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['patient', 'therapist']),
  body('profile.firstName').notEmpty(),
  body('profile.lastName').notEmpty()
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// Signup - NO EMAIL VERIFICATION
router.post('/signup', validateSignup, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password, role, profile, patientDetails, therapistDetails } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user (automatically verified for development)
    const user = new User({
      email,
      password,
      role,
      profile,
      patientDetails: role === 'patient' ? patientDetails : undefined,
      therapistDetails: role === 'therapist' ? therapistDetails : undefined,
      isEmailVerified: true // Auto-verify for development
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    next(error);
  }
});

// Login - FIXED VERSION with updateOne
router.post('/login', validateLogin, async (req, res, next) => {
  try {
    console.log('🔐 Login attempt started');
    console.log('Request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    console.log('Login attempt for email:', email);

    // Find user with password
    console.log('Querying database for user...');
    const user = await User.findOne({ email }).select('+password');
    console.log('Database query completed');

    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('User found:', user.email);
    console.log('User role:', user.role);
    console.log('User ID:', user._id);
    console.log('Comparing password...');

    // Check password
    const isMatch = await user.comparePassword(password);
    console.log('Password comparison result:', isMatch);

    if (!isMatch) {
      console.log('Password mismatch for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('Password matched, checking account status...');

    if (!user.isActive) {
      console.log('Account is deactivated for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    console.log('Updating last login...');
    // FIXED: Use updateOne instead of save() to avoid triggering pre-save hook
    await User.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );
    console.log('Last login updated');

    console.log('Generating JWT token...');
    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    console.log('Token generated successfully');

    console.log('Login successful for user:', email);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        isEmailVerified: user.isEmailVerified,
        ...(user.role === 'therapist' && { therapistDetails: user.therapistDetails }),
        ...(user.role === 'patient' && { patientDetails: user.patientDetails })
      }
    });
  } catch (error) {
    console.error('❌ Login error details:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    next(error);
  }
});

// Forgot password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    res.json({
      success: true,
      message: 'Password reset token generated',
      resetToken: resetToken, // Only for development! Remove in production
      resetUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`
    });
  } catch (error) {
    next(error);
  }
});

// Reset password
router.post('/reset-password/:token', [
  body('password').isLength({ min: 6 })
], async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    next(error);
  }
});

// Change password (authenticated)
router.post('/change-password', [
  authenticate,
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.userId).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

module.exports = router;