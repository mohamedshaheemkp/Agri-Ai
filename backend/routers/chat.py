from fastapi import APIRouter, Body
from typing import Dict, Any
import json
import os
import re
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

router = APIRouter()

# Pre-load treatments database into memory
TREATMENTS_DB = {}
try:
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "treatments.json")
    with open(db_path, "r") as f:
        TREATMENTS_DB = json.load(f)
    print(f"[INIT] Loaded treatments database with {len(TREATMENTS_DB)} entries")
except Exception as e:
    print(f"Warning: Could not load treatments database: {e}")

# Pre-load remedies database for detection classes
REMEDIES_DB = {}
try:
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "remedies.json")
    with open(db_path, "r") as f:
        REMEDIES_DB = json.load(f)
    print(f"[INIT] Loaded remedies database with {len(REMEDIES_DB)} entries")
except Exception as e:
    print(f"Warning: Could not load remedies database: {e}")


def _sanitize_ai_text(text: str) -> str:
    """Clean and normalize model output for UI display."""
    cleaned = (text or "").strip()
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned


def _generate_with_gemini(user_message: str) -> str:
    """Generate response from Gemini if API key is configured."""
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return ""

    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    prompt = (
        "You are AgriBot, an agriculture assistant for Indian farmers. "
        "Give practical, safe, and concise farming guidance. "
        "Prefer bullet points and include low-cost options when relevant. "
        f"\n\nFarmer question: {user_message}"
    )
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.4, "maxOutputTokens": 320},
    }

    request = Request(
        endpoint,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urlopen(request, timeout=15) as response:
            payload = json.loads(response.read().decode("utf-8"))

        candidates = payload.get("candidates") or []
        if not candidates:
            return ""

        content = candidates[0].get("content", {})
        parts = content.get("parts") or []
        combined = "\n".join((part.get("text", "") for part in parts)).strip()
        return _sanitize_ai_text(combined)
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError, KeyError, ValueError) as exc:
        print(f"[CHAT] Gemini fallback failed: {exc}")
        return ""


def _generate_with_openai(user_message: str) -> str:
    """Generate response from OpenAI if API key is configured."""
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return ""

    endpoint = "https://api.openai.com/v1/chat/completions"
    body = {
        "model": "gpt-4o-mini",
        "temperature": 0.4,
        "max_tokens": 320,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are AgriBot, a practical agriculture assistant for Indian farmers. "
                    "Give safe, concise, actionable advice with bullet points."
                ),
            },
            {"role": "user", "content": user_message},
        ],
    }

    request = Request(
        endpoint,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=15) as response:
            payload = json.loads(response.read().decode("utf-8"))

        choices = payload.get("choices") or []
        if not choices:
            return ""

        text = choices[0].get("message", {}).get("content", "")
        return _sanitize_ai_text(text)
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError, KeyError, ValueError) as exc:
        print(f"[CHAT] OpenAI fallback failed: {exc}")
        return ""


def _generate_with_llm(user_message: str) -> str:
    """Try Gemini first, then OpenAI for dynamic answers."""
    answer = _generate_with_gemini(user_message)
    if answer:
        return answer

    return _generate_with_openai(user_message)

