import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  CheckCircle,
  AlertCircle,
  Plus,
  Coins,
  FlaskConical,
  CloudRain,
  Newspaper,
  X,
  Video,
  Sprout
} from "lucide-react";
import { buildApiUrl } from "../config";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState("Wabweni Farmer");
  const [tasks, setTasks] = useState([]);

  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState("");
  const [climateRisk, setClimateRisk] = useState(null);

  const [activeModal, setActiveModal] = useState(null); // 'risk', 'reward', 'news', 'optimize'
  const [selectedNews, setSelectedNews] = useState(null);

  const formatDueDate = (dueDate) => {
    if (!dueDate) return "No due date";
    const parsedDate = new Date(dueDate);
    if (Number.isNaN(parsedDate.getTime())) return dueDate;
    return parsedDate.toLocaleString();
  };

  const getPendingCattleTasks = () => {
    const cattleRaw = localStorage.getItem("cattleRecords");
    const pendingCattleTasks = [];

    if (cattleRaw) {
      try {
        const cattleRecords = JSON.parse(cattleRaw);
        Object.entries(cattleRecords || {}).forEach(([tab, items]) => {
          if (!Array.isArray(items)) return;
          items
            .filter((item) => !item.done)
            .forEach((item) => {
              pendingCattleTasks.push({
                id: `cattle-${tab}-${item.id || Date.now()}-${item.animal || "entry"}`,
                title: `${tab.charAt(0).toUpperCase() + tab.slice(1)}: ${item.animal || "Cattle"}`,
                dueDate: item.date || "",
                notes: item.yield ? `Yield: ${item.yield} L` : "Cattle record pending verification",
                priority: "Medium",
              });
            });
        });
      } catch (err) {
        console.error("Failed to parse cattleRecords:", err);
      }
    }

    return pendingCattleTasks;
  };

  const loadPendingTasks = useCallback(() => {
    const savedTasks = localStorage.getItem("farmerTasks");
    let pendingFarmTasks = [];

    if (savedTasks) {
      try {
        pendingFarmTasks = JSON.parse(savedTasks).filter((task) => !task.done);
      } catch (err) {
        console.error("Failed to parse farmerTasks:", err);
      }
    }

    const pendingCattleTasks = getPendingCattleTasks();
    setTasks([...pendingFarmTasks, ...pendingCattleTasks]);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("userName");
    if (saved) setUserName(saved);

    loadPendingTasks();

    const fetchAgroInfo = async () => {
      try {
        setNewsLoading(true);
        setNewsError("");
        const newsRes = await fetch(buildApiUrl("/news"));
        if (!newsRes.ok) throw new Error("Failed to fetch live news");
        const newsData = await newsRes.json();
        setNews(Array.isArray(newsData) ? newsData : []);

        const riskRes = await fetch(buildApiUrl("/climate-risk"));
        const riskData = await riskRes.json();
        setClimateRisk(riskData);
      } catch (err) {
        console.error("AgroInfo Fetch Error:", err);
        setNewsError("Unable to load latest news right now.");
      } finally {
        setNewsLoading(false);
      }
    };
    fetchAgroInfo();
  }, [loadPendingTasks]);

  useEffect(() => {
    const syncTasks = () => loadPendingTasks();
    const syncOnVisible = () => {
      if (document.visibilityState === "visible") syncTasks();
    };

    window.addEventListener("focus", syncTasks);
    window.addEventListener("storage", syncTasks);
    window.addEventListener("farmerTasksUpdated", syncTasks);
    window.addEventListener("cattleRecordsUpdated", syncTasks);
    document.addEventListener("visibilitychange", syncOnVisible);

    return () => {
      window.removeEventListener("focus", syncTasks);
      window.removeEventListener("storage", syncTasks);
      window.removeEventListener("farmerTasksUpdated", syncTasks);
      window.removeEventListener("cattleRecordsUpdated", syncTasks);
      document.removeEventListener("visibilitychange", syncOnVisible);
    };
  }, [loadPendingTasks]);

  useEffect(() => {
    loadPendingTasks();
  }, [location.pathname, loadPendingTasks]);

  const quickLinks = [
    { name: "Live Feed Analysis", icon: <Video size={24} />, path: "/live-video", sub: "Use the live camera feed to analyze crop issues", primary: true },
    { name: "Image Disease Check", icon: <Sprout size={24} />, path: "/crop-advisor", sub: "Upload image for crop diagnosis" },
    { name: "Soil Advisor", icon: <FlaskConical size={24} />, path: "/soil-advisor", sub: "Nutrient and soil support" },
    { name: "Farm Tasks", icon: <Coins size={24} />, path: "/farm-management", sub: "Track field activities" },
    { name: "Weather Alerts", icon: <CloudRain size={24} />, path: "/weather", sub: "Forecast before spraying" },
  ];

  return (
    <div className="dashboard-ngebon reveal-anim">
      {/* Climate Risk Banner */}
      {climateRisk && (
        <div className="climate-risk-banner-agro">
          <div className="risk-icon-pulse">
            <AlertCircle size={20} />
          </div>
          <div className="risk-text-agro">
            <strong>{climateRisk.title}:</strong> {climateRisk.message}
          </div>
          <button className="btn-risk-action" onClick={() => setActiveModal('risk')}>View Mitigation Plan</button>
        </div>
      )}

      {/* Hero Section */}
      <div className="dashboard-hero-agro">
        <div className="hero-content-agro">
          <div className="hero-text-block">
            <h1>Welcome back, {userName}!</h1>
            <p>Ready to use the live feed to analyze plant diseases, pests, and weeds?</p>
            <button className="btn-hero-opt primary-detection-btn" onClick={() => navigate('/live-video')}>
              <Video size={20} />
              <span>Open Live Feed Analysis</span>
            </button>
          </div>
        </div>

        <div className="hero-stats-row-agro">
          <div className="hero-stat-box">
            <span className="hero-stat-label">Active Crops</span>
            <p className="hero-stat-value">3</p>
          </div>
          <div className="hero-stat-divider"></div>
          <div className="hero-stat-box">
            <span className="hero-stat-label">Pending Tasks</span>
            <p className="hero-stat-value">{tasks.length}</p>
          </div>
        </div>
      </div>

      {/* Quick Access Grid (Fused from Old Dashboard) */}
      <div className="quick-access-grid-agro">
        {quickLinks.map((link, idx) => (
          <div key={idx} className={`card-ngebon quick-link-card ${link.primary ? 'primary-highlight' : ''}`} onClick={() => navigate(link.path)}>
            <div className="quick-icon-agro">{link.icon}</div>
            <div className="quick-link-text">
              <h4>{link.name}</h4>
              <p>{link.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="dashboard-body-columns">
        {/* Tasks & Vaccinations (Fused from Old Dashboard) */}
        <div className="card-ngebon body-col-card">
          <div className="col-header-agro">
            <h3>📝 My Tasks & Vaccinations</h3>
            <button className="btn-agro-pill primary" onClick={() => navigate('/farm-management')}><Plus size={14} /> Add New</button>
          </div>
          <div className="task-list-agro">
            {tasks.length > 0 ? tasks.map((task) => (
              <div key={task.id} className="task-item-agro">
                <div className={`task-icon-circle ${(task.priority || "medium").toLowerCase()}`}>
                  {task.priority === "High" ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                </div>
                <div className="task-info-agro">
                  <div className="task-title-row">
                    <span className="task-title-agro">{task.title}</span>
                    <span className={`task-priority-badge ${(task.priority || "medium").toLowerCase()}`}>{task.priority || "Medium"}</span>
                  </div>
                  {task.notes && <p className="task-desc-agro">{task.notes}</p>}
                  <span className="task-due-agro">Due {formatDueDate(task.dueDate)}</span>
                </div>
              </div>
            )) : (
              <div className="empty-tasks-agro">No pending tasks or vaccinations 🎊</div>
            )}
          </div>
          <button className="btn-view-all-soft" onClick={() => navigate('/farm-management')}>View All Schedule</button>
        </div>
      </div>

      {/* Trending Agriculture News (Fused from Old Dashboard) */}
      <div className="news-section-agro mt-4">
        <div className="section-header-agro mb-3">
          <h3>🔥 Trending Agriculture News</h3>
        </div>
        <div className="news-grid-agro">
          {newsLoading ? (
            <div className="card-ngebon news-card-agro">
              <div className="news-content-agro">
                <p className="news-title-agro">Loading latest agriculture news...</p>
              </div>
            </div>
          ) : newsError ? (
            <div className="card-ngebon news-card-agro">
              <div className="news-content-agro">
                <p className="news-title-agro">{newsError}</p>
              </div>
            </div>
          ) : news.length === 0 ? (
            <div className="card-ngebon news-card-agro">
              <div className="news-content-agro">
                <p className="news-title-agro">No news available at the moment.</p>
              </div>
            </div>
          ) : news.map((item) => (
            <div key={item.id} className="card-ngebon news-card-agro" onClick={() => { setSelectedNews(item); setActiveModal('news'); }}>
              <div className="news-content-agro">
                <p className="news-title-agro">{item.title}</p>
                <div className="news-meta-row">
                  <span className="news-date">{item.date}</span>
                  <span className="news-tag-trending">{item.category || "Trending"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Global Modals for Functionality */}
      {activeModal === 'risk' && climateRisk && (
        <div className="agent-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="agent-modal-content" onClick={e => e.stopPropagation()}>
            <button className="btn-close-modal" onClick={() => setActiveModal(null)}><X size={20} /></button>
            <div className="modal-agent-header">
              <div className="modal-agent-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
                <AlertCircle size={32} />
              </div>
              <div className="modal-agent-title">
                <h2>{climateRisk.title}</h2>
                <span className="agent-status-tag calculating">{climateRisk.severity} Severity</span>
              </div>
            </div>
            <div className="modal-intelligence-body">
              <h4>Recommended Actions</h4>
              <ul className="benefit-list">
                {climateRisk.mitigation_plan.map((step, i) => <li key={i}>{step}</li>)}
              </ul>
            </div>
            <button className="btn-modal-primary" style={{ background: '#dc2626' }} onClick={() => setActiveModal(null)}>Confirm Execution</button>
          </div>
        </div>
      )}

      {activeModal === 'news' && selectedNews && (
        <div className="agent-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="agent-modal-content" onClick={e => e.stopPropagation()}>
            <button className="btn-close-modal" onClick={() => setActiveModal(null)}><X size={20} /></button>
            <div className="modal-agent-header">
              <div className="modal-agent-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                <Newspaper size={32} />
              </div>
              <div className="modal-agent-title">
                <h2>Agriculture News</h2>
                <span className="news-date">{selectedNews.date}</span>
              </div>
            </div>
            <div className="modal-intelligence-body">
              <h4>{selectedNews.title}</h4>
              <p>{selectedNews.content}</p>
              {selectedNews.url && (
                <a href={selectedNews.url} target="_blank" rel="noreferrer" className="btn-view-all-soft" style={{ display: "inline-block", marginTop: "10px" }}>
                  Read full article
                </a>
              )}
            </div>
            <button className="btn-modal-primary" onClick={() => setActiveModal(null)}>Close Article</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;