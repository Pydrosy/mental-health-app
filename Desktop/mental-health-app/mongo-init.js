// mongo-init.js
// This script runs when MongoDB container is first created

// Switch to mental-health database
db = db.getSiblingDB('mental-health');

print("=== Initializing MongoDB for Mental Health App ===");

// Create collections
print("Creating collections...");
db.createCollection('users');
db.createCollection('sessions');
db.createCollection('messages');
print("✅ Collections created");

// Create indexes for better performance
print("Creating indexes...");

// Users collection indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ isActive: 1 });
db.users.createIndex({ 'therapistDetails.specializations': 1 });
db.users.createIndex({ 'therapistDetails.averageRating': -1 });
print("✅ User indexes created");

// Sessions collection indexes
db.sessions.createIndex({ patient: 1, scheduledTime: -1 });
db.sessions.createIndex({ therapist: 1, scheduledTime: -1 });
db.sessions.createIndex({ status: 1 });
db.sessions.createIndex({ scheduledTime: 1 });
print("✅ Session indexes created");

// Messages collection indexes
db.messages.createIndex({ sender: 1, recipient: 1, createdAt: -1 });
db.messages.createIndex({ recipient: 1, read: 1 });
print("✅ Message indexes created");

// Create a test admin user (optional - for development)
// Note: The password is 'Admin@123' hashed with bcrypt
print("Creating admin user...");

// You need to generate a proper bcrypt hash for your password
// For testing, you can use this hash for password 'Admin@123'
const adminUser = {
  email: 'admin@example.com',
  password: '$2a$10$YourHashedPasswordHere', // Replace with actual bcrypt hash
  role: 'admin',
  profile: {
    firstName: 'Admin',
    lastName: 'User',
    bio: 'System Administrator'
  },
  isEmailVerified: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Check if admin already exists
const existingAdmin = db.users.findOne({ email: 'admin@example.com' });
if (!existingAdmin) {
  db.users.insertOne(adminUser);
  print("✅ Admin user created");
} else {
  print("⚠️ Admin user already exists");
}

// Create sample data for testing (optional)
print("Creating sample data for testing...");

// Sample patient
const samplePatient = {
  email: 'patient@example.com',
  password: '$2a$10$YourHashedPasswordHere', // Replace with actual hash for 'password123'
  role: 'patient',
  profile: {
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: new Date('1990-01-15'),
    gender: 'male',
    phoneNumber: '+1234567890',
    bio: 'Looking for therapy'
  },
  patientDetails: {
    concerns: ['anxiety', 'stress'],
    therapyGoals: ['Reduce anxiety', 'Better stress management'],
    preferredTherapyType: ['individual'],
    previousTherapy: false
  },
  isEmailVerified: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Sample therapist
const sampleTherapist = {
  email: 'therapist@example.com',
  password: '$2a$10$YourHashedPasswordHere', // Replace with actual hash for 'Therapist@123'
  role: 'therapist',
  profile: {
    firstName: 'Sarah',
    lastName: 'Johnson',
    bio: 'Licensed therapist specializing in CBT'
  },
  therapistDetails: {
    specializations: ['cognitive-behavioral', 'anxiety', 'depression'],
    licenseNumber: 'LIC123456',
    licenseType: 'LCSW',
    licenseExpiry: new Date('2025-12-31'),
    yearsExperience: 8,
    languages: ['English', 'Spanish'],
    sessionRate: 150,
    acceptsInsurance: true,
    insuranceAccepted: ['Blue Cross', 'Aetna'],
    isAvailable: true,
    availability: [
      {
        day: 'Monday',
        slots: [
          { startTime: '09:00', endTime: '12:00', isBooked: false },
          { startTime: '14:00', endTime: '17:00', isBooked: false }
        ]
      },
      {
        day: 'Wednesday',
        slots: [
          { startTime: '10:00', endTime: '15:00', isBooked: false }
        ]
      }
    ]
  },
  isEmailVerified: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Insert sample data if it doesn't exist
if (!db.users.findOne({ email: 'patient@example.com' })) {
  db.users.insertOne(samplePatient);
  print("✅ Sample patient created");
}

if (!db.users.findOne({ email: 'therapist@example.com' })) {
  db.users.insertOne(sampleTherapist);
  print("✅ Sample therapist created");
}

print("=== MongoDB Initialization Complete ===");