def get_chatbot_response(message: str) -> str:
    message_lower = message.lower()
    
    best_match = None
    max_score = 0
    source_db = "treatments"  # Track which database gave the match
    matched_data = None
    
    # Search in treatments database first
    print(f"[CHAT] Searching treatments DB for: {message}")
    for key, data in TREATMENTS_DB.items():
        keywords = key.lower().replace("_", " ").split()
        score = sum(1 for word in keywords if word in message_lower)
        
        if score > max_score and score > 0:
            max_score = score
            best_match = key
            source_db = "treatments"
            matched_data = data
    
    # Also search in remedies database for pests/diseases from detection model
    print(f"[CHAT] Searching remedies DB for: {message}")
    for key, data in REMEDIES_DB.items():
        keywords = key.lower().replace("_", " ").replace("-", " ").split()
        score = sum(1 for word in keywords if word in message_lower)
        
        if score > max_score and score > 0:
            max_score = score
            best_match = key
            source_db = "remedies"
            matched_data = data
    
    # If we found a match in either database
    if best_match and matched_data:
        print(f"[CHAT] Found match in {source_db}: {best_match}")
        
        if source_db == "treatments":
            crop = matched_data.get("crop", "the plant")
            disease_name = matched_data.get("disease", "the disease")
            treatments = matched_data.get("treatment", [])
            preventions = matched_data.get("preventive_measures", [])
        else:  # remedies
            crop = matched_data.get("crop", "the crop")
            disease_name = best_match.replace("_", " ")
            treatments = matched_data.get("treatment", [])
            preventions = matched_data.get("preventive_measures", [])
        
        response = f"It sounds like you might be dealing with **{crop} {disease_name}**.\n\n"
        
        if treatments and len(treatments) > 0:
            if isinstance(treatments, list):
                treatment_text = "\n- ".join([str(t) for t in treatments if t and str(t).lower() != "nan"])
                if treatment_text:
                    response += "💊 **Recommended Treatment:**\n- " + treatment_text + "\n\n"
        
        if preventions and len(preventions) > 0:
            if isinstance(preventions, list):
                prevention_text = "\n- ".join([str(p) for p in preventions if p and str(p).lower() != "nan"])
                if prevention_text:
                    response += "🛡️ **Preventive Measures:**\n- " + prevention_text
        
        if response.endswith("\n\n"):
            response = response.rstrip()
        
        return response.strip()
    
    # Greeting responses
    if "hello" in message_lower or "hi" in message_lower or "hey" in message_lower:
        return "Hello! I am your Agri AI Assistant. Ask me about crop diseases, pests, farming tips (irrigation, fertilizer, soil), or upload an image to analyze!"
    elif "thank" in message_lower:
        return "You're very welcome! Let me know if you need help with anything else."
    elif "help" in message_lower:
        return "I can help you with:\n- Crop disease and pest identification\n- Treatment and preventive measures\n- Irrigation, fertilizer, and soil management\n- Seasonal farming timing\n- Sustainable practices\n\nJust describe your question or upload an image!"
    
    # General farming topics fallback
    if any(word in message_lower for word in ["irrigat", "water", "drain"]):
        return "**Irrigation Tips:**\n- Water early morning or late evening\n- Drip irrigation is more efficient\n- Avoid waterlogging\n- Monitor soil moisture regularly\n- Different crops need different watering schedules"
    
    if any(word in message_lower for word in ["fertilizer", "nitrogen", "phosphorus", "potassium", "npk"]):
        return "**Fertilizer Guide:**\n- Use balanced NPK based on soil tests\n- Organic fertilizers improve long-term soil health\n- Chemical fertilizers work faster\n- Split applications are better than single doses\n- Follow application rates to avoid crop damage"
    
    if any(word in message_lower for word in ["soil", "drainage", "ph", "acid", "alkaline"]):
        return "**Soil Management:**\n- Test soil regularly\n- Crop rotation improves fertility\n- Mulching retains moisture\n- Organic compost improves structure\n- pH affects nutrient availability"
    
    if any(word in message_lower for word in ["season", "timing", "plant", "harvest", "sow"]):
        return "**Seasonal Farming:**\n- Follow local agricultural calendar\n- Prepare soil well before planting\n- Plant during favorable weather\n- Harvest at optimal maturity\n- Consider temperature and rainfall patterns"
    
    if any(word in message_lower for word in ["organic", "natural", "sustainable", "eco"]):
        return "**Sustainable Farming:**\n- Use natural pest control (neem oil, beneficial insects)\n- Practice crop rotation\n- Compost farm waste\n- Avoid synthetic chemicals when possible\n- Biochar improves soil health"

    # If no deterministic match found, try live LLM response using configured API keys
    llm_answer = _generate_with_llm(message)
    if llm_answer:
        return llm_answer
    
    return "I couldn't find a specific match. Try asking about:\n- Specific diseases/pests\n- Farming practices (irrigation, fertilizer, soil)\n- Seasonal timing\n- Or upload an image for AI analysis!"

@router.post("/chat")
async def chat_endpoint(payload: Dict[str, Any] = Body(...)):
    """
    Intelligent chatbot endpoint that processes natural language queries 
    and cross-references them against Treatment and Remedies Databases.
    Handles crop diseases, pests, and management advice.
    """
    try:
        user_message = payload.get("message", "").strip()
        if not user_message:
            return {"status": "error", "reply": "Please provide a message."}
        
        if len(user_message) > 5000:
            return {"status": "error", "reply": "Message too long. Please keep it under 5000 characters."}
        
        bot_reply = get_chatbot_response(user_message)
        print(f"[CHAT] Response: {bot_reply[:100]}...")
        
        return {"status": "success", "reply": bot_reply}
    except Exception as e:
        print(f"[CHAT] Error: {e}")
        return {"status": "error", "reply": f"Sorry, there was an error processing your message: {str(e)}"}
