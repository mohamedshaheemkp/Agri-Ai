import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Sprout,
  CloudSun,
  ListTodo,
  FlaskConical,
  LogOut,
  Image as ImageIcon,
  Menu,
  X,
  User,
  Video,
  Coins,
  Building2
} from "lucide-react";
import "./Sidebar.css";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: "Wabweni Farmer", farm: "Green Valley Farms" });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem("userName");
    if (savedName) setUser(prev => ({ ...prev, name: savedName }));
  }, []);

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Live Detection", path: "/live-video", icon: <Video size={20} /> },
    { name: "Crop Disease Detection", path: "/crop-advisor", icon: <Sprout size={20} /> },
    { name: "Soil Analysis", path: "/soil-advisor", icon: <FlaskConical size={20} /> },
    { name: "Weather", path: "/weather", icon: <CloudSun size={20} /> },
    { name: "Market Prices", path: "/market", icon: <Coins size={20} /> },
    { name: "Govt Schemes", path: "/schemes", icon: <Building2 size={20} /> },
    { name: "Tasks", path: "/farm-management", icon: <ListTodo size={20} /> },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);

  return (
    <>
      <button className="drawer-toggle d-lg-none" onClick={toggleDrawer}>
        {isDrawerOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className={`sidebar-container ${isDrawerOpen ? 'drawer-open' : ''}`}>
        <Link to="/" className="sidebar-brand" onClick={() => setIsDrawerOpen(false)}>
          <div className="brand-icon">
            <Sprout size={24} className="text-white" />
          </div>
          <span className="brand-name">AgroMind</span>
        </Link>

        <div className="sidebar-user-profile">
          <div className="user-avatar-large">
            <User size={32} />
          </div>
          <div className="user-info-stacked">
            <span className="user-name-main">{user.name}</span>
            <span className="user-farm-sub">{user.farm}</span>
          </div>
        </div>

        <nav className="sidebar-nav-main">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`nav-link-agro ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => setIsDrawerOpen(false)}
            >
              <span className="nav-icon-wrap">{item.icon}</span>
              <span className="nav-label-txt">{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-actions-group">
          <Link to="/live-video" className="btn-sidebar-action action-green">
            <span className="action-icon"><Video size={18} /></span>
            <span className="action-label">Start Live Detection</span>
          </Link>
          <Link to="/crop-advisor" className="btn-sidebar-action action-blue">
            <span className="action-icon"><ImageIcon size={18} /></span>
            <span className="action-label">Analyze Crop Image</span>
          </Link>
        </div>

        <div className="sidebar-footer-links">
          <button onClick={handleLogout} className="footer-link-agro text-danger">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {isDrawerOpen && <div className="drawer-overlay" onClick={toggleDrawer}></div>}
    </>
  );
};

export default Sidebar;
