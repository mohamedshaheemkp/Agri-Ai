from fastapi import APIRouter
from datetime import datetime
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
import json
import os
import re

router = APIRouter()

AGRI_NEWS_KEYWORDS = {
    "agriculture",
    "agricultural",
    "farmer",
    "farmers",
    "farming",
    "crop",
    "crops",
    "harvest",
    "irrigation",
    "soil",
    "seed",
    "seeds",
    "fertilizer",
    "fertiliser",
    "pesticide",
    "livestock",
    "dairy",
    "horticulture",
    "agri",
    "agronomy",
    "crop yield",
    "crop disease",
    "mandi",
    "commodity prices",
    "drought",
    "monsoon",
    "plantation",
}

AGRI_PRIORITY_KEYWORDS = {
    "agriculture",
    "agricultural",
    "farming",
    "farmer",
    "farmers",
    "crop",
    "crops",
    "livestock",
    "dairy",
    "irrigation",
    "horticulture",
    "agronomy",
}

NON_AGRI_KEYWORDS = {
    "celebrity",
    "movie",
    "cinema",
    "actor",
    "actress",
    "election",
    "parliament",
    "iphone",
    "smartphone",
    "crypto",
    "football",
    "cricket",
    "tennis",
    "murder",
    "crime",
    "fashion",
    "music",
}


def _tokenize(text: str):
    return set(re.findall(r"[a-zA-Z]+", text.lower()))


def _is_agriculture_article(article):
    """Return True only when the article clearly relates to agriculture."""
    text = " ".join(
        [
            (article.get("title") or ""),
            (article.get("description") or ""),
            (article.get("content") or ""),
            ((article.get("source") or {}).get("name") or ""),
        ]
    ).lower()
    tokens = _tokenize(text)

    if not text.strip():
        return False

    if any(term in text for term in NON_AGRI_KEYWORDS):
        return False

    priority_matches = sum(1 for keyword in AGRI_PRIORITY_KEYWORDS if keyword in text)
    keyword_matches = sum(
        1
        for keyword in AGRI_NEWS_KEYWORDS
        if (keyword in text) or (" " not in keyword and keyword in tokens)
    )

    return priority_matches >= 1 and keyword_matches >= 2


def _fallback_news():
    """Fallback news list used when external API is unavailable."""
    return [
        {
            "id": 1,
            "title": "India expands micro-irrigation support to help farmers save water before summer",
            "date": "18/3/2026",
            "category": "Irrigation",
            "content": "State agriculture departments are scaling drip and sprinkler support programs to help farmers reduce water use and protect yields during rising temperatures.",
            "url": "",
        },
        {
            "id": 2,
            "title": "Paddy and vegetable growers advised to prepare for early pest surveillance this season",
            "date": "18/3/2026",
            "category": "Crop Protection",
            "content": "Agriculture officers are recommending field scouting, pheromone traps, and targeted spray plans to reduce early pest damage in paddy and vegetable farms.",
            "url": "",
        },
        {
            "id": 3,
            "title": "Dairy farmers see feed planning gains as fodder advisories improve ahead of monsoon",
            "date": "19/3/2026",
            "category": "Dairy",
            "content": "Improved fodder management and local weather-based advisories are helping dairy farmers stabilize milk production and reduce feed shortages.",
            "url": "",
        },
    ]


def _fetch_live_agri_news():
    """Fetch latest agriculture-related headlines from NewsAPI."""
    api_key = os.getenv("NEWS_API_KEY", "").strip()
    if not api_key:
        return _fallback_news()

    query_params = urlencode(
        {
            "q": '("agriculture" OR "agricultural" OR "farming" OR "farmers" OR "crop production" OR "irrigation" OR "livestock" OR "horticulture" OR "dairy farming")',
            "language": "en",
            "sortBy": "publishedAt",
            "pageSize": 25,
            "apiKey": api_key,
        }
    )

    url = f"https://newsapi.org/v2/everything?{query_params}"
    request = Request(url, headers={"User-Agent": "AgriBot/1.0"}, method="GET")

    try:
        with urlopen(request, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))

        articles = payload.get("articles", [])
        normalized = []
        for i, article in enumerate(articles, start=1):
            if not _is_agriculture_article(article):
                continue

            title = (article.get("title") or "").strip()
            if not title:
                continue

            published_at = article.get("publishedAt", "")
            now = datetime.now()
            formatted_date = f"{now.day}/{now.month}/{now.year}"
            if published_at:
                try:
                    dt = datetime.fromisoformat(published_at.replace("Z", "+00:00"))
                    formatted_date = f"{dt.day}/{dt.month}/{dt.year}"
                except Exception:
                    pass

            source_name = (article.get("source") or {}).get("name", "")
            normalized.append(
                {
                    "id": len(normalized) + 1,
                    "title": title,
                    "date": formatted_date,
                    "category": source_name or "Trending",
                    "content": (article.get("description") or article.get("content") or "No summary available.").strip(),
                    "url": article.get("url", ""),
                }
            )

            if len(normalized) == 6:
                break

        return normalized if normalized else _fallback_news()
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError):
        return _fallback_news()

