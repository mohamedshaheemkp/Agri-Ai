import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CloudSun,
  AlertCircle,
  Thermometer,
  Droplets,
  Wind,
  ChevronLeft,
  Sprout,
  CalendarDays,
  RefreshCw,
  Navigation,
  Gauge,
  Eye,
  Sunrise,
  Sunset,
} from "lucide-react";
import "./WeatherPage.css";
import { buildApiUrl } from "../config";

function WeatherPage() {
  const navigate = useNavigate();
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [suggestion, setSuggestion] = useState({ en: "", ml: "" });
  const [seasonalCrop, setSeasonalCrop] = useState({ en: "", ml: "" });
  const [language, setLanguage] = useState("en");

  const forecastLabel = {
    en: "Upcoming Days",
    ml: "അടുത്ത ദിവസങ്ങൾ",
  };

  const fetchWeather = async (lat, lon) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(buildApiUrl(`/weather?lat=${lat}&lon=${lon}`));
      const data = await res.json();

      if (!res.ok || data.status === "error" || data.error) {
        setError(data.error || "Failed to fetch weather.");
        setWeather(null);
      } else {
        setWeather({ ...data, lat, lon });
        generateSuggestion(data);
        generateSeasonalCrop();
      }
    } catch (err) {
      setError("Failed to fetch weather.");
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const requestLocationWeather = () => {
    if (!navigator.geolocation) {
      fetchWeather(19.076, 72.8777);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => fetchWeather(19.076, 72.8777)
    );
  };

  useEffect(() => {
    requestLocationWeather();
  }, []);

  const generateSuggestion = (data) => {
    if (!data) return;
    if (data.condition.toLowerCase().includes("rain")) {
      setSuggestion({
        en: "Paddy, sugarcane, and leafy vegetables are best for this rain.",
        ml: "മഴക്കാലമായതിനാൽ നെല്ല്, കരിമ്പ്, ഇലക്കറികൾ തുടങ്ങിയവ കൃഷി ചെയ്യാം.",
      });
    } else if (data.temp > 32) {
      setSuggestion({
        en: "Intense heat! Good for millet, groundnut, and cotton. Keep hydrated.",
        ml: "ചോളം, നിലക്കടല, പരുത്തി എന്നിവയ്ക്ക് അനുയോജ്യമായ കാലാവസ്ഥ.",
      });
    } else if (data.temp < 20) {
      setSuggestion({
        en: "Cool weather: Best for wheat, mustard, and potatoes.",
        ml: "ഗോതമ്പ്, കടുക്, ഉരുളക്കിഴങ്ങ് എന്നിവയ്ക്ക് ഏറ്റവും അനുയോജ്യമാണ്.",
      });
    } else {
      setSuggestion({
        en: "Ideal conditions. Monitor soil moisture regularly for optimal growth.",
        ml: "മിക്ക വിളകളും കൃഷി ചെയ്യാം. മണ്ണിന്റെ ഈർപ്പം കൃത്യമായി നിരീക്ഷിക്കുക.",
      });
    }
  };

  const generateSeasonalCrop = () => {
    const month = new Date().getMonth() + 1;
    let crop = { en: "", ml: "" };
    if ([6, 7, 8, 9].includes(month)) {
      crop = { en: "Kharif: Rice, maize, bajra, pulses, groundnut.", ml: "ഖാരിഫ്: നെല്ല്, ചോളം, പയർവർഗ്ഗങ്ങൾ, നിലക്കടല." };
    } else if ([10, 11, 12, 1].includes(month)) {
      crop = { en: "Rabi: Wheat, barley, peas, mustard, gram.", ml: "റാബി: ഗോതമ്പ്, ബാർലി, കടുക്, കടല." };
    } else {
      crop = { en: "Zaid: Watermelon, cucumber, pumpkin, fodder.", ml: "സെയ്ദ്: തണ്ണിമത്തൻ, കുക്കുമ്പർ, മത്തൻ." };
    }
    setSeasonalCrop(crop);
  };

  const aqiLabel = {
    1: "Good",
    2: "Fair",
    3: "Moderate",
    4: "Poor",
    5: "Very Poor",
  };

  return (
    <div className="weather-page-modern reveal-anim">
      <div className="page-header-flex">
        <div className="header-text">
          <div className="header-icon-small"><CloudSun size={24} /></div>
          <div>
            <h1>{language === "en" ? "Live Weather" : "കാലാവസ്ഥ"}</h1>
            <p className="subtitle">Real-time hyperlocal agricultural conditions.</p>
          </div>
        </div>
        <div className="header-actions-market">
          <button className="btn-refresh-soft" onClick={requestLocationWeather}>
            <RefreshCw size={15} /> Refresh
          </button>
          <div className="language-switcher-modern">
            <button className={`switch-pill ${language === 'en' ? 'active' : ''}`} onClick={() => setLanguage('en')}>EN</button>
            <button className={`switch-pill ${language === 'ml' ? 'active' : ''}`} onClick={() => setLanguage('ml')}>ML</button>
          </div>
          <button className="btn-back-soft" onClick={() => navigate("/dashboard")}>
            <ChevronLeft size={16} /> Dashboard
          </button>
        </div>
      </div>

      {error && <div className="error-msg-monitor"><AlertCircle size={20} /> {error}</div>}

      {weather && !loading ? (
        <div className="weather-grid-main">
          <div className="card-ngebon weather-hero-card">
            <div className="weather-main-info">
              <div className="location-tag"><Navigation size={14} /> {weather.city}</div>
              <div className="temp-display">
                <span className="temp-num">{weather.temp}°</span>
                <span className="temp-unit">C</span>
              </div>
              <p className="condition-txt">{weather.condition}</p>
              {weather.updated_at && <p className="updated-at">Updated: {weather.updated_at}</p>}
            </div>
            <div className="weather-art">
              <img src={`https://openweathermap.org/img/wn/${weather.icon}@4x.png`} alt="weather" />
            </div>

            <div className="weather-stats-row">
              <div className="w-stat">
                <Droplets size={18} className="text-info" />
                <div>
                  <span className="stat-label">Humidity</span>
                  <p className="stat-value">{weather.humidity}%</p>
                </div>
              </div>
              <div className="w-stat">
                <Wind size={18} className="text-secondary" />
                <div>
                  <span className="stat-label">Wind</span>
                  <p className="stat-value">{weather.wind_speed} m/s</p>
                </div>
              </div>
              <div className="w-stat">
                <Thermometer size={18} className="text-danger" />
                <div>
                  <span className="stat-label">Feels Like</span>
                  <p className="stat-value">{weather.temp_feels_like}°C</p>
                </div>
              </div>
            </div>

            <div className="weather-stats-row secondary-row">
              <div className="w-stat">
                <Gauge size={18} className="text-warning" />
                <div>
                  <span className="stat-label">Pressure</span>
                  <p className="stat-value">{weather.pressure} hPa</p>
                </div>
              </div>
              <div className="w-stat">
                <Eye size={18} className="text-primary" />
                <div>
                  <span className="stat-label">Visibility</span>
                  <p className="stat-value">{weather.visibility_km ?? "--"} km</p>
                </div>
              </div>
              <div className="w-stat">
                <Wind size={18} className="text-secondary" />
                <div>
                  <span className="stat-label">Wind Gust</span>
                  <p className="stat-value">{weather.wind_gust ?? "--"} m/s</p>
                </div>
              </div>
            </div>
          </div>

          <div className="weather-side-content">
            <div className="card-ngebon recommendation-card-modern">
              <div className="card-header-flex">
                <h3 className="section-title-small"><Sprout size={18} /> Crop Suggestion</h3>
                <span className="badge-soft">Live</span>
              </div>
              <p className="rec-text">{language === "en" ? suggestion.en : suggestion.ml}</p>
            </div>

            <div className="card-ngebon recommendation-card-modern mt-4">
              <div className="card-header-flex">
                <h3 className="section-title-small"><CalendarDays size={18} /> Seasonal Planting</h3>
              </div>
              <p className="rec-text">{language === "en" ? seasonalCrop.en : seasonalCrop.ml}</p>
            </div>

            <div className="card-ngebon recommendation-card-modern mt-4">
              <div className="card-header-flex">
                <h3 className="section-title-small"><CloudSun size={18} /> Air & Sun</h3>
              </div>
              <div className="air-sun-grid">
                <div className="mini-stat">
                  <span className="mini-label">AQI</span>
                  <strong>{weather.aqi ?? "--"}</strong>
                  <small>{aqiLabel[weather.aqi] || "--"}</small>
                </div>
                <div className="mini-stat">
                  <span className="mini-label"><Sunrise size={14} /> Sunrise</span>
                  <strong>{weather.sunrise || "--"}</strong>
                </div>
                <div className="mini-stat">
                  <span className="mini-label"><Sunset size={14} /> Sunset</span>
                  <strong>{weather.sunset || "--"}</strong>
                </div>
              </div>
            </div>

            <div className="card-ngebon recommendation-card-modern mt-4">
              <div className="card-header-flex">
                <h3 className="section-title-small"><CalendarDays size={18} /> {forecastLabel[language]}</h3>
              </div>
              <div className="upcoming-days-list">
                {(weather.upcoming_days || []).map((day) => (
                  <div key={`${day.date}-${day.day}`} className="upcoming-day-item">
                    <div className="upcoming-day-left">
                      <span className="upcoming-day-name">{day.day}</span>
                      <span className="upcoming-day-condition">{day.description || day.condition}</span>
                    </div>
                    <div className="upcoming-day-right">
                      <span className="upcoming-day-temp">{day.temp}°C</span>
                      <span className="upcoming-day-humidity">{day.humidity}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="loading-state-modern">
          <RefreshCw size={40} className="spinner text-success" />
          <p>{loading ? "Updating weather data..." : "No weather data found."}</p>
        </div>
      )}
    </div>
  );
}

export default WeatherPage;
