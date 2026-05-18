import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Landmark, Search, Globe, ChevronLeft, ChevronRight, ExternalLink, Filter, Info, InfoIcon, Loader2 } from "lucide-react";
import { buildApiUrl } from "../config";
import "./GovtSchemes.css";

function GovtSchemes() {
  const [language, setLanguage] = useState("en");
  const [category, setCategory] = useState("all");
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const res = await fetch(buildApiUrl("/schemes"));
        const data = await res.json();
        setSchemes(data);
      } catch (err) {
        console.error("Failed to fetch schemes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchemes();
  }, []);

  const filteredSchemes =
    category === "all" ? schemes : schemes.filter((s) => s.category === category);

  return (
    <div className="govt-schemes-modern reveal-anim">
      <div className="page-header-flex">
        <div className="header-text">
          <div className="header-icon-small"><Landmark size={24} /></div>
          <div>
            <h1>{language === "en" ? "Government Schemes" : "സർക്കാർ പദ്ധതികൾ"}</h1>
            <p>{language === "en" ? "Subsidies, loans, and benefits for you." : "നിങ്ങൾക്കായുള്ള സബ്‌സിഡികൾ, വായ്പകൾ, ആനുകൂല്യങ്ങൾ."}</p>
          </div>
        </div>
        <div className="language-switcher-modern">
          <button className={`switch-pill ${language === 'en' ? 'active' : ''}`} onClick={() => setLanguage('en')}>EN</button>
          <button className={`switch-pill ${language === 'ml' ? 'active' : ''}`} onClick={() => setLanguage('ml')}>ML</button>
        </div>
      </div>

      <div className="card-ngebon filter-bar-modern">
        <div className="filter-group">
          <Filter size={18} className="text-muted" />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">{language === "en" ? "All Categories" : "എല്ലാ വിഭാഗങ്ങളും"}</option>
            <option value="Seeds">{language === "en" ? "Seeds" : "വിത്തുകൾ"}</option>
            <option value="Fertilizer">{language === "en" ? "Fertilizer" : "വളം"}</option>
            <option value="Irrigation">{language === "en" ? "Irrigation" : "ജലസേചനം"}</option>
            <option value="Loan">{language === "en" ? "Loan" : "വായ്പ"}</option>
            <option value="Insurance">{language === "en" ? "Insurance" : "ഇൻഷുറൻസ്"}</option>
          </select>
        </div>
        <button className="btn-back-soft ms-auto" onClick={() => navigate("/dashboard")}>
          <ChevronLeft size={16} /> {language === "en" ? "Dashboard" : "ഡാഷ്‌ബോർഡ്"}
        </button>
      </div>

      {loading ? (
        <div className="loading-state-schemes">
          <Loader2 size={40} className="spinner" />
          <p>Updating latest schemes from NPCI & Govt Databases...</p>
        </div>
      ) : (
        <div className="schemes-grid">
          {filteredSchemes.map((scheme) => (
            <div key={scheme.id} className="card-ngebon scheme-item-modern">
              <div className="scheme-header">
                <span className="category-pill">{scheme.category}</span>
                <h3 className="scheme-title">{scheme.title[language]}</h3>
              </div>
              <p className="scheme-desc">{scheme.desc[language]}</p>

              <div className="info-blocks">
                <div className="info-block">
                  <span className="info-label"><Globe size={14} /> Eligibility</span>
                  <p className="info-val">{scheme.eligibility[language]}</p>
                </div>
                <div className="info-block">
                  <span className="info-label"><InfoIcon size={14} /> Requirements</span>
                  <p className="info-val">{scheme.requirements[language]}</p>
                </div>
              </div>

              <a href={scheme.link} target="_blank" rel="noopener noreferrer" className="btn-scheme-apply">
                {language === "en" ? "View Full Details" : "വിശദാംശങ്ങൾ കാണുക"}
                <ExternalLink size={16} />
              </a>
            </div>
          ))}
          {filteredSchemes.length === 0 && (
            <div className="empty-schemes">No schemes found in this category.</div>
          )}
        </div>
      )}
    </div>
  );
}

export default GovtSchemes;
