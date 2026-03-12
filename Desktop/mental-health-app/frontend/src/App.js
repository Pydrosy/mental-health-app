import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import PrivateRoute from './components/common/PrivateRoute';

// Layout Components
import Layout from './components/layout/Layout';

// Auth Pages
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import SignupPatient from './components/auth/SignupPatient';
import SignupTherapist from './components/auth/SignupTherapist';

// Patient Pages
import PatientDashboard from './components/patient/PatientDashboard';
import TherapistMatching from './components/patient/TherapistMatching';
import BookSession from './components/patient/BookSession';
import MySessions from './components/patient/MySessions';
import Chat from './components/common/Chat';

// Therapist Pages
import TherapistDashboard from './components/therapist/TherapistDashboard';
import TherapistProfile from './components/therapist/TherapistProfile';
import Availability from './components/therapist/Availability';
import UpcomingSessions from './components/therapist/UpcomingSessions';

// Common Pages
import Profile from './components/common/Profile';
// import VideoCall from './components/common/VideoCall';
import VideoCallSimple from './components/common/VideoCallSimple';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/signup/patient" element={<SignupPatient />} />
          <Route path="/signup/therapist" element={<SignupTherapist />} />
          
          {/* Protected Routes */}
          <Route path="/" element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }>
            {/* Patient Routes */}
            <Route index element={<PatientDashboard />} />
            <Route path="matching" element={<TherapistMatching />} />
            <Route path="book-session/:therapistId" element={<BookSession />} />
            <Route path="my-sessions" element={<MySessions />} />
            
            {/* Therapist Routes */}
            <Route path="therapist/dashboard" element={<TherapistDashboard />} />
            <Route path="therapist/profile" element={<TherapistProfile />} />
            <Route path="therapist/availability" element={<Availability />} />
            <Route path="therapist/sessions" element={<UpcomingSessions />} />
            
            {/* Common Routes */}
            <Route path="profile" element={<Profile />} />
            <Route path="chat/:userId?" element={<Chat />} />
           <Route path="video-call/:sessionId" element={<VideoCallSimple />} />
          </Route>
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;