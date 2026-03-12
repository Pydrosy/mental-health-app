# Mental Health Application

A comprehensive mental health platform connecting patients with therapists using GNN-powered matching, real-time chat, and video consultations.

## 🚀 Features

- **User Authentication** - Secure signup/login for patients and therapists
- **Therapist Matching** - AI-powered recommendations using Graph Neural Networks
- **Session Booking** - Schedule and manage therapy sessions
- **Real-time Chat** - Secure messaging between patients and therapists
- **Video Calls** - Integrated video consultations using Agora SDK
- **Availability Management** - Therapists can set their available time slots
- **Ratings & Reviews** - Patients can rate their sessions
- **Dashboard** - Comprehensive dashboards for both patients and therapists

## 🛠️ Tech Stack

### Backend
- Node.js + Express
- MongoDB with Mongoose
- JWT Authentication
- Socket.io for real-time chat
- Agora SDK for video calls

### Frontend
- React.js
- Material-UI (MUI)
- Socket.io-client
- Chart.js for analytics
- React Router v6

### ML Service
- Python + FastAPI
- PyTorch + PyTorch Geometric
- Scikit-learn
- Pandas & NumPy

### DevOps
- Docker & Docker Compose
- Git for version control

## 📋 Prerequisites

- Node.js 18+ 
- Python 3.11+
- MongoDB (local or Atlas)
- Docker Desktop (optional, for containerized deployment)
- Agora account for video calls

## 🚦 Quick Start

### Option 1: Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd mental-health-app