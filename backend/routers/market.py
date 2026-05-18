from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

# Mock market data generator
def get_market_data():
    return {
        "Dairy": [
            {"item": "Cow Milk", "price": 45, "yesterday": 45, "unit": "Liter", "location": "Tamil Nadu"},
            {"item": "Buffalo Milk", "price": 55, "yesterday": 52, "unit": "Liter", "location": "Haryana"},
            {"item": "Eggs", "price": 6, "yesterday": 6, "unit": "Piece", "location": "Andhra Pradesh"}
        ],
        "Seeds": [
            {"item": "Wheat", "price": 2500, "yesterday": 2480, "unit": "Quintal", "location": "Punjab"},
            {"item": "Rice", "price": 3200, "yesterday": 3150, "unit": "Quintal", "location": "Andhra Pradesh"},
            {"item": "Cotton", "price": 7500, "yesterday": 7600, "unit": "Quintal", "location": "Maharashtra"}
        ],
        "Vegetables": [
            {"item": "Tomato", "price": 40, "yesterday": 30, "unit": "Kg", "location": "Karnataka"},
            {"item": "Potato", "price": 25, "yesterday": 26, "unit": "Kg", "location": "Uttar Pradesh"},
            {"item": "Onion", "price": 35, "yesterday": 35, "unit": "Kg", "location": "Maharashtra"}
        ],
        "Fruits": [
            {"item": "Banana", "price": 40, "yesterday": 45, "unit": "Dozen", "location": "Kerala"},
            {"item": "Mango", "price": 120, "yesterday": 120, "unit": "Kg", "location": "Uttar Pradesh"},
            {"item": "Apple", "price": 180, "yesterday": 170, "unit": "Kg", "location": "Himachal Pradesh"}
        ]
    }

@router.get("/market")
async def get_market_prices():
    """
    Endpoint to fetch real-time or mock market prices for agricultural products
    """
    try:
        data = get_market_data()
        return {
            "market": data,
            "as_of": datetime.now().isoformat()
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}
