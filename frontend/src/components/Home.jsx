import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section text-center reveal in-view">
        <h1 className="hero-title">AgriAI – Revolutionizing Farming</h1>
        <p className="hero-subtitle">
          Empowering the next generation of farmers with AI-powered solutions
          for crops, livestock, and markets.
        </p>
        <Link to="/signup" className="btn btn-primary btn-lg mt-3 hero-btn">
          Get Started Today
        </Link>
      </section>

      {/* Why AgriAI */}
      <section className="why-agri container my-5 reveal">
        <h2 className="section-title text-center">🌱 Why Choose AgriAI?</h2>
        <p className="text-center">
          Because farming needs a revolution. AgriAI brings technology and
          tradition together to help farmers grow smarter, healthier, and more
          sustainably.
        </p>
        <ul className="why-list">
          <li>✔️ AI-driven crop & livestock insights</li>
          <li>✔️ Early disease detection & smart recommendations</li>
          <li>✔️ Market-driven decisions for higher profits</li>
          <li>✔️ Sustainable methods for future generations</li>
        </ul>
      </section>

      {/* Our Scope */}
      <section className="scope-section container my-5 reveal">
        <h2 className="section-title text-center">🌍 Our Scope</h2>
        <div className="row text-center">
          <div className="col-md-4 mb-3">
            <div className="scope-card reveal">
              <h5>Crop Intelligence</h5>
              <p>AI to detect crop diseases, suggest fertilizers, and boost yield.</p>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="scope-card reveal">
              <h5>Livestock Care</h5>
              <p>Vaccination tracking, feed management, and health monitoring.</p>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="scope-card reveal">
              <h5>Smart Marketplace</h5>
              <p>Real-time mandi prices & market analysis for better profits.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Us */}
      <section className="about-section container my-5 text-center reveal">
        <h2 className="section-title">🤝 About Us</h2>
        <p>
          We are a team of innovators passionate about creating sustainable,
          tech-powered solutions for farmers. Our mission is to build the
          future of agriculture by combining artificial intelligence with
          traditional wisdom.
        </p>
      </section>

      {/* Future of Farming */}
      <section className="future-section text-center reveal">
        <h2 className="section-title">🚀 The Future of Farming</h2>
        <p>
          Imagine a world where every farmer has access to smart tools, climate
          predictions, and market insights at their fingertips. AgriAI makes
          this future possible, today.
        </p>
      </section>
    </div>
  );
}

export default Home;
