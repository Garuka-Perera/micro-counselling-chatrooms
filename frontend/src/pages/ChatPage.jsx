import React, { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import logo from "../assets/logo.png";
import RevealOnScroll from "../components/RevealOnScroll";
import Modal from "../components/Modal";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const TOPICS = [
  "Stress",
  "Anxiety",
  "Sadness / low mood",
  "Family",
  "Relationship",
  "Studies / exams",
  "Loneliness",
  "Work pressure",
  "Just need someone to talk to",
];

const DURATIONS = [10, 15, 20];
const MODES = [
  { label: "Auto match", value: "AUTO" },
  { label: "Listener only", value: "PEER" },
  { label: "AI support", value: "AI" },
];

const REPORT_CATEGORIES = [
  { label: "Abusive behavior", value: "ABUSIVE_BEHAVIOR" },
  { label: "Unsafe advice", value: "UNSAFE_ADVICE" },
  { label: "Inappropriate listener", value: "INAPPROPRIATE_LISTENER" },
  { label: "Inappropriate user", value: "INAPPROPRIATE_USER" },
  { label: "Technical issue", value: "TECHNICAL_ISSUE" },
  { label: "Moderation failure", value: "MODERATION_FAILURE" },
  { label: "Other", value: "OTHER" },
];

function formatSeconds(total) {
  const safe = Math.max(0, total);
  const min = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const sec = Math.floor(safe % 60)
    .toString()
    .padStart(2, "0");
  return `${min}:${sec}`;
}

export default function ChatPage() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [topic, setTopic] = useState(TOPICS[0]);
  const [mode, setMode] = useState("AUTO");
  const [duration, setDuration] = useState(15);
  const [session, setSession] = useState(null);
  const [lastSessionSnapshot, setLastSessionSnapshot] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [timerLeft, setTimerLeft] = useState(0);
  const [notice, setNotice] = useState("");
  const [isAvailable, setIsAvailable] = useState(false);

  const [showEndedModal, setShowEndedModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    comment: "",
    wouldUseAgain: true,
  });
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState("");

  const [reportForm, setReportForm] = useState({
    category: "ABUSIVE_BEHAVIOR",
    description: "",
  });
  const [reportLoading, setReportLoading] = useState(false);
  const [reportStatus, setReportStatus] = useState("");

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("session:queued", (payload) => {
      setNotice(payload?.message || "You are in the support queue.");
    });

    socket.on("session:started", (payload) => {
      setSession(payload?.session || null);
      setMessages(payload?.messages || []);
      setNotice(payload?.message || "Session started.");
      setShowEndedModal(false);
      setShowFeedbackModal(false);
      setFeedbackStatus("");
      setReportStatus("");
    });

    socket.on("session:message", (payload) => {
      setMessages((prev) => [...prev, payload]);
    });

    socket.on("session:warning", (payload) => {
      setNotice(payload?.message || "Session warning");
    });

    socket.on("session:ended", (payload) => {
      const endingSession = session || payload?.session || lastSessionSnapshot;

      if (endingSession) {
        setLastSessionSnapshot(endingSession);
      }

      setNotice(payload?.message || "Session ended.");
      setSession(null);
      setTimerLeft(0);
      setDraft("");
      setMessages([]);
      setShowEndedModal(true);
    });

    socket.on("session:timer", (payload) => {
      if (typeof payload?.secondsLeft === "number") {
        setTimerLeft(payload.secondsLeft);
      }
    });

    socket.on("listener:availability-updated", (payload) => {
      if (typeof payload?.isAvailable === "boolean") {
        setIsAvailable(payload.isAvailable);
      }
    });

    socket.on("connect_error", (err) => {
      setNotice(err?.message || "Unable to connect to chat.");
    });

    return () => {
      socket.disconnect();
    };
  }, [token, session, lastSessionSnapshot]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, notice]);

  const currentAlias = useMemo(() => {
    if (session?.selfAlias) return session.selfAlias;
    if (user?.anonymousAlias) return user.anonymousAlias;
    return role === "LISTENER" ? "Listener" : "Anonymous";
  }, [session, user, role]);

  const activeSessionForActions = session || lastSessionSnapshot;

  function startSupportSession() {
    if (!socketRef.current) return;

    setMessages([]);
    setDraft("");
    setNotice("Finding the best support room for you...");
    setShowEndedModal(false);
    setShowFeedbackModal(false);
    setFeedbackStatus("");
    setReportStatus("");

    socketRef.current.emit("session:join-queue", {
      topic,
      mode,
      duration,
    });
  }

  function sendMessage() {
    if (!draft.trim() || !session?.id || !socketRef.current) return;

    socketRef.current.emit("session:send-message", {
      sessionId: session.id,
      text: draft,
    });

    setDraft("");
  }

  function toggleAvailability() {
    const next = !isAvailable;
    setIsAvailable(next);

    socketRef.current?.emit("listener:set-availability", {
      isAvailable: next,
    });
  }

  function endSession() {
    if (!session?.id || !socketRef.current) return;

    setLastSessionSnapshot(session);

    socketRef.current.emit("session:end", {
      sessionId: session.id,
    });
  }

  function openFeedbackModal() {
    setShowEndedModal(false);
    setShowFeedbackModal(true);
    setFeedbackStatus("");
  }

  function openReportModal() {
    setReportStatus("");
    setShowReportModal(true);
  }

  async function submitFeedback(e) {
    e.preventDefault();

    if (!activeSessionForActions?.id) {
      setFeedbackStatus("No completed session found for feedback.");
      return;
    }

    setFeedbackLoading(true);
    setFeedbackStatus("");

    try {
      const res = await fetch(`${API_URL}/chat/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: activeSessionForActions.id,
          rating: Number(feedbackForm.rating),
          comment: feedbackForm.comment,
          wouldUseAgain: feedbackForm.wouldUseAgain,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to submit feedback.");
      }

      setFeedbackStatus("Feedback submitted successfully.");
      setTimeout(() => {
        setShowFeedbackModal(false);
      }, 900);
    } catch (err) {
      setFeedbackStatus(err.message || "Failed to submit feedback.");
    } finally {
      setFeedbackLoading(false);
    }
  }

  function getReportedUserId() {
    if (!activeSessionForActions) return null;

    if (role === "USER") {
      return activeSessionForActions.listenerId || null;
    }

    if (role === "LISTENER") {
      return activeSessionForActions.userId || null;
    }

    return null;
  }

  async function submitReport(e) {
    e.preventDefault();

    if (!activeSessionForActions?.id) {
      setReportStatus("No session found to report.");
      return;
    }

    if (!reportForm.description.trim()) {
      setReportStatus("Please describe the issue.");
      return;
    }

    setReportLoading(true);
    setReportStatus("");

    try {
      const res = await fetch(`${API_URL}/chat/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: activeSessionForActions.id,
          category: reportForm.category,
          description: reportForm.description,
          reportedUserId: getReportedUserId(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to submit report.");
      }

      setReportStatus("Report submitted successfully.");
      setReportForm({
        category: "ABUSIVE_BEHAVIOR",
        description: "",
      });

      setTimeout(() => {
        setShowReportModal(false);
      }, 900);
    } catch (err) {
      setReportStatus(err.message || "Failed to submit report.");
    } finally {
      setReportLoading(false);
    }
  }

  function closeEndedFlow() {
    setShowEndedModal(false);
    setLastSessionSnapshot(null);
    setFeedbackForm({
      rating: 5,
      comment: "",
      wouldUseAgain: true,
    });
    setFeedbackStatus("");
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");

    window.location.href =
      role === "ADMIN"
        ? "/admin-login"
        : role === "LISTENER"
        ? "/listener-login"
        : "/user-login";
  }

  return (
    <div className="mc-page-shell">
      <img src={logo} alt="Micro-Counsel watermark" className="mc-watermark" />
      <img src={logo} alt="Micro-Counsel watermark" className="mc-watermark left" />

      <div className="mc-protected-wrap">
        <div className="mc-topbar fade-up">
          <div className="mc-brand">
            <img src={logo} alt="Micro-Counsel" />
            <div>
              <p className="mc-brand-title">Micro-Counsel Chat</p>
              <p className="mc-brand-subtitle">
                Anonymous support • Real-time connection • Safer conversations
              </p>
            </div>
          </div>

          <div className="mc-inline-actions">
            <div className="mc-pill">{connected ? "Connected" : "Connecting..."}</div>
            <div className="mc-pill">{currentAlias}</div>
            <button className="mc-button mc-button-secondary" onClick={logout}>
              Log out
            </button>
          </div>
        </div>

        <div className="mc-chat-grid">
          <RevealOnScroll variant="left">
            <aside className="mc-card mc-chat-sidebar">
              <span className="mc-pill" style={{ width: "fit-content", marginBottom: 14 }}>
                Calm support matching
              </span>

              <h2 className="mc-section-title">
                Begin a <span className="mc-gradient-text">support session</span>
              </h2>

              <p className="mc-section-subtitle">
                Choose a topic, select a session length, and connect with a listener or AI fallback support.
              </p>

              <hr className="mc-divider" />

              {role === "LISTENER" ? (
                <>
                  <RevealOnScroll>
                    <div className="mc-card-soft" style={{ padding: 18 }}>
                      <div className="mc-row-title">Listener availability</div>
                      <div className="mc-row-sub" style={{ marginBottom: 12 }}>
                        Toggle your status so users can be matched with you.
                      </div>
                      <button
                        type="button"
                        className={`mc-button ${isAvailable ? "mc-button-primary is-selected" : "mc-button-secondary"}`}
                        onClick={toggleAvailability}
                      >
                        {isAvailable ? "Available for chats" : "Set as available"}
                      </button>
                    </div>
                  </RevealOnScroll>

                  <hr className="mc-divider" />
                </>
              ) : null}

              <div className="mc-topic-list">
                <div className="mc-input-wrap">
                  <label className="mc-label">Topic</label>
                  <div className="mc-topic-list topic-compact">
                    {TOPICS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={`mc-topic-button ${topic === item ? "active is-selected" : ""}`}
                        onClick={() => setTopic(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mc-input-wrap">
                  <label className="mc-label">Session mode</label>
                  <select
                    className={`mc-select ${mode ? "is-selected" : ""}`}
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                  >
                    {MODES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mc-input-wrap">
                  <label className="mc-label">Duration</label>
                  <select
                    className={`mc-select ${duration ? "is-selected" : ""}`}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  >
                    {DURATIONS.map((item) => (
                      <option key={item} value={item}>
                        {item} minutes
                      </option>
                    ))}
                  </select>
                </div>

                {role !== "LISTENER" ? (
                  <button className="mc-button mc-button-primary is-selected" onClick={startSupportSession}>
                    Find support now
                  </button>
                ) : null}
              </div>

              <hr className="mc-divider" />

              <div className="mc-chat-meta-list">
                <div className="mc-card-soft" style={{ padding: 16 }}>
                  <div className="mc-row-title">Anonymous by design</div>
                  <div className="mc-mini-note">Only aliases are shown inside sessions.</div>
                </div>

                <div className="mc-card-soft" style={{ padding: 16 }}>
                  <div className="mc-row-title">Timed rooms</div>
                  <div className="mc-mini-note">Sessions end automatically with warning notices.</div>
                </div>

                <div className="mc-card-soft" style={{ padding: 16 }}>
                  <div className="mc-row-title">Moderated chat</div>
                  <div className="mc-mini-note">Flagged language can be masked before delivery.</div>
                </div>
              </div>
            </aside>
          </RevealOnScroll>

          <RevealOnScroll variant="right">
            <section className="mc-card mc-chat-main">
              <header className="mc-chat-header">
                <div>
                  <h2>{session ? session.topic || "Live support session" : "Waiting to connect"}</h2>
                  <p>
                    {session
                      ? "Stay respectful, gentle, and supportive during the session."
                      : "Choose your topic and start when you are ready."}
                  </p>
                </div>

                <div className="mc-inline-actions" style={{ alignItems: "center" }}>
                  {activeSessionForActions?.id ? (
                    <button className="mc-button mc-button-secondary is-selected" onClick={openReportModal}>
                      Report
                    </button>
                  ) : null}

                  <div className="mc-timer">
                    <strong>{formatSeconds(timerLeft)}</strong>
                    <span>time left</span>
                  </div>
                </div>
              </header>

              <div className="mc-message-list">
                {!session && messages.length === 0 ? (
                  <div className="mc-empty-state">
                    <div>
                      <strong>Your conversation space is ready</strong>
                      <span>
                        Start a session to connect with an approved listener or AI support fallback.
                      </span>
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const mine =
                      message?.isSelf ||
                      message?.senderAlias === currentAlias ||
                      message?.senderId === user?.id;

                    return (
                      <div key={message.id || index} className={`mc-message ${mine ? "self" : "other"}`}>
                        <div className="mc-message-meta">
                          <span>{message.senderAlias || (mine ? currentAlias : "Support")}</span>
                          <span>
                            {message.createdAt
                              ? new Date(message.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "now"}
                          </span>
                        </div>
                        <div className="mc-message-text">
                          {message.maskedText || message.text || message.content}
                        </div>
                      </div>
                    );
                  })
                )}

                {notice ? <div className="mc-warning-box">{notice}</div> : null}
                <div ref={bottomRef} />
              </div>

              <div className="mc-chat-inputbar">
                <div className="mc-chat-compose">
                  <textarea
                    className="mc-textarea"
                    placeholder={
                      session
                        ? "Type a gentle and respectful message..."
                        : "Start a session first to begin chatting..."
                    }
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    disabled={!session}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />

                  <div className="mc-inline-actions" style={{ justifyContent: "flex-end" }}>
                    {session ? (
                      <button className="mc-button mc-button-danger is-selected" onClick={endSession}>
                        End session
                      </button>
                    ) : null}

                    <button
                      className="mc-button mc-button-primary is-selected"
                      onClick={sendMessage}
                      disabled={!session || !draft.trim()}
                    >
                      Send message
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </RevealOnScroll>
        </div>
      </div>

      <Modal
        open={showEndedModal}
        title="Session ended"
        subtitle="Your conversation has ended. You can now share feedback or report an issue from this session."
        onClose={closeEndedFlow}
        actions={
          <>
            <button className="mc-button mc-button-secondary" onClick={closeEndedFlow}>
              Close
            </button>
            <button className="mc-button mc-button-secondary is-selected" onClick={openReportModal}>
              Report issue
            </button>
            <button className="mc-button mc-button-primary is-selected" onClick={openFeedbackModal}>
              Leave feedback
            </button>
          </>
        }
      >
        <div className="mc-card-soft" style={{ padding: 18 }}>
          <div className="mc-row-title">Conversation complete</div>
          <div className="mc-row-sub" style={{ marginTop: 8 }}>
            Messages have been cleared from the live chat window. Help improve the platform by rating your experience.
          </div>
        </div>
      </Modal>

      <Modal
        open={showFeedbackModal}
        title="Share your feedback"
        subtitle="Your feedback helps improve support quality, listener safety, and session experience."
        onClose={() => setShowFeedbackModal(false)}
      >
        <form className="mc-form-grid" onSubmit={submitFeedback}>
          <div className="mc-input-wrap">
            <label className="mc-label">Rating</label>
            <select
              className="mc-select is-selected"
              value={feedbackForm.rating}
              onChange={(e) =>
                setFeedbackForm((prev) => ({
                  ...prev,
                  rating: Number(e.target.value),
                }))
              }
            >
              <option value={5}>5 - Excellent</option>
              <option value={4}>4 - Good</option>
              <option value={3}>3 - Okay</option>
              <option value={2}>2 - Poor</option>
              <option value={1}>1 - Very poor</option>
            </select>
          </div>

          <div className="mc-input-wrap">
            <label className="mc-label">Would you use Micro-Counsel again?</label>
            <select
              className="mc-select is-selected"
              value={feedbackForm.wouldUseAgain ? "yes" : "no"}
              onChange={(e) =>
                setFeedbackForm((prev) => ({
                  ...prev,
                  wouldUseAgain: e.target.value === "yes",
                }))
              }
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          <div className="mc-input-wrap">
            <label className="mc-label">Optional comment</label>
            <textarea
              className="mc-textarea"
              placeholder="Share anything helpful about your session..."
              value={feedbackForm.comment}
              onChange={(e) =>
                setFeedbackForm((prev) => ({
                  ...prev,
                  comment: e.target.value,
                }))
              }
            />
          </div>

          {feedbackStatus ? (
            <div
              className={
                feedbackStatus.toLowerCase().includes("success")
                  ? "mc-success"
                  : "mc-error"
              }
            >
              {feedbackStatus}
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button
              type="button"
              className="mc-button mc-button-secondary"
              onClick={() => setShowFeedbackModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="mc-button mc-button-primary is-selected"
              disabled={feedbackLoading}
            >
              {feedbackLoading ? "Submitting..." : "Submit feedback"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showReportModal}
        title="Report an issue"
        subtitle="Use this form to report abusive behavior, unsafe advice, moderation failure, or any other issue from the session."
        onClose={() => setShowReportModal(false)}
      >
        <form className="mc-form-grid" onSubmit={submitReport}>
          <div className="mc-input-wrap">
            <label className="mc-label">Category</label>
            <select
              className="mc-select is-selected"
              value={reportForm.category}
              onChange={(e) =>
                setReportForm((prev) => ({
                  ...prev,
                  category: e.target.value,
                }))
              }
            >
              {REPORT_CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mc-input-wrap">
            <label className="mc-label">Describe the issue</label>
            <textarea
              className="mc-textarea"
              placeholder="Explain what happened during the session..."
              value={reportForm.description}
              onChange={(e) =>
                setReportForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              required
            />
          </div>

          {reportStatus ? (
            <div
              className={
                reportStatus.toLowerCase().includes("success")
                  ? "mc-success"
                  : "mc-error"
              }
            >
              {reportStatus}
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button
              type="button"
              className="mc-button mc-button-secondary"
              onClick={() => setShowReportModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="mc-button mc-button-primary is-selected"
              disabled={reportLoading}
            >
              {reportLoading ? "Submitting..." : "Submit report"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}