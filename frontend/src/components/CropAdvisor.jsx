import React, { useState, useCallback } from "react";
import { buildApiUrl } from "../config";
import { Upload, Search, CheckCircle2, AlertCircle, Info, Leaf } from "lucide-react";
import "./CropAdvisor.css";

function CropAdvisor() {
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [diseasePrediction, setDiseasePrediction] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(null);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      setImageUrl(URL.createObjectURL(file));
      setImageError(null);
      setDiseasePrediction(null);
    } else {
      setImageError("Please select a valid image file.");
      setImageFile(null);
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      setImageUrl(null);
    }
  };

  const detectDisease = useCallback(async () => {
    if (!imageFile) return setImageError("Please upload an image first.");
    setImageLoading(true);
    setImageError(null);
    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      const response = await fetch(buildApiUrl("/detect"), { method: "POST", body: formData });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.detail || result?.error || "Backend analysis failed.");
      }

      if (!result || !Array.isArray(result.detections)) {
        throw new Error("Invalid response from backend. Please try again.");
      }

      if (result.detections.length === 0) {
        setDiseasePrediction({
          Type: "Crop",
          Species: "No specific pest/disease detected",
          Disease: "Healthy",
          Treatment: "No immediate issue found. You can try a clearer close-up image for more accuracy.",
        });
        return;
      }

      const det = result.detections[0];
      setDiseasePrediction({
        Type: det.class_name.includes("Animal") || det.class_name.includes("Cow") ? "Animal" : "Crop",
        Species: det.class_name,
        Disease: det.treatment && det.treatment.length > 0 && det.treatment[0] !== "nan" ? "Attention Required" : "Healthy",
        Treatment: det.treatment && det.treatment.length > 0 ? det.treatment.join(", ") : "No specific treatment needed",
      });
    } catch (e) {
      setImageError(e.message);
    } finally {
      setImageLoading(false);
    }
  }, [imageFile]);

  return (
    <div className="crop-advisor-modern">
      <div className="page-header">
        <div className="header-icon"><Leaf size={28} /></div>
        <div className="header-text">
          <h1>Disease Detection Agent</h1>
          <p>AI-powered analysis and early disease identification for crops and livestock.</p>
        </div>
      </div>

      <div className="grid-2-col">
        <div className="card-ngebon upload-section-card">
          <div className="card-header-flex">
            <h3>Upload Image</h3>
            <div className="info-tooltip">
              <Info size={16} />
              <span>Tip: Use close-up leaf photos</span>
            </div>
          </div>

          <div className="upload-container">
            <input type="file" id="img-up" className="hidden" accept="image/*" onChange={handleImageChange} />
            <label htmlFor="img-up" className={`upload-area-modern ${imageUrl ? 'has-image' : ''}`}>
              {imageUrl ? (
                <div className="preview-overlay">
                  <img src={imageUrl} alt="preview" />
                  <div className="change-hint">Change Image</div>
                </div>
              ) : (
                <>
                  <div className="upload-icon-circle"><Upload size={24} /></div>
                  <p className="main-hint">Click to upload image</p>
                  <p className="sub-hint">JPG, PNG up to 10MB</p>
                </>
              )}
            </label>
          </div>

          <button className="btn-primary w-100 mt-4" onClick={detectDisease} disabled={!imageFile || imageLoading}>
            {imageLoading ? "Analyzing..." : "Start AI Analysis"}
            <Search size={18} className="ms-2" />
          </button>
        </div>

        <div className="results-col">
          {imageError && (
            <div className="alert-modern error">
              <AlertCircle size={20} />
              <span>{imageError}</span>
            </div>
          )}

          {diseasePrediction ? (
            <div className="card-ngebon results-card-modern">
              <div className="results-header">
                <CheckCircle2 size={24} className={diseasePrediction.Disease === "Healthy" ? "text-success" : "text-warning"} />
                <h3>Analysis Results</h3>
              </div>

              <div className="result-stats">
                <div className="res-stat-item">
                  <span className="res-label">Asset Type</span>
                  <p className="res-val">{diseasePrediction.Type}</p>
                </div>
                <div className="res-stat-item">
                  <span className="res-label">Species</span>
                  <p className="res-val">{diseasePrediction.Species}</p>
                </div>
              </div>

              <div className={`status-banner ${diseasePrediction.Disease === "Healthy" ? "healthy" : "warning"}`}>
                <span className="status-dot"></span>
                <span>Status: {diseasePrediction.Disease}</span>
              </div>

              <div className="treatment-box">
                <p className="treatment-label">Recommendation / Treatment</p>
                <p className="treatment-text">{diseasePrediction.Treatment}</p>
              </div>

              <div className="ai-disclaimer">
                <Info size={14} />
                <span>AI result. Please consult an expert for critical decisions.</span>
              </div>
            </div>
          ) : !imageLoading && !imageError && (
            <div className="empty-results-hint">
              <div className="hint-icon"><Search size={40} /></div>
              <h3>No Results Yet</h3>
              <p>Upload an image and click analyze to see the AI diagnosis here.</p>
            </div>
          )}

          {imageLoading && (
            <div className="loading-animation-container">
              <div className="loading-spinner"></div>
              <p>Scanning for disease markers...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CropAdvisor;