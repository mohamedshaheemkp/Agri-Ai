import React, { useState } from "react";
import { 
  FlaskConical, 
  CloudRain, 
  Zap, 
  Sprout, 
  TrendingUp, 
  Building2, 
  AlertTriangle, 
  Info,
  X,
  Activity,
  CheckCircle2
} from "lucide-react";
import "./AgentHub.css";

const agents = [
  { id: 7, name: "Disease Detection", desc: "Early disease identification", icon: <Sprout />, status: "Monitoring", primary: true, details: "Visual transformer model scanning for Rust and Blight. No anomalies detected in current batch." },
  { id: 2, name: "Soil Analysis", desc: "Monitors soil health and nutrients", icon: <FlaskConical />, status: "Active", details: "Analyzes NPK levels, moisture, and pH. Currently detecting optimal conditions for the upcoming rubber planting in North Plantation." },
  { id: 4, name: "Weather Forecast", desc: "Predictive weather analysis", icon: <Zap />, status: "Active", details: "AI-driven 14-day forecast. Warning: 85% probability of heavy rain on April 2nd." },
  { id: 3, name: "Weather Collector", desc: "Real-time weather data integration", icon: <CloudRain />, status: "Syncing", details: "Integrating data from local sensors and global satellite feeds. High precision humidity tracking enabled." },
  { id: 9, name: "Market Forecast", desc: "Price trend analysis", icon: <TrendingUp />, status: "Active", details: "Sentiment analysis of global commodity markets. Rubber prices expected to rise 3% next month." },
  { id: 11, name: "Govt Scheme Agent", desc: "Subsidy and scheme recommendations", icon: <Building2 />, status: "Active", details: "Recommended: PM-Kisan Samman Nidhi. Eligibility verified. Click to start application." },
  { id: 15, name: "Climate Risk Agent", desc: "Risk assessment and mitigation", icon: <AlertTriangle />, status: "Active", details: "Identifying localized frost risks. Mitigation plan synced with Lead Agent." },
];

const AgentHub = () => {
  const [selectedAgent, setSelectedAgent] = useState(null);

  const openAgent = (agent) => setSelectedAgent(agent);
  const closeAgent = () => setSelectedAgent(null);

  return (
    <div className="agent-hub-container reveal-anim">
      <div className="hub-header">
        <div className="hub-title-block">
           <h1>AgroMind AI Agent Ecosystem</h1>
           <p>Orchestrating {agents.length} specialized agents for data-driven precision farming.</p>
        </div>
        <button className="btn-hub-primary" onClick={() => alert("AgroMind Global Optimization Sequence Started...")}>
          <Zap size={18} />
          <span>Optimize All</span>
        </button>
      </div>

      <div className="agents-grid-hub">
        {agents.map((agent) => (
          <div key={agent.id} className={`agent-card-hub ${agent.primary ? 'primary-agent' : ''}`}>
             <div className="agent-icon-box">
                {agent.icon}
             </div>
             <div className="agent-content-hub">
                <div className="agent-name-row">
                   <h3>{agent.name}</h3>
                   {agent.primary && <span className="badge-primary-agent">★ CORE FOCUS</span>}
                   <span className={`agent-status-tag ${agent.status.toLowerCase()}`}>
                     {agent.status}
                   </span>
                </div>
                <p className="agent-desc">{agent.desc}</p>
                <div className="agent-actions-hub">
                   <button className="btn-agent-act" onClick={() => openAgent(agent)}>Interact</button>
                   <button className="btn-agent-info" onClick={() => openAgent(agent)}><Info size={14} /></button>
                </div>
             </div>
          </div>
        ))}
      </div>

      {selectedAgent && (
        <div className="agent-modal-overlay" onClick={closeAgent}>
           <div className="agent-modal-content" onClick={e => e.stopPropagation()}>
              <button className="btn-close-modal" onClick={closeAgent}><X size={20} /></button>
              
              <div className="modal-agent-header">
                 <div className="modal-agent-icon">
                    {selectedAgent.icon}
                 </div>
                 <div className="modal-agent-title">
                    <h2>{selectedAgent.name}</h2>
                    <span className={`agent-status-tag ${selectedAgent.status.toLowerCase()}`}>
                       {selectedAgent.status}
                    </span>
                 </div>
              </div>

              <div className="modal-stats-strip">
                 <div className="modal-stat">
                    <Activity size={14} />
                    <span>Uptime: 99.9%</span>
                 </div>
                 <div className="modal-stat">
                    <CheckCircle2 size={14} />
                    <span>Integrity: Block-verified</span>
                 </div>
              </div>

              <div className="modal-intelligence-body">
                 <h4>Deep Intelligence Insights</h4>
                 <p>{selectedAgent.details}</p>
                 
                 <div className="agent-capabilities-list">
                    <div className="cap-item">✓ Real-time Monitoring</div>
                    <div className="cap-item">✓ Neural Network Reasoning</div>
                    <div className="cap-item">✓ Zero-latency Sync</div>
                 </div>
              </div>

              <div className="modal-actions">
                 <button className="btn-modal-primary" onClick={() => { alert(`${selectedAgent.name} module initialized.`); closeAgent(); }}>
                    Run Agent Protocol
                 </button>
                 <button className="btn-modal-secondary" onClick={closeAgent}>
                    View Detailed Logs
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AgentHub;
