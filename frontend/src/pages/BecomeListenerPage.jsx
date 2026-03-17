import React from "react";
import { Link } from "react-router-dom";
import PublicNavbar from "../components/PublicNavbar";
import PublicFooter from "../components/PublicFooter";
import RevealOnScroll from "../components/RevealOnScroll";
import logo from "../assets/logo.png";

export default function BecomeListenerPage() {
  return (
    <div className="mc-page-shell">
      <img src={logo} alt="Micro-Counsel watermark" className="mc-watermark" />
      <img src={logo} alt="Micro-Counsel watermark" className="mc-watermark left" />

      <div className="mc-public-shell">
        <PublicNavbar />

        <main>
          <section className="mc-home-section mc-home-hero">
            <div className="mc-container">
              <RevealOnScroll>
                <div className="mc-card mc-hero-card">
                  <span className="mc-pill" style={{ width: "fit-content", marginBottom: 14 }}>
                    Volunteer listener pathway
                  </span>
                  <h1 className="mc-section-title">
                    Help students feel heard through <span className="mc-gradient-text">gentle support</span>
                  </h1>
                  <p className="mc-section-subtitle">
                    Listener volunteers are an important part of the Micro-Counsel platform. They provide calm human connection in anonymous, moderated chat rooms.
                  </p>
                </div>
              </RevealOnScroll>
            </div>
          </section>

          <section className="mc-home-section">
            <div className="mc-container">
              <div className="mc-grid mc-grid-3">
                <RevealOnScroll variant="left">
                  <div className="mc-card mc-home-feature-card">
                    <h3>Apply</h3>
                    <p>
                      Create a listener account with your details, preferred language, and support specialty.
                    </p>
                  </div>
                </RevealOnScroll>

                <RevealOnScroll>
                  <div className="mc-card mc-home-feature-card">
                    <h3>Get reviewed</h3>
                    <p>
                      An admin reviews your application before live listener access is enabled.
                    </p>
                  </div>
                </RevealOnScroll>

                <RevealOnScroll variant="right">
                  <div className="mc-card mc-home-feature-card">
                    <h3>Support students</h3>
                    <p>
                      Once approved, you can set availability and join real-time sessions with waiting students.
                    </p>
                  </div>
                </RevealOnScroll>
              </div>
            </div>
          </section>

          <section className="mc-home-section">
            <div className="mc-container">
              <div className="mc-grid mc-grid-2">
                <RevealOnScroll variant="left">
                  <div className="mc-card mc-hero-card">
                    <h2 className="mc-section-title">
                      What makes a good <span className="mc-gradient-text">listener</span>?
                    </h2>
                    <p className="mc-section-subtitle" style={{ marginBottom: 20 }}>
                      Listener support is not about solving everything. It is about presence, respect, patience, and calm communication.
                    </p>

                    <div className="mc-grid">
                      <div className="mc-card-soft" style={{ padding: 18 }}>
                        <div className="mc-row-title">Empathy</div>
                        <div className="mc-row-sub">Respond gently and without judgment.</div>
                      </div>
                      <div className="mc-card-soft" style={{ padding: 18 }}>
                        <div className="mc-row-title">Respect</div>
                        <div className="mc-row-sub">Treat every student conversation with care and dignity.</div>
                      </div>
                      <div className="mc-card-soft" style={{ padding: 18 }}>
                        <div className="mc-row-title">Healthy boundaries</div>
                        <div className="mc-row-sub">Stay within the platform structure and session limits.</div>
                      </div>
                    </div>
                  </div>
                </RevealOnScroll>

                <RevealOnScroll variant="right">
                  <div className="mc-card mc-hero-card">
                    <h2 className="mc-section-title">
                      Ready to <span className="mc-gradient-text">apply</span>?
                    </h2>
                    <p className="mc-section-subtitle" style={{ marginBottom: 20 }}>
                      Start your listener application and join the support network.
                    </p>

                    <div className="mc-inline-actions">
                      <Link to="/listener-signup" className="mc-button mc-button-primary">
                        Listener signup
                      </Link>
                      <Link to="/listener-login" className="mc-button mc-button-secondary">
                        Listener login
                      </Link>
                    </div>

                    <div className="mc-warning-box" style={{ marginTop: 18 }}>
                      Listener access should only become active after admin approval.
                    </div>
                  </div>
                </RevealOnScroll>
              </div>
            </div>
          </section>
        </main>

        <PublicFooter />
      </div>
    </div>
  );
}