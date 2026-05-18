import React from "react";

function Footer() {
  return (
    <footer className="footer-modern py-4">
      <div className="container text-center">
        <p className="mb-0 text-muted small">&copy; {new Date().getFullYear()} Ngebon Farmer | AgriAI Ecosystem. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
