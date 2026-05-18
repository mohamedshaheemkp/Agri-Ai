import React, { useState, useEffect } from "react";
import { buildApiUrl } from "../config";
import { MessageSquare, Clock, Send, ChevronLeft, Bot, User } from "lucide-react";
import "./FarmerQueries.css";

function FarmerQueries() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("farmerQueriesHistory");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("farmerQueriesHistory", JSON.stringify(history));
  }, [history]);

  const suggestions = [
    "Best fertilizer for wheat",
    "How to control pests in rice",
    "Optimal feeding for Gir cows",
    "When to irrigate maize fields",
  ];

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setAnswer(null);
    try {
      const res = await fetch(buildApiUrl("/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query.trim() }),
      });
      const data = await res.json();
      if (data.reply) {
        setAnswer(data.reply);
        setHistory((prev) => [{ question: query.trim(), answer: data.reply, ts: Date.now() }, ...prev]);
      }
    } catch (err) {
      setAnswer("❌ Error: " + err.message);
    } finally {
      setLoading(false);
      setQuery("");
    }
  };

  return (
    <div className="farmer-queries-modern">
      <div className="page-header">
        <div className="header-icon"><MessageSquare size={28} /></div>
        <div className="header-text">
          <h1>Farmer Messages & Queries</h1>
          <p>Get instant AI advice for your farming needs.</p>
        </div>
      </div>

      <div className="queries-grid">
        <div className="card-ngebon query-input-card">
          <div className="card-header-flex">
            <h3>Ask New Question</h3>
            <button className="btn-back-soft" onClick={() => window.history.back()}><ChevronLeft size={16} /> Back</button>
          </div>

          <div className="suggestions-modern">
            <p className="hint-label">Suggested topics:</p>
            <div className="tokens-container">
              {suggestions.map((s, i) => (
                <button key={i} className="token-pill" onClick={() => setQuery(s)}>{s}</button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="query-form">
            <div className="textarea-wrapper">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type your question here..."
                rows="4"
              />
              <button type="submit" className="btn-send" disabled={loading || !query.trim()}>
                {loading ? <div className="spinner-small"></div> : <Send size={20} />}
              </button>
            </div>
          </form>

          {answer && (
            <div className={`answer-box-modern reveal-anim`}>
              <div className="ai-badge"><Bot size={16} /> AI Assistant</div>
              <div className="answer-text">{answer}</div>
            </div>
          )}
        </div>

        <div className="history-column">
          <div className="card-header-flex">
            <h3>Recent History</h3>
            <span className="count-badge">{history.length}</span>
          </div>

          <div className="history-list">
            {history.length > 0 ? history.map((h, idx) => (
              <div key={idx} className="card-ngebon history-item-modern">
                <div className="history-q">
                  <div className="user-icon-small"><User size={14} /></div>
                  <p>{h.question}</p>
                </div>
                <div className="history-a">
                  <div className="bot-icon-small"><Bot size={14} /></div>
                  <div className="answer-content">{h.answer}</div>
                </div>
                <div className="history-footer">
                  <Clock size={12} />
                  <span>{new Date(h.ts).toLocaleString()}</span>
                </div>
              </div>
            )) : (
              <div className="empty-history">
                <MessageSquare size={40} className="empty-icon" />
                <p>No query history yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FarmerQueries;