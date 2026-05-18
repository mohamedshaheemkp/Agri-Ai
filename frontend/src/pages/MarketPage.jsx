import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronLeft,
  RefreshCw,
  MapPin,
  Calendar,
  Layers,
  ShoppingBag
} from "lucide-react";
import { buildApiUrl } from "../config";
import "./MarketPage.css";

function MarketPage() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState("English");
  const [marketData, setMarketData] = useState({});
  const [lastUpdated, setLastUpdated] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const labels = {
    English: {
      today: "Today", yesterday: "Yesterday", unit: "Unit", location: "Location",
      back: "Dashboard", title: "Market Prices",
      categories: { Dairy: "Dairy", Seeds: "Seeds", Vegetables: "Vegetables", Fruits: "Fruits" },
      items: {
        "Cow Milk": "Cow Milk", "Buffalo Milk": "Buffalo Milk", Eggs: "Eggs",
        Wheat: "Wheat", Rice: "Rice", Cotton: "Cotton", Tomato: "Tomato",
        Potato: "Potato", Onion: "Onion", Banana: "Banana", Mango: "Mango", Apple: "Apple",
      },
      locations: {
        "Tamil Nadu": "TN", Haryana: "HR", "Andhra Pradesh": "AP", Delhi: "DL",
        Punjab: "PB", Maharashtra: "MH", Karnataka: "KA", "Uttar Pradesh": "UP",
        Kerala: "KL", "Himachal Pradesh": "HP",
      },
    },
    Malayalam: {
      today: "ഇന്ന്", yesterday: "ഇന്നലെ", unit: "യൂണിറ്റ്", location: "സ്ഥലം",
      back: "ഡാഷ്‌ബോർഡ്", title: "വിപണി വില",
      categories: { Dairy: "ഡയറി", Seeds: "വിത്തുകൾ", Vegetables: "പച്ചക്കറികൾ", Fruits: "പഴങ്ങൾ" },
      items: {
        "Cow Milk": "പശുവിൻ പാൽ", "Buffalo Milk": "എരുമപ്പാൽ", Eggs: "മുട്ട",
        Wheat: "ഗോതമ്പ്", Rice: "അരി", Cotton: "പരുത്തി", Tomato: "തക്കാളി",
        Potato: "ഉരുളക്കിഴങ്ങ്", Onion: "ഉള്ളി", Banana: "വാഴപ്പഴം", Mango: "മാമ്പഴം", Apple: "ആപ്പിൾ",
      },
      locations: {
        "Tamil Nadu": "തമിഴ്നാട്", Haryana: "ഹരിയാന", "Andhra Pradesh": "ആന്ധ്രാപ്രദേശ്",
        Delhi: "ഡൽഹി", Punjab: "പഞ്ചാബ്", Maharashtra: "മഹാരാഷ്ട്ര",
        Karnataka: "കർണ്ണാടക", उത്തർപ്രദേശ്: "ഉത്തർപ്രദേശ്", Kerala: "കേരളം",
        "Himachal Pradesh": "ഹിമാചൽ പ്രദേശ്",
      },
    },
  };

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const res = await fetch(buildApiUrl("/market"));
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        const data = await res.json();
        if (isMounted) {
          setMarketData(data.market || {});
          setLastUpdated(data.as_of || "");
          setError("");
          setLoading(false);
        }
      } catch (err) { if (isMounted) { setError("Failed to load data."); setLoading(false); } }
    };
    fetchData();
    const timer = setInterval(fetchData, 60000);
    return () => { isMounted = false; clearInterval(timer); };
  }, []);

  const getTrendIcon = (today, yesterday) => {
    if (today > yesterday) return <TrendingUp className="text-danger" size={16} />;
    if (today < yesterday) return <TrendingDown className="text-success" size={16} />;
    return <Minus className="text-muted" size={16} />;
  };

  return (
    <div className="market-page-modern reveal-anim">
      <div className="page-header-flex">
        <div className="header-text">
          <div className="header-icon-small"><ShoppingBag size={24} /></div>
          <div>
            <h1>{labels[language].title}</h1>
            <p className="subtitle">Real-time agricultural commodity rates.</p>
          </div>
        </div>
        <div className="header-actions-market">
          <div className="language-switcher-modern">
            <button className={`switch-pill ${language === 'English' ? 'active' : ''}`} onClick={() => setLanguage('English')}>EN</button>
            <button className={`switch-pill ${language === 'Malayalam' ? 'active' : ''}`} onClick={() => setLanguage('Malayalam')}>ML</button>
          </div>
          <button className="btn-back-soft" onClick={() => navigate("/dashboard")}>
            <ChevronLeft size={16} /> {labels[language].back}
          </button>
        </div>
      </div>

      <div className="market-status-bar">
        {loading ? <div className="status-item"><RefreshCw size={14} className="spinner" /> Updating...</div> : (
          <div className="status-item"><Calendar size={14} /> Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : "N/A"}</div>
        )}
      </div>

      {error && <div className="market-error">{error}</div>}

      <div className="market-categories-grid">
        {!loading && !error && Object.keys(marketData).length === 0 && (
          <div className="market-empty">No market prices available right now.</div>
        )}
        {Object.keys(marketData).map((category, i) => (
          <div key={i} className="market-category-section">
            <div className="category-header-modern">
              <Layers size={18} className="text-success" />
              <h3>{labels[language].categories[category]}</h3>
            </div>

            <div className="market-items-grid">
              {(marketData[category] || []).map((m, j) => (
                <div key={j} className="card-ngebon market-item-card">
                  <div className="item-header">
                    <h4>{labels[language].items[m.item]}</h4>
                    {getTrendIcon(m.price, m.yesterday)}
                  </div>

                  <div className="price-row-main">
                    <span className="price-val">₹{m.price}</span>
                    <span className="unit-label">/ {m.unit}</span>
                  </div>

                  <div className="item-stats-grid">
                    <div className="item-stat">
                      <span className="stat-lbl">Yesterday</span>
                      <p className="stat-val">₹{m.yesterday}</p>
                    </div>
                    <div className="item-stat">
                      <span className="stat-lbl">Location</span>
                      <p className="stat-val"><MapPin size={10} /> {labels[language].locations[m.location] || m.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MarketPage;
