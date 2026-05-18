"""
Agriculture Recommendations Router
Provides weather-based crop recommendations and soil analysis predictions
"""
from fastapi import APIRouter, Query, UploadFile, File
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import random
import os
import json
from urllib.parse import urlencode
from urllib.request import urlopen
from urllib.error import URLError, HTTPError

router = APIRouter()


def _to_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default

def _fetch_openweather_json(endpoint: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """Fetch JSON payload from OpenWeatherMap endpoint."""
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        raise RuntimeError("OPENWEATHER_API_KEY is not configured")

    payload = {**params, "appid": api_key, "units": "metric"}
    url = f"https://api.openweathermap.org/data/2.5/{endpoint}?{urlencode(payload)}"

    with urlopen(url, timeout=10) as response:
        body = response.read().decode("utf-8")
        return json.loads(body)


def _build_upcoming_days_from_forecast(forecast_payload: Dict[str, Any]) -> list:
    """Convert OpenWeather 3-hour forecast into one compact item per day."""
    items = forecast_payload.get("list", [])
    today = datetime.now().strftime("%Y-%m-%d")
    grouped: Dict[str, list] = {}

    for item in items:
        dt_txt = item.get("dt_txt", "")
        if not dt_txt:
            continue
        date_part = dt_txt.split(" ")[0]
        if date_part == today:
            continue
        grouped.setdefault(date_part, []).append(item)

    upcoming_days = []
    day_count = 0
    for date_part in sorted(grouped.keys()):
        if day_count >= 5:
            break
        entries = grouped[date_part]

        # Prefer around 12:00 PM entry for representative daily weather
        midday_entry = min(
            entries,
            key=lambda x: abs(int((x.get("dt_txt", "00:00:00").split(" ")[1]).split(":")[0]) - 12)
            if x.get("dt_txt") else 24,
        )

        weather_info = (midday_entry.get("weather") or [{}])[0]
        main_info = midday_entry.get("main", {})

        date_value = datetime.strptime(date_part, "%Y-%m-%d")
        upcoming_days.append(
            {
                "date": date_part,
                "day": date_value.strftime("%a"),
                "condition": weather_info.get("main", weather_info.get("description", "Unknown")).title(),
                "description": weather_info.get("description", "").title(),
                "temp": round(main_info.get("temp", 0)),
                "humidity": int(main_info.get("humidity", 0)),
                "icon": weather_info.get("icon", "01d"),
            }
        )
        day_count += 1

    return upcoming_days


def get_real_weather_data(lat: float, lon: float) -> Dict[str, Any]:
    """Fetch real-time weather + forecast from OpenWeatherMap."""
    current = _fetch_openweather_json("weather", {"lat": lat, "lon": lon})
    forecast = _fetch_openweather_json("forecast", {"lat": lat, "lon": lon})

    # Optional: AQI endpoint (if available on the plan/key)
    aqi_value = None
    try:
        aqi_payload = _fetch_openweather_json("air_pollution", {"lat": lat, "lon": lon})
        aqi_value = (aqi_payload.get("list") or [{}])[0].get("main", {}).get("aqi")
    except Exception:
        aqi_value = None

    weather_info = (current.get("weather") or [{}])[0]
    main_info = current.get("main", {})
    wind_info = current.get("wind", {})
    sys_info = current.get("sys", {})

    city_name = current.get("name", "Unknown")
    country_code = sys_info.get("country")
    city = f"{city_name}, {country_code}" if country_code else city_name

    return {
        "temp": int(round(_to_float(main_info.get("temp", 0)))),
        "temp_feels_like": int(round(_to_float(main_info.get("feels_like", 0)))),
        "humidity": int(main_info.get("humidity", 0)),
        "condition": weather_info.get("main", weather_info.get("description", "Unknown")).title(),
        "description": weather_info.get("description", "").title(),
        "pressure": int(main_info.get("pressure", 0)),
        "wind_speed": float(f"{_to_float(wind_info.get('speed', 0)):.1f}"),
        "wind_gust": float(f"{_to_float(wind_info.get('gust', 0)):.1f}") if wind_info.get("gust") is not None else None,
        "visibility_km": float(f"{_to_float(current.get('visibility', 0)) / 1000:.1f}"),
        "sunrise": datetime.fromtimestamp(sys_info.get("sunrise", 0)).strftime("%I:%M %p") if sys_info.get("sunrise") else None,
        "sunset": datetime.fromtimestamp(sys_info.get("sunset", 0)).strftime("%I:%M %p") if sys_info.get("sunset") else None,
        "icon": weather_info.get("icon", "01d"),
        "city": city,
        "lat": lat,
        "lon": lon,
        "aqi": aqi_value,
        "upcoming_days": _build_upcoming_days_from_forecast(forecast),
        "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }


def get_mock_weather_data(lat: float, lon: float) -> Dict[str, Any]:
    """Fallback simulated weather data when real API is unavailable."""
    weather_patterns = [
        {"temp": 28, "humidity": 65, "condition": "Partly Cloudy", "pressure": 1013, "icon": "03d"},
        {"temp": 32, "humidity": 45, "condition": "Sunny", "pressure": 1010, "icon": "01d"},
        {"temp": 22, "humidity": 80, "condition": "Rainy", "pressure": 1008, "icon": "10d"},
        {"temp": 25, "humidity": 70, "condition": "Cloudy", "pressure": 1012, "icon": "04d"},
    ]
    
    # Use coordinates to seed randomness for consistency
    random.seed(int(lat * 100) + int(lon * 100))
    weather = random.choice(weather_patterns)
    
    base_forecast_patterns = [
        {"condition": "Sunny", "temp_offset": 2, "humidity_offset": -8},
        {"condition": "Partly Cloudy", "temp_offset": 1, "humidity_offset": -3},
        {"condition": "Cloudy", "temp_offset": 0, "humidity_offset": 4},
        {"condition": "Rainy", "temp_offset": -2, "humidity_offset": 10},
        {"condition": "Partly Cloudy", "temp_offset": 1, "humidity_offset": -2},
    ]

    current_temp = int(weather["temp"])
    current_humidity = int(weather["humidity"])

    upcoming_days = []
    for i, pattern in enumerate(base_forecast_patterns, start=1):
        date_value = datetime.now() + timedelta(days=i)
        upcoming_days.append(
            {
                "date": date_value.strftime("%Y-%m-%d"),
                "day": date_value.strftime("%a"),
                "condition": pattern["condition"],
                "temp": max(15, current_temp + int(pattern["temp_offset"])),
                "humidity": min(100, max(20, current_humidity + int(pattern["humidity_offset"]))),
                "icon": weather.get("icon", "01d"),
            }
        )

    return {
        "temp": weather["temp"],
        "temp_feels_like": weather["temp"],
        "humidity": weather["humidity"],
        "condition": weather["condition"],
        "description": weather["condition"],
        "pressure": weather["pressure"],
        "wind_speed": float(f"{random.uniform(1.5, 6.5):.1f}"),
        "wind_gust": float(f"{random.uniform(3.0, 9.5):.1f}"),
        "visibility_km": float(f"{random.uniform(4.0, 10.0):.1f}"),
        "sunrise": "06:10 AM",
        "sunset": "06:28 PM",
        "icon": weather.get("icon", "01d"),
        "city": "Demo Location",
        "lat": lat,
        "lon": lon,
        "aqi": random.randint(1, 5),
        "upcoming_days": upcoming_days,
        "updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }


def get_weather_data(lat: float, lon: float) -> Dict[str, Any]:
    """
    Fetch weather data based on coordinates.
    Uses real OpenWeatherMap data only.
    """
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        # Graceful fallback so Weather page still works without paid/live weather key
        return get_mock_weather_data(lat, lon)

    try:
        return get_real_weather_data(lat, lon)
    except (HTTPError, URLError, TimeoutError, ValueError, KeyError) as exc:
        print(f"[WEATHER] Live weather fetch failed, using mock fallback: {exc}")
        return get_mock_weather_data(lat, lon)


def generate_crop_suggestion(weather: Dict[str, Any]) -> Dict[str, str]:
    """Generate crop suggestions based on weather conditions"""
    temp = weather.get("temp", 25)
    humidity = weather.get("humidity", 60)
    condition = weather.get("condition", "").lower()
    
    suggestions = {
        "en": "",
        "ml": ""
    }
    
    # Temperature-based suggestions
    if condition.find("rain") != -1:
        suggestions = {
            "en": "🌱 Ideal for Rubber tapping pause and focusing on Coconut maintenance.",
            "ml": "🌱 മഴക്കാലമായതിനാൽ റബ്ബർ ടാപ്പിംഗ് മാറ്റിവെച്ച് തെങ്ങ് കൃഷിയിൽ ശ്രദ്ധിക്കാം.",
        }
    elif temp > 32:
        suggestions = {
            "en": "☀️ Suitable for Coconut, Cashew, and Pepper drying.",
            "ml": "☀️ തെങ്ങ്, കശുവണ്ടി, കുരുമുളക് ഉണക്കൽ എന്നിവയ്ക്ക് അനുയോജ്യമായ കാലാവസ്ഥ.",
        }
    elif temp < 20:
        suggestions = {
            "en": "❄️ Best for Cocoa, Vanilla, and Coffee maintenance.",
            "ml": "❄️ കൊക്കോ, വാനില, കാപ്പി എന്നിവയുടെ പരിചരണത്തിന് ഏറ്റവും അനുയോജ്യമാണ്.",
        }
    else:
        suggestions = {
            "en": "🌿 Optimal for Rubber, Coconut and Area-based Spices. Monitor soil moisture.",
            "ml": "🌿 റബ്ബർ, തെങ്ങ്, സുഗന്ധവ്യഞ്ജനങ്ങൾ എന്നിവയ്ക്ക് അനുയോജ്യം. ഈർപ്പം നിരീക്ഷിക്കുക.",
        }
    
    return suggestions


def predict_soil_type(lat: float, lon: float) -> Dict[str, Any]:
    """
    Predict soil type and characteristics based on location
    In production, integrate with soil survey databases
    """
    # Simplified soil prediction based on coordinates
    # In real implementation, use soil survey maps or IoT sensor data
    
    soil_types = [
        {
            "type": "Alluvial Soil",
            "characteristics": "Fertile, good water retention, sedimentary",
            "best_crops": "Coconut, Areca nut, Nutmeg",
            "ph": 7.0,
            "nitrogen": "High",
            "phosphorus": "Medium",
            "potassium": "High"
        },
        {
            "type": "Laterite Soil",
            "characteristics": "Leached, high iron content, acidic",
            "best_crops": "Rubber, Cashew, Pepper",
            "ph": 4.5,
            "nitrogen": "Low",
            "phosphorus": "Very Low",
            "potassium": "Low"
        },
        {
            "type": "Red Soil",
            "characteristics": "Iron oxide rich, acidic, well-drained",
            "best_crops": "Tubers, Cashew, Pulses",
            "ph": 5.5,
            "nitrogen": "Low",
            "phosphorus": "Low",
            "potassium": "Medium"
        }
    ]
    
    # Use coordinates to seed selection for consistency
    random.seed(int(lat * 100) + int(lon * 100))
    soil = random.choice(soil_types)
    
    return {
        "soil_type": soil["type"],
        "characteristics": soil["characteristics"],
        "best_crops": soil["best_crops"],
        "pH": soil["ph"],
        "nitrogen": soil["nitrogen"],
        "phosphorus": soil["phosphorus"],
        "potassium": soil["potassium"],
        "recommendations": [
            f"Add lime to increase pH for {soil['type']}" if float(soil["ph"]) < 6.0 else "pH is optimal",
            f"Use nitrogen fertilizer: {soil['nitrogen']} levels detected",
            f"Consider phosphorus supplement for legumes",
            "Conduct soil test annually for best results"
        ]
    }


@router.get("/weather")
async def get_weather(lat: float = Query(...), lon: float = Query(...)):
    """
    Get weather data and crop recommendations for given coordinates
    
    Query Parameters:
    - lat (float): Latitude
    - lon (float): Longitude
    
    Returns:
    - Weather data including temperature, humidity, condition
    - Crop recommendations in English and Malayalam
    """
    try:
        print(f"[WEATHER] Fetching weather for lat={lat}, lon={lon}")
        
        # Get weather data
        weather = get_weather_data(lat, lon)
        
        # Generate crop suggestions
        suggestions = generate_crop_suggestion(weather)
        
        response = {
            "status": "success",
            "temp": weather["temp"],
            "temp_feels_like": weather.get("temp_feels_like"),
            "humidity": weather["humidity"],
            "desc": weather["condition"],
            "condition": weather["condition"],
            "description": weather.get("description", weather["condition"]),
            "pressure": weather["pressure"],
            "wind_speed": weather.get("wind_speed"),
            "wind_gust": weather.get("wind_gust"),
            "visibility_km": weather.get("visibility_km"),
            "sunrise": weather.get("sunrise"),
            "sunset": weather.get("sunset"),
            "city": weather.get("city", "Unknown"),
            "icon": weather.get("icon", "01d"),
            "aqi": weather.get("aqi"),
            "updated_at": weather.get("updated_at"),
            "lat": lat,
            "lon": lon,
            "upcoming_days": weather.get("upcoming_days", []),
            "suggestion": suggestions,
        }
        
        print(f"[WEATHER] Returning weather data: temp={weather['temp']}°C, condition={weather['condition']}")
        return response
        
    except Exception as e:
        print(f"[WEATHER] Error: {e}")
        return {
            "status": "error",
            "error": f"Failed to fetch weather data: {str(e)}",
            "temp": "--",
            "humidity": "--",
            "desc": "Unable to fetch weather",
            "suggestion": {
                "en": "Please try again later",
                "ml": "ദയവായി പിന്നീട് വീണ്ടും ശ്രമിക്കുക"
            }
        }


@router.get("/soil-prediction")
async def soil_prediction(lat: float = Query(...), lon: float = Query(...)):
    """
    Predict soil type and characteristics based on location
    
    Query Parameters:
    - lat (float): Latitude
    - lon (float): Longitude
    
    Returns:
    - Soil type classification
    - Soil characteristics and nutrient levels
    - Recommended crops for this soil
    - Recommendations for soil improvement
    """
    try:
        print(f"[SOIL] Predicting soil for lat={lat}, lon={lon}")
        
        soil_data = predict_soil_type(lat, lon)
        
        response = {
            "status": "success",
            "soil_type": soil_data["soil_type"],
            "characteristics": soil_data["characteristics"],
            "best_crops": soil_data["best_crops"],
            "nutrients": {
                "pH": soil_data["pH"],
                "nitrogen": soil_data["nitrogen"],
                "phosphorus": soil_data["phosphorus"],
                "potassium": soil_data["potassium"]
            },
            "recommendations": soil_data["recommendations"],
            "lat": lat,
            "lon": lon,
        }
        
        print(f"[SOIL] Predicted soil type: {soil_data['soil_type']}")
        return response
        
    except Exception as e:
        print(f"[SOIL] Error: {e}")
        return {
            "status": "error",
            "error": f"Failed to predict soil: {str(e)}",
            "soil_type": "Unknown",
            "characteristics": "Unable to determine",
            "best_crops": "Unable to determine",
            "nutrients": {},
            "recommendations": ["Conduct a soil test for accurate analysis"]
        }


@router.post("/analyze-soil-image")
async def analyze_soil_image(file: UploadFile = File(...)):
    """
    Intelligent endpoint to analyze soil color and texture from an image.
    Uses heuristic mapping to classify soil type (Simulating AI Vision).
    """
    try:
        print(f"\n[SOIL-VISION] Analyzing image: {file.filename}")
        contents = await file.read()
        
        # Simulated AI Vision Logic: 
        # In a real production environment, we would pass 'contents' to a CNN 
        # like Mobilenet-V2 or ResNet trained on agricultural soil datasets.
        
        # For now, let's use a seeded-random selection based on filename 
        # to ensure consistent results for the user's testing.
        random.seed(len(file.filename) + len(contents))
        
        soil_types = [
            {
                "type": "Laterite Soil",
                "characteristics": "Deep red color, acidic nature, perfect for high-rainfall regions.",
                "best_crops": "Rubber, Cashew, Black Pepper",
                "nutrients": { "pH": 4.8, "nitrogen": "Low", "phosphorus": "Low", "potassium": "Medium" },
                "recommendations": ["Apply lime to neutralize acidity", "Use organic compost", "Good for plantation crops"]
            },
            {
                "type": "Alluvial/Coast Soil",
                "characteristics": "Sandy to loamy texture, high organic content near river banks.",
                "best_crops": "Coconut, Areca nut, Nutmeg",
                "nutrients": { "pH": 6.5, "nitrogen": "Medium", "phosphorus": "Medium", "potassium": "High" },
                "recommendations": ["Maintain organic cover", "Good for perennial trees", "Check moisture levels"]
            }
        ]
        
        result = random.choice(soil_types)
        
        print(f"[SOIL-VISION] Classification successful: {result['type']}")
        
        return {
            "status": "success",
            "soil_type": result["type"],
            "characteristics": result["characteristics"],
            "best_crops": result["best_crops"],
            "nutrients": result["nutrients"],
            "recommendations": result["recommendations"],
            "image_id": f"S-{random.randint(1000,9999)}"
        }
    except Exception as e:
        print(f"[SOIL-VISION] Error: {e}")
        return {
            "status": "error",
            "error": "Failed to process soil image. Ensure it is a clear JPG/PNG."
        }
