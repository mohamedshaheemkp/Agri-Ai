import React, { useCallback, useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera, CheckCircle2, Download, X, AlertCircle, Lightbulb, Monitor, ShieldCheck, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../config';
import './recognisation.css';

const LiveVideoDetection = () => {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isLiveActive, setIsLiveActive] = useState(true);
  const isRequesting = useRef(false);

  const drawDetections = useCallback((detections = []) => {
    const video = webcamRef.current?.video;
    const canvas = overlayCanvasRef.current;
    const wrapper = canvas?.parentElement;

    if (!video || !canvas || !wrapper) return;

    const sourceWidth = video.videoWidth;
    const sourceHeight = video.videoHeight;
    const { width: displayWidth, height: displayHeight } = wrapper.getBoundingClientRect();

    if (!sourceWidth || !sourceHeight || !displayWidth || !displayHeight) return;

    canvas.width = Math.round(displayWidth);
    canvas.height = Math.round(displayHeight);

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = canvas.width / sourceWidth;
    const scaleY = canvas.height / sourceHeight;

    detections.forEach((det) => {
      const [x1, y1, x2, y2] = det.bbox || [];
      if ([x1, y1, x2, y2].some((value) => typeof value !== 'number')) return;

      const left = x1 * scaleX;
      const top = y1 * scaleY;
      const width = (x2 - x1) * scaleX;
      const height = (y2 - y1) * scaleY;
      const label = `${det.class_name} ${(det.confidence * 100).toFixed(0)}%`;

      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.fillStyle = 'rgba(34, 197, 94, 0.18)';
      ctx.strokeRect(left, top, width, height);
      ctx.fillRect(left, top, width, height);

      ctx.font = '600 16px Arial';
      const textWidth = ctx.measureText(label).width;
      const textHeight = 24;
      const textY = top > textHeight + 8 ? top - 8 : top + textHeight + 8;

      ctx.fillStyle = '#22c55e';
      ctx.fillRect(left, textY - textHeight, textWidth + 16, textHeight);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, left + 8, textY - 7);
    });
  }, []);

  useEffect(() => {
    drawDetections(analysisResults?.detections || []);
  }, [analysisResults, drawDetections]);

  useEffect(() => {
    const handleResize = () => drawDetections(analysisResults?.detections || []);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [analysisResults, drawDetections]);

  // Live auto-polling effect
  useEffect(() => {
    let intervalId;
    
    const fetchLiveFrame = async () => {
      // Don't fetch if paused, missing camera, request in flight, or modal open
      if (!isLiveActive || !webcamRef.current || isRequesting.current || showModal) return;
      
      const video = webcamRef.current.video;
      if (!video || video.readyState !== 4) return;

      isRequesting.current = true;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        
        canvas.toBlob(async (blob) => {
          try {
            const formData = new FormData();
            formData.append('file', blob, 'live_frame.jpg');
            // Send silently
            const res = await fetch(buildApiUrl('/detect'), { method: 'POST', body: formData });
            if (res.ok) {
              const data = await res.json();
              if (isLiveActive && !document.querySelector('.modal-overlay-modern')) {
                setAnalysisResults({ detections: data.detections || [], ts: new Date().toLocaleTimeString() });
              }
            }
          } catch (e) {
            console.error("Live feed API error:", e);
          } finally {
            isRequesting.current = false;
          }
        }, 'image/jpeg', 0.6); // Slightly lower quality for faster transfer
      } catch (err) {
        isRequesting.current = false;
      }
    };

    if (isLiveActive && !showModal) {
      intervalId = setInterval(fetchLiveFrame, 1500); // Poll every 1.5 seconds
    }

    return () => clearInterval(intervalId);
  }, [isLiveActive, showModal]);

  const captureAndAnalyze = async () => {
    if (!webcamRef.current || analyzing) return;
    setError(null);
    setAnalyzing(true);
    const video = webcamRef.current.video;
    if (!video || video.readyState !== 4) {
      setError('Camera is not ready yet. Please wait a moment and try again.');
      setAnalyzing(false);
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const img = canvas.toDataURL('image/jpeg');
    setCapturedImage(img);

    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append('file', blob, 'screenshot.jpg');
      try {
        const res = await fetch(buildApiUrl('/detect'), { method: 'POST', body: formData });
        const data = await res.json();
        const results = { detections: data.detections || [], ts: new Date().toLocaleTimeString() };
        setAnalysisResults(results);
        setShowModal(true);
      } catch (err) { setError(err.message); }
      finally { setAnalyzing(false); }
    }, 'image/jpeg');
  };

  return (
    <div className="app-container-live reveal-anim">
      <div className="main-monitor-card">
        <div className="card-header-flex">
          <div className="header-monitor">
            <div className="monitor-icon-wrapper"><Monitor size={28} /></div>
            <div className="monitor-text">
              <h1 className="monitor-title">Live Feed Analysis</h1>
              <p className="subtitle">Use your live camera feed to analyze a leaf image instantly.</p>
            </div>
          </div>
          <button className="btn-back-soft" onClick={() => navigate('/dashboard')}><ChevronLeft size={16} /> Back</button>
        </div>

        <div className="live-feed-wrapper">
          <Webcam
            audio={false}
            ref={webcamRef}
            className="live-webcam-feed"
            screenshotFormat="image/jpeg"
            style={{ width: '100%', display: 'block' }}
            videoConstraints={{ facingMode: "environment" }}
            onUserMedia={() => drawDetections(analysisResults?.detections || [])}
          />
          <canvas ref={overlayCanvasRef} className="live-detection-overlay" />
        </div>

        {analysisResults?.detections?.length > 0 && (
          <p className="live-detection-hint">
            Showing {analysisResults.detections.length} detection{analysisResults.detections.length > 1 ? 's' : ''} on the live feed.
          </p>
        )}

        <div className="detection-btn-group" style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button 
            onClick={() => setIsLiveActive(!isLiveActive)} 
            className="btn-monitor"
            style={{ backgroundColor: isLiveActive ? '#64748b' : '#22c55e', color: 'white', border: 'none' }}
          >
            {isLiveActive ? '⏸ Pause Live Detect' : '▶ Resume Live Detect'}
          </button>
          <button onClick={captureAndAnalyze} disabled={analyzing} className="btn-monitor btn-capture">
            <Camera size={20} /> {analyzing ? 'Analyzing...' : 'Snapshot Details'}
          </button>
        </div>

        {error && <div className="error-msg-monitor"><AlertCircle size={20} /> {error}</div>}
      </div>

      {showModal && (
        <div className="modal-overlay-modern" onClick={() => setShowModal(false)}>
          <div className="modal-content-modern" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-flex">
              <h2><ShieldCheck size={24} className="text-success" /> Analysis Snapshot</h2>
              <button className="btn-close-modal" onClick={() => setShowModal(false)}><X size={24} /></button>
            </div>

            {capturedImage && (
              <div className="snapshot-preview">
                <img src={capturedImage} alt="Snapshot" />
                <button className="btn-download-soft" onClick={() => {
                  const link = document.createElement('a');
                  link.href = capturedImage;
                  link.download = `monitor-${Date.now()}.jpg`;
                  link.click();
                }}><Download size={16} /> Save Image</button>
              </div>
            )}

            <div className="results-grid-monitor">
              {analysisResults?.detections.length > 0 ? analysisResults.detections.map((det, i) => (
                <div key={i} className="detection-item-modern">
                  <div className="card-header-flex">
                    <span className="detection-class">{det.class_name}</span>
                    <span className="detection-badge">{(det.confidence * 100).toFixed(0)}% Match</span>
                  </div>
                  {det.treatment && (
                    <div className="remedy-list mt-3">
                      <p className="hint-label-small"><Lightbulb size={14} /> Recommended Action</p>
                      <ul className="benefit-list">
                        {det.treatment.map((t, j) => <li key={j}>{t}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )) : <div className="empty-results-hint"><CheckCircle2 size={40} className="text-success" /><p>No immediate issues detected!</p></div>}
            </div>

            <button className="btn-primary w-100 mt-4" onClick={() => setShowModal(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveVideoDetection;
