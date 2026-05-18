# 🌱 AgriAI: AI Agriculture Monitoring System

AgriAI is a comprehensive full-stack platform designed to help farmers detect plant diseases, pests, and weeds in real-time. It leverages a custom-trained **YOLOv9** model for highly accurate vision detection, combined with a **FastAPI** backend and a responsive **React** frontend for a seamless user experience.

---

## ✨ Features
- **Real-Time Detection:** Live video and image upload analysis for detecting weeds, pests, and crop diseases.
- **High Accuracy:** Custom YOLOv9-C model trained on an extensive dataset.
- **Temporal Smoothing:** Robust frame-to-frame stabilization for live video feed analysis to eliminate flickering.
- **Smart Recommendations:** Integrated with AI for chatbot assistance and crop recommendations.
- **Weather Insights:** Real-time and 5-day weather forecasting using OpenWeather API.
- **Market Prices:** Live market price tracking for agricultural products.

### Model Details
- **Detects:** Weeds, Pests, and Diseases
- **Architecture:** YOLOv9-C (trained for 43 epochs)
- **Dataset:** 7,447 Train / 1,886 Validation / 1,407 Test Images
- **Performance:** mAP50: 0.88 | Precision: 0.91 | Recall: 0.84

---

## 📋 Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| **Python** | 3.9 – 3.11 | Backend runtime environment |
| **Node.js** | 18+ | Frontend runtime environment |
| **npm** | 9+ | Frontend package manager |
| **Git** | Any | Source version control |

> **Note:** A CUDA-capable GPU is recommended for faster YOLOv9 inference, but the system falls back to CPU automatically.

---

## 📁 Project Structure

```
Agri-bot-system/
├── backend/       # FastAPI server (port 8000)
│   ├── main.py
│   ├── routers/
│   ├── services/
│   ├── model_weights/   # agri_model.pt lives here
│   ├── requirements.txt
│   └── .env
└── frontend/      # React + Vite app (port 5173)
    ├── src/
    ├── package.json
    └── vite.config.js
```

---

## ⚙️ Installation & Setup
## agri-model.pt is in backend/model_weights/
## https://drive.google.com/file/d/1hhpO60KnXanw44JG71JczpJJMbrbVp7Z/view?usp=drive_link
### 1. Clone the Repository

```bash
git clone https://github.com/arifashraf717-pixel/AgriAI.git
cd AgriAI
```

### 2. Backend Setup (FastAPI & AI Model)

Open a new terminal and set up the Python environment:

```powershell
# Navigate to the backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows:
.\venv\Scripts\Activate.ps1
# Mac/Linux:
# source venv/bin/activate

# Install required dependencies
pip install -r requirements.txt
```

#### Configure Environment Variables

The `.env` file in `backend/` must contain the following keys:

```env
OPENAI_API_KEY=<your-openai-key>
GEMINI_API_KEY=<your-gemini-key>
NEWS_API_KEY=<your-news-api-key>
OPENWEATHER_API_KEY=<your-openweather-api-key>
MONGODB_URI=<your-mongodb-connection-string>
MONGODB_DB_NAME=agribot
```

#### Model Weights
Ensure the pre-trained model `agri_model.pt` is placed in the correct directory:
`backend/model_weights/agri_model.pt`

### 3. Frontend Setup (React + Vite)

Open a second terminal window and set up the frontend:

```powershell
# Navigate to the frontend directory
cd frontend

# Install all NPM dependencies
npm install
```

---

## 🚀 Running the Application

To run the full stack, you will need two separate terminal windows.

### Terminal 1: Start the Backend Server

```powershell
# Make sure you are in the backend directory and the venv is activated
cd backend
.\venv\Scripts\Activate.ps1

# Start the FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
✅ **Success:** The backend is ready when you see `Uvicorn running on http://0.0.0.0:8000`

### Terminal 2: Start the Frontend Application

```powershell
# Make sure you are in the frontend directory
cd frontend

# Start the Vite development server
npm run dev
```
✅ **Success:** The frontend is ready when you see `➜  Local:   http://localhost:5173/`

> **📱 Mobile Testing Note:** To use the live camera on your phone, look at the terminal for the `Network: https://<your-ip>:5173/` address. Open that exact URL on your mobile browser (connected to the same Wi-Fi) and accept the security warning to allow camera permissions!

---

## 🔌 Core API Endpoints

Once the backend is running, you can explore the interactive API documentation at:
**[http://localhost:8000/docs](http://localhost:8000/docs)**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/api/detect` | Upload image for crop disease detection |
| POST | `/api/chat` | Chatbot query (Gemini AI) |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| GET | `/api/recommendations` | Crop recommendations |
| GET | `/api/market` | Market price data |
| GET | `/api/weather?lat=<lat>&lon=<lon>` | Real-time weather + 5-day forecast |

Interactive API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🛠️ Troubleshooting

- **Backend won't start:** Make sure the virtual environment is activated (`.\venv\Scripts\Activate.ps1`) and keys are set in `backend/.env`. Check Python version: `python --version` (needs 3.9–3.11).
- **Detection returns 503 error:** The model file `backend/model_weights/agri_model.pt` is missing or corrupt.
- **Frontend can't reach the backend:** Confirm backend is running on port **8000** and check `frontend/vite.config.js` proxy settings.
- **MongoDB connection error:** Verify `MONGODB_URI` logic and check if your IP is whitelisted in MongoDB Atlas → **Network Access**.
- **PowerShell execution policy error:** Run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`.

---

## 📦 Tech Stack

- **Frontend:** React 18, Vite, React Router, Axios
- **Backend:** FastAPI, Uvicorn, Python
- **AI / ML:** PyTorch, YOLOv9 (`agri_model.pt`), Google Gemini
- **Database:** MongoDB Atlas
- **Authentication:** JWT & MongoDB User Models

---
*Last updated: may 7, 2026*