import React from "react";
import { NavLink } from "react-router-dom";

function Navbar() {
  const isAuth = !!localStorage.getItem("userPhone");

  const handleLogout = () => {
    localStorage.removeItem("userPhone");
    localStorage.removeItem("userName");
    window.location.href = "/login";
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-success">
      <div className="container">
        <NavLink className="navbar-brand fw-bold fs-2 mx-auto" to="/">
          AgriAI
        </NavLink>
        <div className="collapse navbar-collapse justify-content-center">
          <ul className="navbar-nav gap-3">
            <li className="nav-item">
              <NavLink className="nav-link nav-box" to="/" end>
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link nav-box" to="/farmer-queries">
                Queries
              </NavLink>
            </li>


            <li className="nav-item">
              <NavLink className="nav-link nav-box" to="/live-video">
                Live YOLO Detection
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link nav-box" to="/dashboard">
                Dashboard
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link nav-box" to="/farm-management">
                Farm Management
              </NavLink>
            </li>
            {/* 🔹 New Crop Advisor Feature */}
            <li className="nav-item">
              <NavLink className="nav-link nav-box" to="/crop-advisor">
                Disease Detection
              </NavLink>
            </li>
            {isAuth ? (
              <li className="nav-item">
                <button
                  onClick={handleLogout}
                  className="nav-link nav-box"
                  style={{ background: "transparent", border: "none", outline: "none" }}
                >
                  Logout
                </button>
              </li>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link nav-box" to="/login">
                    Login
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link nav-box" to="/signup">
                    Signup
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
