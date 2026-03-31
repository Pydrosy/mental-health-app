# 🧠 Mental Health Connect

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-18.x-brightgreen)
![React](https://img.shields.io/badge/react-18.x-61DAFB)
![Python](https://img.shields.io/badge/python-3.11-3776AB)
![Docker](https://img.shields.io/badge/docker-ready-2496ED)

**A comprehensive mental health platform connecting patients with therapists using AI-powered matching, real-time chat, and video consultations.**

[Key Features](#key-features) •
[Tech Stack](#tech-stack) •
[Quick Start](#quick-start) •
[Documentation](#documentation) •
[Contributing](#contributing)

</div>

## 📸 Screenshots

<div align="center">
<img width="928" height="410" alt="mental h1" src="https://github.com/user-attachments/assets/e4d29295-8a00-4661-99c9-2a38cf965ef4" />
<img width="917" height="404" alt="mental h2" src="https://github.com/user-attachments/assets/c1a94c7b-2b46-4727-96ac-4187cae31e32" />

</div>

> **Note**: 

## ✨ Key Features

### For Patients 👤
- 🔍 **Smart Therapist Matching** - AI-powered recommendations using Graph Neural Networks
- 📅 **Easy Session Booking** - Schedule appointments with available time slots
- 💬 **Real-time Chat** - Secure messaging with therapists
- 📹 **Video Consultations** - Face-to-face sessions via Agora SDK
- 📊 **Progress Tracking** - View session history and ratings
- ❤️ **Favorite Therapists** - Save preferred therapists for quick booking

### For Therapists 👨‍⚕️
- 📋 **Professional Profile** - Showcase specializations, experience, and credentials
- ⏰ **Availability Management** - Set and manage your schedule
- 📈 **Practice Dashboard** - Track sessions, earnings, and patient feedback
- 💬 **Secure Communication** - Chat and video calls with patients
- 📝 **Session Notes** - Keep private notes about each session

### Platform Features 🚀
- 🔐 **Secure Authentication** - JWT-based authentication
- 🎯 **GNN-Powered Matching** - Advanced recommendation algorithm
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🌐 **Real-time Updates** - Instant messaging and notifications
- 🐳 **Docker Support** - Easy deployment with containers

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js + Express** | REST API server |
| **MongoDB + Mongoose** | Database and ODM |
| **Socket.io** | Real-time chat |
| **JWT** | Authentication |
| **Agora SDK** | Video calls |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React.js** | UI library |
| **Material-UI (MUI)** | Component library |
| **Socket.io-client** | Real-time communication |
| **React Router v6** | Navigation |
| **Chart.js** | Analytics dashboard |
| **date-fns** | Date manipulation |

### ML Service
| Technology | Purpose |
|------------|---------|
| **Python 3.11** | Core language |
| **FastAPI** | API framework |
| **PyTorch Geometric** | Graph Neural Networks |
| **scikit-learn** | ML utilities |
| **pandas/NumPy** | Data processing |

### DevOps
| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Multi-container orchestration |
| **Git** | Version control |

## 📋 Prerequisites

Before you begin, ensure you have installed:

- **Node.js** 18.x or higher → [Download](https://nodejs.org)
- **Python** 3.11 or higher → [Download](https://python.org)
- **MongoDB** 6.0 or higher → [Download](https://mongodb.com)
- **Docker Desktop** (optional) → [Download](https://docker.com)
- **Git** → [Download](https://git-scm.com)

## 🚀 Quick Start

### Option 1: Local Development

#### 1. Clone the repository
```bash
git clone https://github.com/Pydrosy/mental-health-app.git
cd mental-health-app
