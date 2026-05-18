import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import { buildApiUrl } from "../config";

function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const normalizePhone = (value) => value.replace(/\D/g, "");

  const handleLogin = async () => {
    const normalizedPhone = normalizePhone(phone);
    const normalizedPassword = password.trim();

    if (!normalizedPhone || !normalizedPassword) {
      alert("Please enter phone and password");
      return;
    }
    try {
      const res = await axios.post(buildApiUrl("/login"), {
        phone: normalizedPhone,
        password: normalizedPassword,
      });

      if (res.data.status === "success") {
        alert("Login successful!");
        try {
          localStorage.setItem("userPhone", res.data.phone || normalizedPhone || "");
          const name = res.data.fullname || res.data.name || "";
          if (name) localStorage.setItem("userName", name);
        } catch { }
        window.location.href = "/dashboard";
      }
    } catch (err) {
      alert(err.response?.data?.detail || "Login failed");
    }
  };

  return (
    <div className="container my-5" style={{ maxWidth: "400px" }}>
      <div className="card shadow-sm p-4">
        <h3 className="text-center mb-4">Login</h3>

        <input
          className="form-control mb-3"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(normalizePhone(e.target.value))}
        />

        <input
          className="form-control mb-4"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
        />

        <div className="d-flex justify-content-between">
          <button className="btn btn-success w-50 me-2" onClick={handleLogin}>Login</button>
          <button className="btn btn-secondary w-50 ms-2" onClick={() => navigate("/")}>Back</button>
        </div>

        <p className="text-center mt-3">
          Don't have an account?{" "}
          <span
            className="text-primary"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/signup")}
          >
            Signup
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
