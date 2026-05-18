import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sprout,
  CloudRain,
  Leaf,
  Loader2,
  FlaskConical,
  AlertTriangle,
  MapPin,
  ChevronLeft,
  Upload,
  Search,
  CheckCircle2,
  Thermometer,
  Layers
} from 'lucide-react';
import { buildApiUrl } from "../config";
import "./SoilAdvisor.css";

const InfoCardModern = ({ icon: Icon, title, value, className = '' }) => (
  <div className={`info-card-modern ${className}`}>
    <div className="icon-wrapper-modern"><Icon size={20} /></div>
    <div className="text-content-modern">
      <p className="card-title-modern">{title}</p>
      <p className="card-value-modern">{value}</p>
    </div>
  </div>
);

function SoilAdvisor() {
  const navigate = useNavigate();
  const [soilImage, setSoilImage] = useState(null);
  const [soilImageUrl, setSoilImageUrl] = useState(null);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [analysisMode, setAnalysisMode] = useState("coordinates");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSoilImage(file);
      setSoilImageUrl(URL.createObjectURL(file));
      setError(null);
      setAnalysis(null);
      setAnalysisMode("image");
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toFixed(4));
          setLongitude(position.coords.longitude.toFixed(4));
          setLoading(false);
          setError(null);
        },
        () => {
          setError("Unable to get location. Enter manually.");
          setLoading(false);
        }
      );
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      if (analysisMode === "coordinates") {
        const res = await fetch(buildApiUrl(`/soil-prediction?lat=${latitude}&lon=${longitude}`));
        const data = await res.json();
        if (data.status === "success") setAnalysis(data);
        else throw new Error("Analysis failed");
      } else {
        const formData = new FormData();
        formData.append("file", soilImage);
        const res = await fetch(buildApiUrl("/analyze-soil-image"), { method: "POST", body: formData });
        if (res.status === 404) {
          // Default analysis if endpoint doesn't exist (as in original code)
          setAnalysis({
            status: "success",
            soil_type: "Loamy Soil Template",
            characteristics: "Rich in organic matter, good drainage, and high nutrient retention.",
            best_crops: "Rubber, Coconut, Black Pepper, Cocoa",
            nutrients: { pH: 6.8, nitrogen: "High", phosphorus: "Medium", potassium: "High" },
            recommendations: ["Maintain organic cover", "Rotate crops seasonally", "Check moisture regularly"],
            image_based: true
          });
        } else {
          const data = await res.json();
          setAnalysis(data);
        }
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="soil-advisor-modern">
      <div className="page-header">
        <div className="header-icon"><FlaskConical size={28} /></div>
        <div className="header-text">
          <h1>Soil Analysis Agent</h1>
          <p>Location-based or image-driven soil health analysis for precision farming.</p>
        </div>
      </div>

      <div className="grid-2-col">
        <div className="card-ngebon input-collection-card">
          <div className="card-header-flex">
            <h3>Analysis Input</h3>
            <button className="btn-back-soft" onClick={() => navigate('/dashboard')}><ChevronLeft size={16} /> Back</button>
          </div>

          <div className="mode-toggle-pills">
            <button className={`mode-pill ${analysisMode === "image" ? "active" : ""}`} onClick={() => setAnalysisMode("image")}>
              <Upload size={16} /> Image
            </button>
            <button className={`mode-pill ${analysisMode === "coordinates" ? "active" : ""}`} onClick={() => setAnalysisMode("coordinates")}>
              <MapPin size={16} /> Location
            </button>
          </div>

          {analysisMode === "image" ? (
            <div className="upload-section-soil">
              <input type="file" id="soil-up" className="hidden" accept="image/*" onChange={handleImageChange} />
              <label htmlFor="soil-up" className={`soil-upload-area ${soilImageUrl ? 'has-img' : ''}`}>
                {soilImageUrl ? <img src={soilImageUrl} alt="preview" /> : <><Upload size={24} /><p>Upload soil photo</p></>}
              </label>
            </div>
          ) : (
            <div className="location-section-soil">
              <div className="coord-inputs">
                <div className="input-group-modern">
                  <label>Latitude</label>
                  <input type="number" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="0.000" />
                </div>
                <div className="input-group-modern">
                  <label>Longitude</label>
                  <input type="number" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="0.000" />
                </div>
              </div>
              <button className="btn-secondary-modern" onClick={getLocation}><MapPin size={16} /> Use My Location</button>
            </div>
          )}

          <button className="btn-primary w-100 mt-4" onClick={handleAnalyze} disabled={loading || (analysisMode === "image" ? !soilImage : !latitude)}>
            {loading ? <Loader2 className="spinner" size={18} /> : "Start Analysis"}
            <Search size={18} className="ms-2" />
          </button>
        </div>

        <div className="results-col">
          {error && <div className="alert-modern error"><AlertTriangle size={18} /> {error}</div>}

          {analysis && (
            <div className="card-ngebon analysis-results-card reveal-anim">
              <div className="results-header-modern">
                <CheckCircle2 size={24} className="text-success" />
                <h3>Analysis Results</h3>
              </div>

              <div className="analysis-pills-row">
                <InfoCardModern icon={Layers} title="Soil Type" value={analysis.soil_type} className="soil-type-pill" />
                <InfoCardModern icon={Thermometer} title="pH Level" value={analysis.nutrients?.pH || "6.5"} className="ph-pill" />
                <InfoCardModern icon={Sprout} title="Nitrogen" value={analysis.nutrients?.nitrogen || "Medium"} className="n-pill" />
              </div>

              <div className="result-detail-section">
                <h4><Leaf size={18} /> Best Crops</h4>
                <p className="recommendation-text">{analysis.best_crops}</p>
              </div>

              <div className="result-detail-section">
                <h4><CheckCircle2 size={18} /> Recommendations</h4>
                <ul className="benefit-list">
                  {analysis.recommendations?.map((rec, i) => <li key={i}>{rec}</li>)}
                </ul>
              </div>

              <div className="ai-disclaimer-footer">
                <Info size={14} />
                <span>AI Prediction. Results may vary by season and local conditions.</span>
              </div>
            </div>
          )}

          {!analysis && !loading && !error && (
            <div className="empty-results-hint">
              <div className="hint-icon"><FlaskConical size={40} /></div>
              <h3>Ready for Analysis</h3>
              <p>Provide location or image to get smart soil insights.</p>
            </div>
          )}

          {loading && (
            <div className="loading-animation-container">
              <div className="loading-spinner"></div>
              <p>Scanning soil patterns...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Info = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-info"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
);

export default SoilAdvisor;
