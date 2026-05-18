from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import json
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

router = APIRouter()

# File-based storage for development (no MongoDB needed)
BASE_DIR = Path(__file__).resolve().parent.parent
USERS_FILE = BASE_DIR / "users.json"
OTP_FILE = BASE_DIR / "otps.json"


def normalize_phone(phone: str) -> str:
    return "".join(ch for ch in phone if ch.isdigit())


def normalize_text(value: str) -> str:
    return value.strip() if isinstance(value, str) else value

def load_users():
    if USERS_FILE.exists():
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_users(users):
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2)

def load_otps():
    if OTP_FILE.exists():
        with open(OTP_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_otps(otps):
    with open(OTP_FILE, 'w') as f:
        json.dump(otps, f, indent=2)

print("Using file-based storage for development (no MongoDB needed)")

class SignupData(BaseModel):
    fullname: str
    phone: str
    password: str
    location: str
    farm_type: str
    otp: str  # Add OTP requirement

class OTPRequest(BaseModel):
    phone: str

class LoginData(BaseModel):
    phone: str
    password: str

# In-memory store for OTPs (In a real app, use Redis or a Mongo TTL collection)
otp_store = {}

@router.post("/send-otp")
def send_otp(data: OTPRequest):
    users = load_users()
    phone = normalize_phone(data.phone)
    
    if not phone:
        raise HTTPException(status_code=400, detail="Please enter a valid phone number")

    if phone in users:
        raise HTTPException(status_code=400, detail="User with this phone number already exists")
    
    # Mock OTP logic for development/demonstration
    mock_otp = "123456"
    otp_store[phone] = mock_otp
    
    print(f"========== OTP ALERT ==========")
    print(f"Generated OTP {mock_otp} for {phone}")
    print(f"===============================")
    
    return {"status": "success", "message": "OTP sent successfully (Check backend console: 123456)"}

@router.post("/signup")
def signup(data: SignupData):
    users = load_users()
    phone = normalize_phone(data.phone)
    fullname = normalize_text(data.fullname)
    password = normalize_text(data.password)
    location = normalize_text(data.location)
    farm_type = normalize_text(data.farm_type)
    otp = normalize_text(data.otp)

    if not phone:
        raise HTTPException(status_code=400, detail="Please enter a valid phone number")
    if not fullname or not password or not farm_type:
        raise HTTPException(status_code=400, detail="Please fill all required fields")
    
    # Verify OTP
    stored_otp = otp_store.get(phone)
    if not stored_otp or stored_otp != otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    if phone in users:
        raise HTTPException(status_code=400, detail="User with this phone number already exists")
    
    # Save new user
    users[phone] = {
        "phone": phone,
        "fullname": fullname,
        "password": password,
        "location": location,
        "farm_type": farm_type
    }
    save_users(users)
    
    # Clear the OTP memory
    otp_store.pop(phone, None)
    
    return {"status": "success", "message": "Signup successful!"}

@router.post("/login")
def login(data: LoginData):
    users = load_users()
    phone = normalize_phone(data.phone)
    password = normalize_text(data.password)

    if not phone or not password:
        raise HTTPException(status_code=400, detail="Phone number and password are required")
    
    user = users.get(phone)
    if not user or normalize_text(user["password"]) != password:
        raise HTTPException(status_code=401, detail="Invalid phone number or password")
    
    return {
        "status": "success",
        "phone": phone,
        "fullname": user["fullname"],
        "message": "Login successful!"
    }