@router.get("/schemes")
async def get_schemes():
    """
    Returns a list of government agricultural schemes
    """
    return [
        {
            "id": 1,
            "category": "Seeds",
            "title": { "en": "Subsidized Seed Distribution", "ml": "സബ്സിഡിയോടെയുള്ള വിത്ത് വിതരണം" },
            "desc": {
                "en": "Government provides quality seeds at 50% subsidy for farmers.",
                "ml": "കർഷകർക്ക് 50% സബ്സിഡി നിരക്കിൽ സർക്കാർ ഗുണമേന്മയുള്ള വിത്തുകൾ നൽകുന്നു.",
            },
            "eligibility": {
                "en": "Small & marginal farmers with valid land records.",
                "ml": "സാധുവായ ഭൂമി രേഖകളുള്ള ചെറുകിട കർഷകർ.",
            },
            "requirements": {
                "en": "Aadhaar card, land ownership proof.",
                "ml": "ആധാർ കാർഡ്, ഭൂമിയുടെ ഉടമസ്ഥാവകാശ രേഖ.",
            },
            "link": "https://www.nabard.org/",
        },
        {
            "id": 2,
            "category": "Fertilizer",
            "title": { "en": "Fertilizer Subsidy", "ml": "വളം സബ്സിഡി" },
            "desc": {
                "en": "Chemical & organic fertilizers available at reduced rates.",
                "ml": "രാസ, ജൈവ വളങ്ങൾ കുറഞ്ഞ നിരക്കിൽ ലഭ്യമാണ്.",
            },
            "eligibility": {
                "en": "All registered farmers in cooperative societies.",
                "ml": "സഹകരണ സംഘങ്ങളിൽ രജിസ്റ്റർ ചെയ്ത എല്ലാ കർഷകരും.",
            },
            "requirements": {
                "en": "Farmer ID card or Cooperative society membership.",
                "ml": "കർഷക തിരിച്ചറിയൽ കാർഡ് അല്ലെങ്കിൽ സഹകരണ സംഘം അംഗത്വം.",
            },
            "link": "https://farmer.gov.in/fertilizer",
        },
        {
            "id": 3,
            "category": "Irrigation",
            "title": { "en": "Pradhan Mantri Krishi Sinchai Yojana", "ml": "പ്രധാനമന്ത്രി കൃഷി സിഞ്ചായ് യോജന" },
            "desc": {
                "en": "Financial aid for drip irrigation and water-saving technology.",
                "ml": "തുള്ളിനനയ്ക്കും ജലസംരക്ഷണ സാങ്കേതികവിദ്യകൾക്കും സാമ്പത്തിക സഹായം.",
            },
            "eligibility": {
                "en": "Farmers owning irrigable land, especially in drought areas.",
                "ml": "വരൾച്ചയുള്ള പ്രദേശങ്ങളിൽ കൃഷിയോഗ്യമായ ഭൂമിയുള്ള കർഷകർ.",
            },
            "requirements": {
                "en": "Land record, Aadhaar, bank account.",
                "ml": "ഭൂമി രേഖ, ആധാർ, ബാങ്ക് അക്കൗണ്ട്.",
            },
            "link": "https://pmksy.gov.in/",
        },
        {
            "id": 4,
            "category": "Loan",
            "title": { "en": "Kisan Credit Card (KCC)", "ml": "കിസാൻ ക്രെഡിറ്റ് കാർഡ് (KCC)" },
            "desc": {
                "en": "Farmers get easy loans for crops and livestock at low interest.",
                "ml": "കൃഷിക്കും കന്നുകാലികൾക്കും കുറഞ്ഞ പലിശയിൽ കർഷകർക്ക് എളുപ്പത്തിൽ വായ്പ ലഭിക്കുന്നു.",
            },
            "eligibility": {
                "en": "All farmers including tenant farmers and self-help groups.",
                "ml": "പാട്ടക്കർഷകരും സ്വയംസഹായ സംഘങ്ങളും ഉൾപ്പെടെ എല്ലാ കർഷകരും.",
            },
            "requirements": {
                "en": "KYC documents, land/lease proof, Aadhaar, bank account.",
                "ml": "KYC രേഖകൾ, ഭൂമി/പാട്ട രേഖ, ആധാർ, ബാങ്ക് അക്കൗണ്ട്.",
            },
            "link": "https://www.rbi.org.in/Scripts/BS_ViewKCC.aspx",
        },
        {
            "id": 5,
            "category": "Insurance",
            "title": { "en": "PM Fasal Bima Yojana", "ml": "പ്രധാനമന്ത്രി ഫസൽ ബീമാ യോജന" },
            "desc": {
                "en": "Crop insurance to protect against natural calamities.",
                "ml": "പ്രകൃതി ദുരന്തങ്ങളിൽ നിന്ന് സംരക്ഷിക്കുന്നതിനുള്ള വിള ഇൻഷുറൻസ്.",
            },
            "eligibility": {
                "en": "All farmers growing notified crops in notified areas.",
                "ml": "വിജ്ഞാപനം ചെയ്ത പ്രദേശങ്ങളിൽ വിജ്ഞാപനം ചെയ്ത വിളകൾ കൃഷി ചെയ്യുന്ന എല്ലാ കർഷകരും.",
            },
            "requirements": {
                "en": "Crop sowing certificate, Aadhaar, bank details.",
                "ml": "വിള വിതച്ച സർട്ടിഫിക്കറ്റ്, ആധാർ, ബാങ്ക് വിവരങ്ങൾ.",
            },
            "link": "https://pmfby.gov.in/",
        },
    ]

@router.get("/news")
async def get_news():
    """
    Returns latest agriculture news from external source with fallback.
    """
    return _fetch_live_agri_news()

@router.get("/climate-risk")
async def get_climate_risk():
    """
    Returns current high-priority climate risk alerts
    """
    return {
        "id": "risk_2026_01",
        "severity": "High",
        "title": "Climate Risk Alert: Heavy Rainfall Expected",
        "message": "Heavy rainfall expected in 48 hours. Review and execute the mitigation plan immediately.",
        "mitigation_plan": [
            "Clear drainage channels to prevent water buildup.",
            "Deactivate automated irrigation timers for 72 hours.",
            "Relocate portable equipment to higher ground."
        ]
    }
