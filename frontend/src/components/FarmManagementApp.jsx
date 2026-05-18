import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  Trash2,
  TrendingUp,
  TrendingDown,
  ListTodo,
  Beef,
  Calendar,
  Plus,
  ChevronLeft,
  Activity,
  Milk,
  Stethoscope,
  Heart
} from "lucide-react";
import "./FarmManagementApp.css";

function FarmManagementApp() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState("tasks");
  const [tasks, setTasks] = useState([]);
  const [vaccinationRecords, setVaccinationRecords] = useState([]);
  const [activeTab, setActiveTab] = useState("vaccination");
  const [records, setRecords] = useState({ vaccination: [], deworming: [], milk: [], breeding: [], health: [] });
  const [form, setForm] = useState({});
  const [newTask, setNewTask] = useState({ title: "", dueDate: "", notes: "", priority: "Medium", category: "General" });
  const [milkSettings, setMilkSettings] = useState(() => {
    const saved = localStorage.getItem("milkSettings");
    return saved ? JSON.parse(saved) : { pricePerLiter: 40, costPerLiter: 30 };
  });

  useEffect(() => {
    const savedTasks = localStorage.getItem("farmerTasks");
    if (savedTasks) setTasks(JSON.parse(savedTasks).filter((t) => !t.done));
    const savedRecords = localStorage.getItem("cattleRecords");
    if (savedRecords) setRecords(JSON.parse(savedRecords));
    const savedVaccinations = localStorage.getItem("vaccinationRecords");
    if (savedVaccinations) setVaccinationRecords(JSON.parse(savedVaccinations).filter((v) => !v.done));
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("farmerTasks");
    const merged = [...JSON.parse(saved || "[]").filter((t) => t.done), ...tasks];
    localStorage.setItem("farmerTasks", JSON.stringify(merged));
    window.dispatchEvent(new Event("farmerTasksUpdated"));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("cattleRecords", JSON.stringify(records));
    window.dispatchEvent(new Event("cattleRecordsUpdated"));
  }, [records]);
  useEffect(() => { localStorage.setItem("milkSettings", JSON.stringify(milkSettings)); }, [milkSettings]);

  const addTask = (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.dueDate) return;
    setTasks([...tasks, { ...newTask, id: Date.now(), done: false }]);
    setNewTask({ title: "", dueDate: "", notes: "", priority: "Medium", category: "General" });
  };

  const markDone = (tab, id) => {
    const updated = records[tab].map(r => r.id === id ? { ...r, done: true } : r);
    setRecords({ ...records, [tab]: updated });
  };

  return (
    <div className="farm-mgmt-modern reveal-anim">
      <div className="page-header-flex">
        <div className="header-text">
          <div className="header-icon-small"><Activity size={24} /></div>
          <div>
            <h1>Farm Management</h1>
            <p className="subtitle">Track your daily tasks and cattle health.</p>
          </div>
        </div>
        <button className="btn-back-soft" onClick={() => navigate("/dashboard")}><ChevronLeft size={16} /> Dashboard</button>
      </div>

      <div className="mgmt-nav-pills">
        <button className={`mgmt-pill ${activePage === 'tasks' ? 'active' : ''}`} onClick={() => setActivePage('tasks')}>
          <ListTodo size={18} /> Tasks
        </button>
        <button className={`mgmt-pill ${activePage === 'cattle' ? 'active' : ''}`} onClick={() => setActivePage('cattle')}>
          <Beef size={18} /> Cattle
        </button>
      </div>

      {activePage === "tasks" && (
        <div className="tasks-layout">
          <div className="card-ngebon p-4 mb-4">
            <h4 className="mb-4">Add Task</h4>
            <form onSubmit={addTask} className="form-grid-modern">
              <div className="input-box-modern">
                <label>Title</label>
                <input type="text" placeholder="Harvesting..." value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} required />
              </div>
              <div className="input-box-modern">
                <label>Due Date</label>
                <input type="datetime-local" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} required />
              </div>
              <div className="input-box-modern">
                <label>Priority</label>
                <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}>
                  <option>High</option><option>Medium</option><option>Low</option>
                </select>
              </div>
              <button type="submit" className="btn-primary-modern self-end"><Plus size={18} /> Add</button>
            </form>
          </div>

          <div className="mgmt-table-wrapper">
            <table className="mgmt-table">
              <thead>
                <tr><th>Task</th><th>Due</th><th>Priority</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t.id}>
                    <td>{t.title}</td>
                    <td>{new Date(t.dueDate).toLocaleString()}</td>
                    <td><span className={`badge-soft bg-${t.priority === 'High' ? 'danger' : 'warning'}`}>{t.priority}</span></td>
                    <td><button className="status-check-btn" onClick={() => setTasks(tasks.filter(x => x.id !== t.id))}>Done</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activePage === "cattle" && (
        <div className="cattle-layout">
          <div className="tracker-tabs-row">
            {Object.keys(records).map(tab => (
              <button key={tab} className={`tab-btn-soft ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="card-ngebon p-4 mb-4">
            <h4 className="mb-4">Log {activeTab}</h4>
            <form onSubmit={(e) => {
              e.preventDefault();
              const rec = { ...form, id: Date.now(), done: false };
              setRecords({ ...records, [activeTab]: [...records[activeTab], rec] });
              setForm({});
            }} className="form-grid-modern">
              <div className="input-box-modern">
                <label>Animal Name</label>
                <input type="text" value={form.animal || ""} onChange={(e) => setForm({ ...form, animal: e.target.value })} required />
              </div>
              {activeTab === 'milk' && (
                <div className="input-box-modern">
                  <label>Yield (L)</label>
                  <input type="number" value={form.yield || ""} onChange={(e) => setForm({ ...form, yield: e.target.value })} required />
                </div>
              )}
              <div className="input-box-modern">
                <label>Date</label>
                <input type="date" value={form.date || ""} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <button type="submit" className="btn-primary-modern"><Plus size={18} /> Save</button>
            </form>
          </div>

          <div className="mgmt-table-wrapper">
            <table className="mgmt-table">
              <thead>
                <tr><th>Animal</th><th>Date</th>{activeTab === 'milk' && <th>Yield</th>}<th>Actions</th></tr>
              </thead>
              <tbody>
                {records[activeTab].map(r => (
                  <tr key={r.id} className={r.done ? 'row-done' : ''}>
                    <td>{r.animal}</td>
                    <td>{r.date}</td>
                    {activeTab === 'milk' && <td>{r.yield} L</td>}
                    <td>
                      {!r.done && <button className="status-check-btn me-2" onClick={() => markDone(activeTab, r.id)}>Verify</button>}
                      <button className="del-btn-soft" onClick={() => setRecords({ ...records, [activeTab]: records[activeTab].filter(x => x.id !== r.id) })}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default FarmManagementApp;