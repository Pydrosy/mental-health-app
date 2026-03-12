const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  therapist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    default: 50, // minutes
    enum: [30, 50, 80]
  },
  status: {
    type: String,
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled', 'no-show', 'rescheduled'],
    default: 'scheduled'
  },
  sessionType: {
    type: String,
    enum: ['video', 'audio', 'chat'],
    default: 'video'
  },
  meetingDetails: {
    channel: String,
    token: String,
    startTime: Date,
    endTime: Date
  },
  notes: {
    therapist: {
      content: String,
      lastUpdated: Date
    },
    patient: {
      content: String,
      lastUpdated: Date
    }
  },
  rating: {
    score: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    submittedAt: Date
  },
  payment: {
    amount: Number,
    status: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending'
    },
    transactionId: String
  },
  cancellationReason: String,
  rescheduledFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
sessionSchema.index({ patient: 1, scheduledTime: -1 });
sessionSchema.index({ therapist: 1, scheduledTime: -1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ scheduledTime: 1 });

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;