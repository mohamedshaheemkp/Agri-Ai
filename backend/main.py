from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import detect, chat, auth, recommendations, market, info

# Ensure backend/.env variables are loaded for all routers (including weather API key)
load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")

app = FastAPI(title="Agri AI Monitoring System")

# Configure CORS to allow frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include API endpoints
app.include_router(detect.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(recommendations.router, prefix="/api")
app.include_router(market.router, prefix="/api")
app.include_router(info.router, prefix="/api")
@app.get("/")
def read_root():
    return {"message": "Welcome to Agri AI Monitoring System API. Backend is running successfully!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
