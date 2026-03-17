import React from "react";
import PublicNavbar from "../components/PublicNavbar";
import PublicFooter from "../components/PublicFooter";
import RevealOnScroll from "../components/RevealOnScroll";
import logo from "../assets/logo.png";

export default function EmergencyHelpPage() {
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
                    Important support note
                  </span>
                  <h1 className="mc-section-title">
                    Emergency situations need <span className="mc-gradient-text">immediate real-world help</span>
                  </h1>
                  <p className="mc-section-subtitle">
                    Micro-Counsel is for emotional support conversations. It is not a replacement for emergency medical, crisis, or urgent safety services.
                  </p>
                </div>
              </RevealOnScroll>
            </div>
          </section>

          <section className="mc-home-section">
            <div className="mc-container">
              <div className="mc-grid mc-grid-2">
                <RevealOnScroll variant="left">
                  <div className="mc-card-soft" style={{ padding: 24 }}>
                    <div className="mc-row-title">Get immediate help now</div>
                    <div className="mc-row-sub" style={{ marginTop: 12 }}>
                      If someone is in immediate danger, at risk of self-harm, experiencing a medical emergency, or facing a crisis right now, contact local emergency services or a trusted real-world adult immediately.
                    </div>
                  </div>
                </RevealOnScroll>

                <RevealOnScroll variant="right">
                  <div className="mc-card-soft" style={{ padding: 24 }}>
                    <div className="mc-row-title">Do not wait inside chat</div>
                    <div className="mc-row-sub" style={{ marginTop: 12 }}>
                      A chat platform should not be the only response path during urgent mental health or safety emergencies.
                    </div>
                  </div>
                </RevealOnScroll>
              </div>
            </div>
          </section>

          <section className="mc-home-section">
            <div className="mc-container">
              <RevealOnScroll>
                <div className="mc-card mc-hero-card">
                  <h2 className="mc-section-title">
                    When Micro-Counsel <span className="mc-gradient-text">can help</span>
                  </h2>
                  <p className="mc-section-subtitle" style={{ marginBottom: 22 }}>
                    The platform is better suited for non-emergency emotional support conversations such as stress, loneliness, sadness, overwhelm, relationship pressure, or needing someone to listen.
                  </p>

                  <div className="mc-grid mc-grid-3">
                    <div className="mc-card-soft" style={{ padding: 18 }}>
                      <div className="mc-row-title">Stress</div>
                      <div className="mc-row-sub">Talk through academic or life pressure.</div>
                    </div>
                    <div className="mc-card-soft" style={{ padding: 18 }}>
                      <div className="mc-row-title">Loneliness</div>
                      <div className="mc-row-sub">Connect with a supportive listener or AI backup.</div>
                    </div>
                    <div className="mc-card-soft" style={{ padding: 18 }}>
                      <div className="mc-row-title">Low mood</div>
                      <div className="mc-row-sub">Use the chat space for gentle emotional support.</div>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            </div>
          </section>
        </main>

        <PublicFooter />
      </div>
    </div>
  );
}