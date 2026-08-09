# 🌱 PlantBot AI: Enterprise Agricultural AI Platform

**PlantBot AI** is a complete, commercial-grade plant disease detection web application that combines computer vision deep learning for leaf image diagnosis with **Google Gemini 3.6 Flash** and local **Ollama Gemma 3** generative AI for dynamic agronomic care advice and multilingual support.

---

## 🏗️ Architecture Overview

```
React Frontend (Vite + Tailwind + Framer Motion)
       │
       │ HTTP / REST API (http://localhost:8000)
       ▼
FastAPI Backend Middleware
       │
       ├── 📸 TensorFlow Plant Disease Classifier (MobileNetV2 / EfficientNetB0)
       │
       ├── ⚡ Google Gemini 3.6 Flash Vision & Agronomy API (Primary AI)
       │
       ├── 🤖 Ollama API Middleware (Local Fallback: http://localhost:11434/api/chat)
       │
       └── 🗄️ SQLite Database (Users, Predictions, Diseases, Chat Messages)
```

---

## ✨ Core Features

- 📸 **Live Webcam & File Upload Detection**: Upload photos or scan live leaves directly via webcam.
- ⚡ **Google Gemini 3.6 Flash AI**: Instant, 100% reliable disease identification, symptoms, causes, organic treatments & care tips.
- 🎙️ **Voice Chat Dictation**: Speech-to-text integration for effortless AI Q&A in the chat workspace.
- 🌐 **Multilingual Support**: Supports English, Bengali (বাংলা), Spanish, French, Hindi, Japanese and more.
- 📄 **Diagnostic PDF Export**: 1-click downloadable diagnostic PDF report for farmers and agronomists.
- 📊 **Analytics Dashboard**: Real-time disease tracking, scan metrics, and crop statistics.
- 🔐 **OAuth 2.0 & Google One Tap Sign-In**: Secure user authentication with JWT token management.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, JavaScript (JSX), Tailwind CSS, Framer Motion, Lucide React Icons, Axios, React Router v6, Recharts, html2canvas, jspdf.
- **Backend**: Python 3.11+, FastAPI, Uvicorn, TensorFlow / Keras, Pillow / OpenCV, SQLAlchemy, SQLite, JWT Authentication (`passlib` + `bcrypt`).
- **AI Models**: Google Gemini 3.6 Flash (`google-genai` SDK) & Ollama Gemma 3 (`gemma3`).

---

## ⚙️ Quick Start Guide

### 1. Backend Setup

```bash
cd backend
python -m venv .venv
# On Windows PowerShell:
.\.venv\Scripts\activate

pip install -r requirements.txt
```

Create a `.env` file inside `backend/` with your credentials:
```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
GEMINI_MODEL=gemini-3.6-flash
SECRET_KEY=YOUR_SUPER_SECRET_JWT_KEY
```

Start the backend server:
```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
FastAPI server will run at: `http://localhost:8000` (API Docs: `http://localhost:8000/docs`).

---

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
React web app will open at: `http://localhost:5173`.

---

## 📡 API Endpoints Reference

### Authentication
- `POST /auth/register` - Register user account
- `POST /auth/login` - Authenticate credentials & return JWT
- `GET /auth/me` - Fetch active user profile

### Disease Detection Engine
- `POST /predict` - Upload leaf image -> Runs TensorFlow classification + Gemini 3.6 Flash / Ollama explanation
- `GET /predictions` - Retrieve prediction history
- `DELETE /predictions/{id}` - Remove prediction record

### AI Chatbot
- `POST /chat` - Send user message to Gemma 3 / Gemini 3.6 Flash with context

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for details.
