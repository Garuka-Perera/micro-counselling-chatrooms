import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

export default function PublicFooter() {
  return (
    <footer className="mc-footer">
      <div className="mc-container">
        <div className="mc-card mc-footer-card">
          <div className="mc-footer-grid">
            <div className="mc-footer-copy">
              <div className="mc-brand">
                <img src={logo} alt="Micro-Counsel" />
                <div>
                  <p className="mc-brand-title">Micro-Counsel</p>
                  <p className="mc-brand-subtitle">Better mental health through calmer support</p>
                </div>
              </div>
              <p>
                A university project focused on anonymous support chat, volunteer listener care,
                and safer moderated wellbeing conversations.
              </p>
            </div>

            <div className="mc-footer-links">
              <Link to="/">Home</Link>
              <Link to="/how-it-works">How it works</Link>
              <Link to="/become-a-listener">Become a listener</Link>
              <Link to="/emergency-help">Emergency help</Link>
              <Link to="/admin-login">Admin login</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}