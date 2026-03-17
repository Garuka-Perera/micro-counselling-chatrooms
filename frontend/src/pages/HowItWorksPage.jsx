import React from "react";
import PublicNavbar from "../components/PublicNavbar";
import PublicFooter from "../components/PublicFooter";
import RevealOnScroll from "../components/RevealOnScroll";
import logo from "../assets/logo.png";

export default function HowItWorksPage() {
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
                    How the platform works
                  </span>
                  <h1 className="mc-section-title">
                    A calm, private, and <span className="mc-gradient-text">structured support flow</span>
                  </h1>
                  <p className="mc-section-subtitle">
                    Micro-Counsel is designed to help students feel safe, heard, and supported through anonymous timed conversations.
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
                    <h3>1. Choose a topic</h3>
                    <p>
                      Students begin by choosing what they want help with, such as stress, anxiety, loneliness, studies, family, or relationships.
                    </p>
                  </div>
                </RevealOnScroll>

                <RevealOnScroll>
                  <div className="mc-card mc-home-feature-card">
                    <h3>2. Select a support mode</h3>
                    <p>
                      They can be matched with an approved listener, use AI support directly, or let the system automatically decide.
                    </p>
                  </div>
                </RevealOnScroll>

                <RevealOnScroll variant="right">
                  <div className="mc-card mc-home-feature-card">
                    <h3>3. Enter a timed session</h3>
                    <p>
                      Support rooms are time-limited to 10, 15, or 20 minutes, helping conversations stay focused and structured.
                    </p>
                  </div>
                </RevealOnScroll>
              </div>
            </div>
          </section>

          <section className="mc-home-section">
            <div className="mc-container">
              <RevealOnScroll>
                <div className="mc-card mc-hero-card" style={{ marginBottom: 20 }}>
                  <span className="mc-pill" style={{ width: "fit-content", marginBottom: 14 }}>
                    Safety and privacy
                  </span>
                  <h2 className="mc-section-title">
                    Built with <span className="mc-gradient-text">student wellbeing</span> in mind
                  </h2>
                  <p className="mc-section-subtitle">
                    The platform combines moderation, anonymity, and admin oversight to create a safer experience.
                  </p>
                </div>
              </RevealOnScroll>

              <div className="mc-grid mc-grid-2">
                <RevealOnScroll variant="left">
                  <div className="mc-card-soft" style={{ padding: 24 }}>
                    <div className="mc-row-title">Anonymous aliases</div>
                    <div className="mc-row-sub" style={{ marginTop: 10 }}>
                      Personal identity is not exposed inside the support session. The system uses anonymous aliases instead.
                    </div>
                  </div>
                </RevealOnScroll>

                <RevealOnScroll variant="right">
                  <div className="mc-card-soft" style={{ padding: 24 }}>
                    <div className="mc-row-title">Message moderation</div>
                    <div className="mc-row-sub" style={{ marginTop: 10 }}>
                      Harmful or abusive language can be flagged and masked before it reaches the other participant.
                    </div>
                  </div>
                </RevealOnScroll>

                <RevealOnScroll variant="left">
                  <div className="mc-card-soft" style={{ padding: 24 }}>
                    <div className="mc-row-title">Admin approval for listeners</div>
                    <div className="mc-row-sub" style={{ marginTop: 10 }}>
                      Only approved listeners should be allowed into the live support environment.
                    </div>
                  </div>
                </RevealOnScroll>

                <RevealOnScroll variant="right">
                  <div className="mc-card-soft" style={{ padding: 24 }}>
                    <div className="mc-row-title">Structured session ending</div>
                    <div className="mc-row-sub" style={{ marginTop: 10 }}>
                      Timers, warnings, and session ending controls help reduce chaos and support healthier boundaries.
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