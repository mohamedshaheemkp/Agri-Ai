import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  // Authorization turned OFF
  return children; 
};
// replace this code for above to work
//const PrivateRoute = ({ children }) => {
  //const isAuth = localStorage.getItem("userPhone");
  //return isAuth ? children : <Navigate to="/login" replace />; 
//};

// ✅ Common Components
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./components/Home";
import Login from "./components/Login";
import Signup from "./components/Signup";


// ✅ Combined Tasks + Tracker
import FarmManagementApp from "./components/FarmManagementApp";

import LiveVideoDetection from "./components/LiveVideoDetection";

// ✅ Dashboard + Subpages
import Dashboard from "./pages/Dashboard";
import GovtSchemes from "./pages/GovtSchemes";
import MarketPage from "./pages/MarketPage";
import WeatherPage from "./pages/WeatherPage";
import TipsPage from "./pages/TipsPage";

// ✅ Crop Advisor
import CropAdvisor from "./components/CropAdvisor";

// 🆕 NEW: Import the Soil Advisor Component
import SoilAdvisor from "./components/SoilAdvisor"; // Assuming you place SoilAdvisor.jsx in the 'components' folder

function App() {
  return (
    <Router>
      <div className="background-glow"></div>
      <div className="app-container">
        <Sidebar />
        <div className="main-content-wrapper">
          <Header />
          <main className="flex-fill p-4">
            <Routes>
              {/* 🌐 Public Pages */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* 📌 Farmer Tools */}
              <Route path="/farm-management" element={<PrivateRoute><FarmManagementApp /></PrivateRoute>} />

              <Route path="/live-video" element={<PrivateRoute><LiveVideoDetection /></PrivateRoute>} />
              <Route path="/crop-advisor" element={<PrivateRoute><CropAdvisor /></PrivateRoute>} />
              <Route path="/soil-advisor" element={<PrivateRoute><SoilAdvisor /></PrivateRoute>} />

              {/* 📊 Dashboard & Subpages */}
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/schemes" element={<PrivateRoute><GovtSchemes /></PrivateRoute>} />
              <Route path="/market" element={<PrivateRoute><MarketPage /></PrivateRoute>} />
              <Route path="/weather" element={<PrivateRoute><WeatherPage /></PrivateRoute>} />
              <Route path="/tips" element={<PrivateRoute><TipsPage /></PrivateRoute>} />
            </Routes>
          </main>
          <Footer />
        </div>
      </div>
    </Router>
  );
}

export default App;