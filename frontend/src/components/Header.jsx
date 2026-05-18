import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, User, LogOut, LayoutDashboard, ListTodo, CloudSun } from "lucide-react";
import "./Header.css";

const Header = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem("userName") || "Farmer";
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifications = useMemo(() => {
    const farmerTasks = JSON.parse(localStorage.getItem("farmerTasks") || "[]").filter((t) => !t.done);
    const cattleRecords = JSON.parse(localStorage.getItem("cattleRecords") || "{}");

    const pendingCattleCount = Object.values(cattleRecords || {}).reduce((sum, list) => {
      if (!Array.isArray(list)) return sum;
      return sum + list.filter((item) => !item.done).length;
    }, 0);

    const items = [];
    if (farmerTasks.length > 0) items.push(`${farmerTasks.length} farm task(s) pending`);
    if (pendingCattleCount > 0) items.push(`${pendingCattleCount} cattle record(s) pending verification`);
    if (items.length === 0) items.push("All caught up! No pending alerts.");
    return items;
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <header className="main-header">
      <div></div>

      <div className="header-actions">
        <div className="notification-wrapper" onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}>
          <Bell size={22} className="action-icon" />
          <span className="notification-badge">{notifications.length > 1 ? notifications.length : 1}</span>

          {showNotifications && (
            <div className="header-popover notifications-popover" onClick={(e) => e.stopPropagation()}>
              <h4>Notifications</h4>
              <ul>
                {notifications.map((note, idx) => <li key={idx}>{note}</li>)}
              </ul>
              <button onClick={() => navigate("/farm-management")}>Open Task List</button>
            </div>
          )}
        </div>

        <div className="user-profile-header" onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}>
          <div className="user-avatar-small">
            <User size={18} />
          </div>
          <span className="user-name-header">{userName}</span>

          {showUserMenu && (
            <div className="header-popover user-menu-popover" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => navigate("/dashboard")}><LayoutDashboard size={16} /> Dashboard</button>
              <button onClick={() => navigate("/farm-management")}><ListTodo size={16} /> Tasks</button>
              <button onClick={() => navigate("/weather")}><CloudSun size={16} /> Weather</button>
              <button className="danger" onClick={handleLogout}><LogOut size={16} /> Sign Out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
