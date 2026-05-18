import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { buildApiUrl } from "../config";

function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const normalizePhone = (value) => value.replace(/\D/g, "");

  const [formData, setFormData] = useState({
    fullname: "",
    phone: "",
    password: "",
    location: "",
    farm_type: ""
  });

  const locations = [
    "ALAPPUZHA", "ERNAKULAM", "IDUKKI", "KANNUR", "KASARAGOD",
    "KOLLAM", "KOTTAYAM", "KOZHIKODE", "MALAPPURAM", "PALAKKAD",
    "PATHANAMTHITTA", "THIRUVANANTHAPURAM", "THRISSUR", "WAYANAD", "Other"
  ];
  const farmTypes = ["Dairy", "Crop Farming", "Mixed"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "phone" ? normalizePhone(value) : value,
    });
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!formData.fullname.trim() || !normalizePhone(formData.phone) || !formData.password.trim() || !formData.farm_type) {
      alert("Please fill out all required fields.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(buildApiUrl("/send-otp"), { phone: normalizePhone(formData.phone) });
      if (res.data.status === "success") {
        alert("OTP sent! (For this demo, check your backend console or use 123456)");
        setStep(2);
      }
    } catch (err) {
      alert(err.response?.data?.detail || err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySignup = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      alert("Please enter the OTP.");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(buildApiUrl("/signup"), {
        ...formData,
        phone: normalizePhone(formData.phone),
        password: formData.password.trim(),
        otp: otp.trim(),
      });
      if (res.data.status === "success") {
        alert("Signup successful!");
        try {
          localStorage.setItem("userPhone", normalizePhone(formData.phone) || "");
          localStorage.setItem("userName", formData.fullname || "");
        } catch { }
        navigate("/login");
      }
    } catch (err) {
      alert(err.response?.data?.detail || err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container my-5 d-flex justify-content-center">
      <div className="card shadow-lg p-4" style={{ width: "100%", maxWidth: "400px", borderRadius: "12px" }}>
        <h3 className="text-center mb-4" style={{ fontWeight: "600", color: "#2c3e50" }}>Signup</h3>

        {step === 1 ? (
          <>
            <input className="form-control mb-3" placeholder="Full Name" name="fullname" value={formData.fullname} onChange={handleChange} style={{ borderRadius: "8px", padding: "10px" }} />
            <input className="form-control mb-3" placeholder="Phone Number" name="phone" value={formData.phone} onChange={handleChange} style={{ borderRadius: "8px", padding: "10px" }} />
            <input className="form-control mb-3" type="password" placeholder="Password" name="password" value={formData.password} onChange={handleChange} style={{ borderRadius: "8px", padding: "10px" }} />
            <select className="form-control mb-3" name="location" value={formData.location} onChange={handleChange} style={{ borderRadius: "8px", padding: "10px" }}>
              <option value="">Select Location</option>
              {locations.map((loc, idx) => <option key={idx} value={loc}>{loc}</option>)}
            </select>
            <select className="form-control mb-4" name="farm_type" value={formData.farm_type} onChange={handleChange} style={{ borderRadius: "8px", padding: "10px" }}>
              <option value="">Select Farm Type</option>
              {farmTypes.map((type, idx) => <option key={idx} value={type}>{type}</option>)}
            </select>

            <div className="d-flex gap-2">
              <button className="btn btn-success flex-fill" onClick={handleSendOtp} disabled={loading} style={{ borderRadius: "8px", fontWeight: "500" }}>
                {loading ? "Sending..." : "Send OTP"}
              </button>
              <button className="btn btn-secondary flex-fill" onClick={() => navigate("/")} style={{ borderRadius: "8px", fontWeight: "500" }}>Back</button>
            </div>
          </>
        ) : (
          <>
            <div className="alert alert-info text-center">
              An OTP has been sent to <strong>{formData.phone}</strong>
            </div>
            <input className="form-control mb-4 text-center fs-4 tracking-widest" placeholder="Enter OTP" value={otp} onChange={(e) => setOtp(e.target.value)} style={{ borderRadius: "8px", padding: "10px", letterSpacing: "4px" }} />

            <div className="d-flex gap-2">
              <button className="btn btn-success flex-fill" onClick={handleVerifySignup} disabled={loading} style={{ borderRadius: "8px", fontWeight: "500" }}>
                {loading ? "Verifying..." : "Verify & Signup"}
              </button>
              <button className="btn btn-outline-secondary flex-fill" onClick={() => setStep(1)} style={{ borderRadius: "8px", fontWeight: "500" }}>Back</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Signup;
