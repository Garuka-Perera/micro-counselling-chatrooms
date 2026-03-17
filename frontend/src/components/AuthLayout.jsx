import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

export default function AuthLayout({
  title,
  subtitle,
  sideTitle,
  sideDescription,
  children,
  bottomText,
  bottomLinkText,
  bottomLinkTo,
}) {
  return (
    <div className="mc-auth-shell">
      <img src={logo} alt="Micro-Counsel watermark" className="mc-watermark" />
      <img src={logo} alt="Micro-Counsel watermark" className="mc-watermark left" />

      <div className="mc-auth-card fade-up">
        <div className="mc-auth-visual">
          <div>
            <img src={logo} alt="Micro-Counsel" className="mc-auth-visual-logo" />

            <div style={{ marginTop: 24 }}>
              <div className="mc-pill" style={{ width: "fit-content", marginBottom: 18 }}>
                Anonymous support • Safer conversations • Calm design
              </div>

              <h2>
                {sideTitle || (
                  <>
                    A safer space for
                    <br />
                    <span className="mc-gradient-text">student wellbeing</span>
                  </>
                )}
              </h2>

              <p>
                {sideDescription ||
                  "Micro-Counsel helps students connect with support through anonymous chat, approved listeners, and AI-backed safety systems designed for calmer mental wellness conversations."}
              </p>
            </div>
          </div>

          <div className="mc-auth-stat-row">
            <div className="mc-auth-stat">
              <strong>Anonymous</strong>
              <span>Private aliases inside sessions</span>
            </div>
            <div className="mc-auth-stat">
              <strong>Timed</strong>
              <span>10 / 15 / 20 minute support rooms</span>
            </div>
            <div className="mc-auth-stat">
              <strong>Moderated</strong>
              <span>Risk-aware safer messaging</span>
            </div>
          </div>
        </div>

        <div className="mc-auth-panel">
          <div className="mc-brand" style={{ marginBottom: 18 }}>
            <img src={logo} alt="Micro-Counsel" />
            <div>
              <p className="mc-brand-title">Micro-Counsel</p>
              <p className="mc-brand-subtitle">Better mental health through gentle support</p>
            </div>
          </div>

          <h1>{title}</h1>
          <p>{subtitle}</p>

          {children}

          {bottomText && bottomLinkText && bottomLinkTo ? (
            <p className="mc-helper-text">
              {bottomText}{" "}
              <Link to={bottomLinkTo} style={{ color: "#198754", fontWeight: 700 }}>
                {bottomLinkText}
              </Link>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}