import React from "react";
import { Link } from "react-router-dom";
import PublicNavbar from "../components/PublicNavbar";
import PublicFooter from "../components/PublicFooter";
import RevealOnScroll from "../components/RevealOnScroll";
import logo from "../assets/logo.png";

const loopImages = [
  {
    title: "A calm place to talk",
    subtitle: "Anonymous support sessions",
    image:
      "https://images.unsplash.com/photo-1516302752625-fcc3c50ae61f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Gentle listener support",
    subtitle: "Human connection when needed",
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Safe wellness design",
    subtitle: "Calmer User Interface",
    image:
      "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "AI backup support",
    subtitle: "Help when no listener is free",
    image:
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Timed private sessions",
    subtitle: "10 / 15 / 20 minute rooms",
    image:
      "https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1200&q=80",
  },
];

const repeatedLoopImages = [...loopImages, ...loopImages];

export default function HomePage() {
  return (
    <div className="mc-page-shell">
      <img src={logo} alt="Micro-Counsel watermark" className="mc-watermark" />
      <img src={logo} alt="Micro-Counsel watermark" className="mc-watermark left" />

      <div className="mc-public-shell">
        <PublicNavbar />

        <main>
          <section className="mc-home-section mc-home-hero">
            <div className="mc-container">
              <div className="mc-home-hero-grid">
                <RevealOnScroll variant="left">
                  <div className="mc-home-hero-copy">
                    <div className="mc-pill" style={{ width: "fit-content" }}>
                      Anonymous student support • Listener help • AI backup
                    </div>

                    <h2>
                      Better mental health
                      <br />
                      through <span className="mc-gradient-text">gentle conversation</span>
                    </h2>

                    <p>
                      Micro-Counsel is a calming support platform for students who need someone
                      to talk to. Connect anonymously, speak with an approved listener, or use AI
                      fallback support in a moderated and safer environment.
                    </p>

                    <div className="mc-home-hero-actions">
                      <Link to="/user-signup" className="mc-button mc-button-primary">
                        Get started as student
                      </Link>
                      <Link to="/listener-signup" className="mc-button mc-button-secondary">
                        Apply as listener
                      </Link>
                      <Link to="/admin-login" className="mc-button mc-button-secondary">
                        Admin login
                      </Link>
                    </div>
                  </div>
                </RevealOnScroll>

                <RevealOnScroll variant="right">
                  <div className="mc-card mc-home-hero-panel">
                    <img src={logo} alt="Micro-Counsel" />

                    <div className="mc-grid">
                      <div className="mc-card-soft" style={{ padding: 18 }}>
                        <div className="mc-row-title">Anonymous by design</div>
                        <div className="mc-row-sub">
                          Students use aliases inside chat rooms to protect identity.
                        </div>
                      </div>

                      <div className="mc-card-soft" style={{ padding: 18 }}>
                        <div className="mc-row-title">Listener + AI support</div>
                        <div className="mc-row-sub">
                          Match with a volunteer listener or fallback to AI when needed.
                        </div>
                      </div>

                      <div className="mc-card-soft" style={{ padding: 18 }}>
                        <div className="mc-row-title">Timed, moderated conversations</div>
                        <div className="mc-row-sub">
                          Safer messaging with structured sessions and warning events.
                        </div>
                      </div>
                    </div>
                  </div>
                </RevealOnScroll>
              </div>
            </div>
          </section>

          <section className="mc-home-section">
            <div className="mc-container">
             
              <RevealOnScroll>
                <div className="mc-logo-strip">
                  <div className="mc-logo-track">
                    {repeatedLoopImages.map((item, index) => (
                      <div className="mc-loop-card" key={`${item.title}-${index}`}>
                        <img src={item.image} alt={item.title} />
                        <div className="mc-loop-overlay">
                          <strong>{item.title}</strong>
                          <span>{item.subtitle}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </RevealOnScroll>
            </div>
          </section>

          <section className="mc-home-section">
            <div className="mc-container">
              <RevealOnScroll>
                <div className="mc-card mc-hero-card" style={{ marginBottom: 20 }}>
                  <span className="mc-pill" style={{ width: "fit-content", marginBottom: 14 }}>
                    Core platform strengths
                  </span>
                  <h2 className="mc-section-title">
                    Built for safety, privacy, and <span className="mc-gradient-text">real student support</span>
                  </h2>
                  <p className="mc-section-subtitle">
                    The platform combines design calmness with practical support features.
                  </p>
                </div>
              </RevealOnScroll>

              <div className="mc-home-feature-grid">
                <RevealOnScroll variant="left">
                  <div className="mc-card mc-home-feature-card">
                    <h3>Anonymous support chat</h3>
                    <p>
                      Students can join sessions without exposing their personal identity inside the room.
                    </p>
                  </div>
                </RevealOnScroll>

                <RevealOnScroll>
                  <div className="mc-card mc-home-feature-card">
                    <h3>Volunteer listener network</h3>
                    <p>
                      Approved listeners provide human connection in a structured, gentle environment.
                    </p>
                  </div>
                </RevealOnScroll>

                <RevealOnScroll variant="right">
                  <div className="mc-card mc-home-feature-card">
                    <h3>AI fallback support</h3>
                    <p>
                      When no listener is available, AI can still provide a supportive response path.
                    </p>
                  </div>
                </RevealOnScroll>

                <RevealOnScroll variant="left">
                  <div className="mc-card mc-home-feature-card">
                    <h3>Timed rooms</h3>
                    <p>
                      Sessions can run for 10, 15, or 20 minutes with warning notices before ending.
                    </p>
                  </div>
                </RevealOnScroll>

                <RevealOnScroll>
                  <div className="mc-card mc-home-feature-card">
                    <h3>Moderated conversation</h3>
                    <p>
                      Risk-aware moderation can mask unsafe language before it reaches the other side.
                    </p>
                  </div>
                </RevealOnScroll>

                <RevealOnScroll variant="right">
                  <div className="mc-card mc-home-feature-card">
                    <h3>Admin safety oversight</h3>
                    <p>
                      Admins can review listeners, reports, and platform trust signals in one place.
                    </p>
                  </div>
                </RevealOnScroll>
              </div>
            </div>
          </section>

          <section className="mc-home-section">
            <div className="mc-container">
              <RevealOnScroll>
                <div className="mc-card mc-hero-card">
                  <span className="mc-pill" style={{ width: "fit-content", marginBottom: 14 }}>
                    Quick access
                  </span>
                  <h2 className="mc-section-title">
                    Choose how you want to <span className="mc-gradient-text">enter the platform</span>
                  </h2>
                  <p className="mc-section-subtitle" style={{ marginBottom: 22 }}>
                    Student, listener, and admin access are all available from here now.
                  </p>

                  <div className="mc-grid mc-grid-3">
                    <div className="mc-card-soft" style={{ padding: 20 }}>
                      <div className="mc-row-title">Student access</div>
                      <div className="mc-row-sub" style={{ marginBottom: 14 }}>
                        Sign up or sign in to start a support chat session.
                      </div>
                      <div className="mc-inline-actions">
                        <Link to="/user-signup" className="mc-button mc-button-primary">
                          Student signup
                        </Link>
                        <Link to="/user-login" className="mc-button mc-button-secondary">
                          Student login
                        </Link>
                      </div>
                    </div>

                    <div className="mc-card-soft" style={{ padding: 20 }}>
                      <div className="mc-row-title">Listener access</div>
                      <div className="mc-row-sub" style={{ marginBottom: 14 }}>
                        Apply as a volunteer listener or sign in after approval.
                      </div>
                      <div className="mc-inline-actions">
                        <Link to="/listener-signup" className="mc-button mc-button-primary">
                          Listener signup
                        </Link>
                        <Link to="/listener-login" className="mc-button mc-button-secondary">
                          Listener login
                        </Link>
                      </div>
                    </div>

                    <div className="mc-card-soft" style={{ padding: 20 }}>
                      <div className="mc-row-title">Admin access</div>
                      <div className="mc-row-sub" style={{ marginBottom: 14 }}>
                        Review listener approvals and manage platform oversight.
                      </div>
                      <div className="mc-inline-actions">
                        <Link to="/admin-login" className="mc-button mc-button-primary">
                          Admin login
                        </Link>
                      </div>
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