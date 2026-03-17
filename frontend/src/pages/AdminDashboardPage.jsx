import React, { useEffect, useMemo, useState } from "react";
import logo from "../assets/logo.png";
import RevealOnScroll from "../components/RevealOnScroll";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const REPORT_STATUS_OPTIONS = [
  { label: "All statuses", value: "ALL" },
  { label: "Open", value: "OPEN" },
  { label: "Resolved", value: "RESOLVED" },
];

const REPORT_CATEGORY_OPTIONS = [
  { label: "All categories", value: "ALL" },
  { label: "Abusive behavior", value: "ABUSIVE_BEHAVIOR" },
  { label: "Unsafe advice", value: "UNSAFE_ADVICE" },
  { label: "Inappropriate listener", value: "INAPPROPRIATE_LISTENER" },
  { label: "Inappropriate user", value: "INAPPROPRIATE_USER" },
  { label: "Technical issue", value: "TECHNICAL_ISSUE" },
  { label: "Moderation failure", value: "MODERATION_FAILURE" },
  { label: "Other", value: "OTHER" },
];

const RISK_OPTIONS = [
  { label: "All flagged sessions", value: "ALL" },
  { label: "High risk only", value: "HIGH" },
  { label: "Medium risk", value: "MEDIUM" },
  { label: "Low risk", value: "LOW" },
];

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "—";
  }
}

function truncate(text, max = 120) {
  if (!text) return "—";
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}

function buildQuery(params) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

function PaginationControls({ pagination, onPageChange }) {
  if (!pagination) return null;

  return (
    <div className="mc-inline-actions" style={{ justifyContent: "space-between", marginTop: 16 }}>
      <div className="mc-mini-note">
        Page {pagination.page} of {pagination.totalPages} • {pagination.total} total
      </div>

      <div className="mc-inline-actions">
        <button
          className="mc-button mc-button-secondary"
          onClick={() => onPageChange(pagination.page - 1)}
          disabled={!pagination.hasPrevPage}
        >
          Previous
        </button>
        <button
          className="mc-button mc-button-secondary"
          onClick={() => onPageChange(pagination.page + 1)}
          disabled={!pagination.hasNextPage}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const token = localStorage.getItem("token");
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [overview, setOverview] = useState(null);

  const [listeners, setListeners] = useState([]);
  const [listenersPagination, setListenersPagination] = useState(null);

  const [reports, setReports] = useState([]);
  const [reportsPagination, setReportsPagination] = useState(null);

  const [feedback, setFeedback] = useState([]);
  const [feedbackPagination, setFeedbackPagination] = useState(null);

  const [highRiskSessions, setHighRiskSessions] = useState([]);
  const [highRiskPagination, setHighRiskPagination] = useState(null);

  const [reportFilters, setReportFilters] = useState({
    status: "ALL",
    category: "ALL",
    search: "",
    page: 1,
    pageSize: 5,
  });

  const [riskFilters, setRiskFilters] = useState({
    risk: "ALL",
    search: "",
    page: 1,
    pageSize: 5,
  });

  const [listenerFilters, setListenerFilters] = useState({
    page: 1,
    pageSize: 5,
  });

  const [feedbackFilters, setFeedbackFilters] = useState({
    page: 1,
    pageSize: 5,
  });

  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  async function fetchJson(path) {
    const res = await fetch(`${API_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || `Request failed for ${path}`);
    }

    return data;
  }

  async function loadDashboard(
    currentReportFilters = reportFilters,
    currentRiskFilters = riskFilters,
    currentListenerFilters = listenerFilters,
    currentFeedbackFilters = feedbackFilters
  ) {
    setLoading(true);
    setError("");

    try {
      const reportQuery = buildQuery(currentReportFilters);
      const riskQuery = buildQuery(currentRiskFilters);
      const listenerQuery = buildQuery(currentListenerFilters);
      const feedbackQuery = buildQuery(currentFeedbackFilters);

      const [overviewData, listenersData, reportsData, feedbackData, highRiskData] = await Promise.all([
        fetchJson("/admin/overview"),
        fetchJson(`/admin/listeners${listenerQuery}`),
        fetchJson(`/admin/reports${reportQuery}`),
        fetchJson(`/admin/feedback${feedbackQuery}`),
        fetchJson(`/admin/high-risk-sessions${riskQuery}`),
      ]);

      setOverview(overviewData.stats || null);

      setListeners(Array.isArray(listenersData.listeners) ? listenersData.listeners : []);
      setListenersPagination(listenersData.pagination || null);

      setReports(Array.isArray(reportsData.reports) ? reportsData.reports : []);
      setReportsPagination(reportsData.pagination || null);

      setFeedback(Array.isArray(feedbackData.feedback) ? feedbackData.feedback : []);
      setFeedbackPagination(feedbackData.pagination || null);

      setHighRiskSessions(Array.isArray(highRiskData.sessions) ? highRiskData.sessions : []);
      setHighRiskPagination(highRiskData.pagination || null);
    } catch (err) {
      setError(err.message || "Unable to load admin dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function approveListener(listenerId) {
    setBusyId(`approve-${listenerId}`);
    setError("");

    try {
      const res = await fetch(`${API_URL}/admin/listeners/${listenerId}/approve`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Unable to approve listener.");
      }

      await loadDashboard();
    } catch (err) {
      setError(err.message || "Approval failed.");
    } finally {
      setBusyId("");
    }
  }

  async function suspendListener(listenerId) {
    const reason = window.prompt("Enter a suspension reason for this listener:", "Suspended by admin.");
    if (reason === null) return;

    setBusyId(`suspend-${listenerId}`);
    setError("");

    try {
      const res = await fetch(`${API_URL}/admin/listeners/${listenerId}/suspend`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Unable to suspend listener.");
      }

      await loadDashboard();
    } catch (err) {
      setError(err.message || "Suspension failed.");
    } finally {
      setBusyId("");
    }
  }

  async function resolveReport(reportId) {
    const adminNote = window.prompt("Optional admin note for resolving this report:", "") ?? "";

    setBusyId(`resolve-${reportId}`);
    setError("");

    try {
      const res = await fetch(`${API_URL}/admin/reports/${reportId}/resolve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ adminNote }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Unable to resolve report.");
      }

      await loadDashboard();
    } catch (err) {
      setError(err.message || "Resolve failed.");
    } finally {
      setBusyId("");
    }
  }

  async function deactivateUser(userId, role) {
    const reason = window.prompt(
      `Enter a deactivation reason for this ${role?.toLowerCase() || "account"}:`,
      "Deactivated by admin."
    );
    if (reason === null) return;

    setBusyId(`deactivate-${userId}`);
    setError("");

    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/deactivate`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Unable to deactivate account.");
      }

      await loadDashboard();
    } catch (err) {
      setError(err.message || "Deactivation failed.");
    } finally {
      setBusyId("");
    }
  }

  const fallbackStats = useMemo(() => {
    const openReports = reports.filter((item) => item.status === "OPEN").length;
    const resolvedReports = reports.filter((item) => item.status === "RESOLVED").length;

    return {
      totalListeners: listenersPagination?.total || listeners.length,
      pendingListeners: 0,
      approvedListeners: 0,
      suspendedListeners: 0,
      availableListeners: 0,
      totalReports: reportsPagination?.total || reports.length,
      openReports,
      resolvedReports,
      totalFeedback: feedbackPagination?.total || feedback.length,
      averageRating:
        feedback.length > 0
          ? (
              feedback.reduce((sum, item) => sum + (Number(item.rating) || 0), 0) /
              feedback.length
            ).toFixed(1)
          : "0.0",
      highRiskSessions: highRiskPagination?.total || highRiskSessions.length,
      flaggedSessions: highRiskPagination?.total || highRiskSessions.length,
      deactivatedUsers: 0,
    };
  }, [
    listeners,
    listenersPagination,
    reports,
    reportsPagination,
    feedback,
    feedbackPagination,
    highRiskSessions,
    highRiskPagination,
  ]);

  const stats = overview || fallbackStats;

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    window.location.href = "/admin-login";
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
              <p className="mc-brand-title">Micro-Counsel Admin</p>
              <p className="mc-brand-subtitle">Moderation, pagination, and high-risk review</p>
            </div>
          </div>

          <div className="mc-inline-actions">
            <div className="mc-pill">{storedUser?.email || "Admin session"}</div>
            <button className="mc-button mc-button-secondary" onClick={() => loadDashboard()}>
              Refresh
            </button>
            <button className="mc-button mc-button-secondary" onClick={logout}>
              Log out
            </button>
          </div>
        </div>

        {error ? (
          <div className="mc-error" style={{ marginBottom: 18 }}>
            {error}
          </div>
        ) : null}

        <div className="mc-dashboard-grid">
          <RevealOnScroll variant="left">
            <aside className="mc-card mc-sidebar">
              <span className="mc-pill" style={{ width: "fit-content" }}>
                Safety overview
              </span>

              <h2 className="mc-section-title" style={{ marginTop: 18 }}>
                Moderation <span className="mc-gradient-text">control center</span>
              </h2>

              <p className="mc-section-subtitle">
                Review risk signals, large datasets, and safety actions in one place.
              </p>

              <div className="mc-sidebar-list">
                <div className="mc-card-soft mc-stat-card">
                  <span className="mc-stat-label">Open reports</span>
                  <strong className="mc-stat-value">{stats.openReports}</strong>
                  <span className="mc-stat-trend">Needs review</span>
                </div>

                <div className="mc-card-soft mc-stat-card">
                  <span className="mc-stat-label">Resolved reports</span>
                  <strong className="mc-stat-value">{stats.resolvedReports}</strong>
                  <span className="mc-stat-trend">Closed by admin</span>
                </div>

                <div className="mc-card-soft mc-stat-card">
                  <span className="mc-stat-label">High-risk sessions</span>
                  <strong className="mc-stat-value">{stats.highRiskSessions}</strong>
                  <span className="mc-stat-trend">Escalation queue</span>
                </div>

                <div className="mc-card-soft mc-stat-card">
                  <span className="mc-stat-label">Total listeners</span>
                  <strong className="mc-stat-value">{stats.totalListeners}</strong>
                  <span className="mc-stat-trend">Paginated list</span>
                </div>

                <div className="mc-card-soft mc-stat-card">
                  <span className="mc-stat-label">Feedback records</span>
                  <strong className="mc-stat-value">{stats.totalFeedback}</strong>
                  <span className="mc-stat-trend">Paginated review</span>
                </div>

                <div className="mc-card-soft mc-stat-card">
                  <span className="mc-stat-label">Average rating</span>
                  <strong className="mc-stat-value">{stats.averageRating}</strong>
                  <span className="mc-stat-trend">Out of 5.0</span>
                </div>
              </div>
            </aside>
          </RevealOnScroll>

          <main className="mc-grid">
            <RevealOnScroll>
              <section className="mc-card mc-hero-card">
                <span className="mc-pill" style={{ width: "fit-content", marginBottom: 14 }}>
                  Scalable moderation workflow
                </span>

                <h1 className="mc-section-title">
                  Paginated review for <span className="mc-gradient-text">larger datasets</span>
                </h1>

                <p className="mc-section-subtitle">
                  Reports, feedback, listeners, and flagged sessions now use pagination so the dashboard stays responsive as data grows.
                </p>
              </section>
            </RevealOnScroll>

            <RevealOnScroll variant="right">
              <section className="mc-card mc-list-card">
                <div className="mc-list-header">
                  <div>
                    <h2 className="mc-section-title" style={{ fontSize: "1.45rem", marginBottom: 6 }}>
                      Listener applications and actions
                    </h2>
                    <p className="mc-section-subtitle">
                      Approve pending listeners or suspend listeners when moderation issues arise.
                    </p>
                  </div>
                </div>

                {loading ? (
                  <div className="mc-empty-state">
                    <div>
                      <strong>Loading listeners…</strong>
                      <span>Please wait while applications are being retrieved.</span>
                    </div>
                  </div>
                ) : listeners.length === 0 ? (
                  <div className="mc-empty-state">
                    <div>
                      <strong>No listener applications found</strong>
                      <span>New listener registrations will appear here.</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mc-table-like">
                      {listeners.map((listener) => (
                        <div key={listener.id} className="mc-row">
                          <div>
                            <div className="mc-row-title">{listener.fullName}</div>
                            <div className="mc-row-sub">{listener.email}</div>
                            <div className="mc-row-sub">Created: {formatDate(listener.createdAt)}</div>
                          </div>

                          <div>
                            <div className="mc-row-title">{listener.language || "Not set"}</div>
                            <div className="mc-row-sub">{listener.specialty || "General support"}</div>
                          </div>

                          <div>
                            <span
                              className={`mc-badge ${
                                listener.listenerStatus === "APPROVED"
                                  ? "approved"
                                  : listener.listenerStatus === "SUSPENDED"
                                  ? "rejected"
                                  : "pending"
                              }`}
                            >
                              {listener.listenerStatus || "PENDING"}
                            </span>
                            <div className="mc-row-sub" style={{ marginTop: 8 }}>
                              {listener.isActive ? "Active account" : "Deactivated"}
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {listener.listenerStatus !== "APPROVED" ? (
                              <button
                                className="mc-button mc-button-primary"
                                onClick={() => approveListener(listener.id)}
                                disabled={busyId === `approve-${listener.id}`}
                              >
                                {busyId === `approve-${listener.id}` ? "Approving..." : "Approve"}
                              </button>
                            ) : null}

                            {listener.listenerStatus !== "SUSPENDED" ? (
                              <button
                                className="mc-button mc-button-danger"
                                onClick={() => suspendListener(listener.id)}
                                disabled={busyId === `suspend-${listener.id}`}
                              >
                                {busyId === `suspend-${listener.id}` ? "Suspending..." : "Suspend"}
                              </button>
                            ) : (
                              <button
                                className="mc-button mc-button-secondary"
                                onClick={() => approveListener(listener.id)}
                                disabled={busyId === `approve-${listener.id}`}
                              >
                                Reinstate
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <PaginationControls
                      pagination={listenersPagination}
                      onPageChange={(nextPage) => {
                        const next = { ...listenerFilters, page: nextPage };
                        setListenerFilters(next);
                        loadDashboard(reportFilters, riskFilters, next, feedbackFilters);
                      }}
                    />
                  </>
                )}
              </section>
            </RevealOnScroll>

            <RevealOnScroll>
              <section className="mc-card mc-list-card">
                <div className="mc-list-header">
                  <div>
                    <h2 className="mc-section-title" style={{ fontSize: "1.45rem", marginBottom: 6 }}>
                      Report filters
                    </h2>
                    <p className="mc-section-subtitle">
                      Narrow down reports by status, category, or related names/topics.
                    </p>
                  </div>
                </div>

                <div className="mc-grid mc-grid-3" style={{ marginBottom: 18 }}>
                  <div className="mc-input-wrap">
                    <label className="mc-label">Status</label>
                    <select
                      className="mc-select"
                      value={reportFilters.status}
                      onChange={(e) =>
                        setReportFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))
                      }
                    >
                      {REPORT_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mc-input-wrap">
                    <label className="mc-label">Category</label>
                    <select
                      className="mc-select"
                      value={reportFilters.category}
                      onChange={(e) =>
                        setReportFilters((prev) => ({ ...prev, category: e.target.value, page: 1 }))
                      }
                    >
                      {REPORT_CATEGORY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mc-input-wrap">
                    <label className="mc-label">Search</label>
                    <input
                      className="mc-input"
                      type="text"
                      placeholder="Search names, email, topic, notes..."
                      value={reportFilters.search}
                      onChange={(e) =>
                        setReportFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))
                      }
                    />
                  </div>
                </div>

                <div className="mc-inline-actions" style={{ marginBottom: 18 }}>
                  <button
                    className="mc-button mc-button-primary"
                    onClick={() => loadDashboard(reportFilters, riskFilters, listenerFilters, feedbackFilters)}
                  >
                    Apply report filters
                  </button>
                  <button
                    className="mc-button mc-button-secondary"
                    onClick={() => {
                      const reset = { status: "ALL", category: "ALL", search: "", page: 1, pageSize: 5 };
                      setReportFilters(reset);
                      loadDashboard(reset, riskFilters, listenerFilters, feedbackFilters);
                    }}
                  >
                    Reset filters
                  </button>
                </div>

                {loading ? (
                  <div className="mc-empty-state">
                    <div>
                      <strong>Loading reports…</strong>
                      <span>Please wait while reports are being retrieved.</span>
                    </div>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="mc-empty-state">
                    <div>
                      <strong>No matching reports found</strong>
                      <span>Try changing the filter values or search text.</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mc-table-like">
                      {reports.map((item) => (
                        <div
                          key={item.id}
                          className="mc-card-soft"
                          style={{ padding: 18, borderRadius: 20 }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 12,
                              flexWrap: "wrap",
                              alignItems: "center",
                            }}
                          >
                            <div className="mc-row-title">{item.category.replaceAll("_", " ")}</div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <span className={`mc-badge ${item.status === "RESOLVED" ? "approved" : "pending"}`}>
                                {item.status}
                              </span>
                              <span className="mc-badge pending">{formatDate(item.createdAt)}</span>
                            </div>
                          </div>

                          <div className="mc-row-sub" style={{ marginTop: 10 }}>
                            <strong>Reporter:</strong> {item.reporter?.fullName || "Unknown"} ({item.reporter?.role || "—"})
                          </div>

                          <div className="mc-row-sub" style={{ marginTop: 6 }}>
                            <strong>Reported user:</strong>{" "}
                            {item.reportedUser
                              ? `${item.reportedUser.fullName} (${item.reportedUser.role})`
                              : "Not specified"}
                          </div>

                          <div className="mc-row-sub" style={{ marginTop: 6 }}>
                            <strong>Session topic:</strong> {item.session?.topic || "—"} |{" "}
                            <strong>Risk:</strong> {item.session?.riskLevel || "—"} |{" "}
                            <strong>Flagged count:</strong> {item.session?.flaggedCount ?? "—"}
                          </div>

                          <div className="mc-row-sub" style={{ marginTop: 10 }}>
                            <strong>Description:</strong> {truncate(item.description, 220)}
                          </div>

                          {item.adminNote ? (
                            <div className="mc-row-sub" style={{ marginTop: 10 }}>
                              <strong>Admin note:</strong> {truncate(item.adminNote, 220)}
                            </div>
                          ) : null}

                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                            {item.status !== "RESOLVED" ? (
                              <button
                                className="mc-button mc-button-primary"
                                onClick={() => resolveReport(item.id)}
                                disabled={busyId === `resolve-${item.id}`}
                              >
                                {busyId === `resolve-${item.id}` ? "Resolving..." : "Resolve"}
                              </button>
                            ) : (
                              <button className="mc-button mc-button-secondary" disabled>
                                Resolved
                              </button>
                            )}

                            {item.reportedUser?.id && item.reportedUser?.isActive ? (
                              <button
                                className="mc-button mc-button-danger"
                                onClick={() => deactivateUser(item.reportedUser.id, item.reportedUser.role)}
                                disabled={busyId === `deactivate-${item.reportedUser.id}`}
                              >
                                {busyId === `deactivate-${item.reportedUser.id}` ? "Deactivating..." : "Deactivate account"}
                              </button>
                            ) : (
                              <button className="mc-button mc-button-secondary" disabled>
                                Account inactive
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <PaginationControls
                      pagination={reportsPagination}
                      onPageChange={(nextPage) => {
                        const next = { ...reportFilters, page: nextPage };
                        setReportFilters(next);
                        loadDashboard(next, riskFilters, listenerFilters, feedbackFilters);
                      }}
                    />
                  </>
                )}
              </section>
            </RevealOnScroll>

            <RevealOnScroll variant="right">
              <section className="mc-card mc-list-card">
                <div className="mc-list-header">
                  <div>
                    <h2 className="mc-section-title" style={{ fontSize: "1.45rem", marginBottom: 6 }}>
                      High-risk sessions
                    </h2>
                    <p className="mc-section-subtitle">
                      Dedicated review area for flagged, risky, or escalation-related chat sessions.
                    </p>
                  </div>
                </div>

                <div className="mc-grid mc-grid-2" style={{ marginBottom: 18 }}>
                  <div className="mc-input-wrap">
                    <label className="mc-label">Risk level</label>
                    <select
                      className="mc-select"
                      value={riskFilters.risk}
                      onChange={(e) =>
                        setRiskFilters((prev) => ({ ...prev, risk: e.target.value, page: 1 }))
                      }
                    >
                      {RISK_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mc-input-wrap">
                    <label className="mc-label">Search</label>
                    <input
                      className="mc-input"
                      type="text"
                      placeholder="Search topic, risk reason, names, email..."
                      value={riskFilters.search}
                      onChange={(e) =>
                        setRiskFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))
                      }
                    />
                  </div>
                </div>

                <div className="mc-inline-actions" style={{ marginBottom: 18 }}>
                  <button
                    className="mc-button mc-button-primary"
                    onClick={() => loadDashboard(reportFilters, riskFilters, listenerFilters, feedbackFilters)}
                  >
                    Apply risk filters
                  </button>
                  <button
                    className="mc-button mc-button-secondary"
                    onClick={() => {
                      const reset = { risk: "ALL", search: "", page: 1, pageSize: 5 };
                      setRiskFilters(reset);
                      loadDashboard(reportFilters, reset, listenerFilters, feedbackFilters);
                    }}
                  >
                    Reset risk filters
                  </button>
                </div>

                {loading ? (
                  <div className="mc-empty-state">
                    <div>
                      <strong>Loading high-risk sessions…</strong>
                      <span>Please wait while safety data is being retrieved.</span>
                    </div>
                  </div>
                ) : highRiskSessions.length === 0 ? (
                  <div className="mc-empty-state">
                    <div>
                      <strong>No matching high-risk sessions found</strong>
                      <span>Try changing the risk filters or search text.</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mc-table-like">
                      {highRiskSessions.map((item) => (
                        <div
                          key={item.id}
                          className="mc-card-soft"
                          style={{ padding: 18, borderRadius: 20 }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 12,
                              flexWrap: "wrap",
                              alignItems: "center",
                            }}
                          >
                            <div className="mc-row-title">{item.topic}</div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              <span className={`mc-badge ${item.riskLevel === "HIGH" ? "rejected" : "pending"}`}>
                                {item.riskLevel}
                              </span>
                              <span className="mc-badge pending">
                                Flags: {item.flaggedCount ?? 0}
                              </span>
                            </div>
                          </div>

                          <div className="mc-row-sub" style={{ marginTop: 10 }}>
                            <strong>Status:</strong> {item.status} | <strong>Mode:</strong> {item.mode}
                          </div>

                          <div className="mc-row-sub" style={{ marginTop: 6 }}>
                            <strong>User:</strong> {item.user?.fullName || item.user?.anonymousAlias || "—"} |{" "}
                            <strong>Listener:</strong> {item.listener?.fullName || "AI / none"}
                          </div>

                          <div className="mc-row-sub" style={{ marginTop: 6 }}>
                            <strong>Started:</strong> {formatDate(item.startedAt)} |{" "}
                            <strong>Ended:</strong> {formatDate(item.endedAt)}
                          </div>

                          <div className="mc-row-sub" style={{ marginTop: 6 }}>
                            <strong>High-risk detected:</strong> {item.highRiskDetected ? "Yes" : "No"} |{" "}
                            <strong>Emergency notice sent:</strong> {item.emergencyNoticeSent ? "Yes" : "No"}
                          </div>

                          <div className="mc-row-sub" style={{ marginTop: 10 }}>
                            <strong>Risk reason:</strong> {truncate(item.riskReason || "No specific reason recorded.", 220)}
                          </div>

                          {item.user?.id && item.user?.isActive ? (
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                              <button
                                className="mc-button mc-button-danger"
                                onClick={() => deactivateUser(item.user.id, item.user.role)}
                                disabled={busyId === `deactivate-${item.user.id}`}
                              >
                                {busyId === `deactivate-${item.user.id}` ? "Deactivating..." : "Deactivate user"}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>

                    <PaginationControls
                      pagination={highRiskPagination}
                      onPageChange={(nextPage) => {
                        const next = { ...riskFilters, page: nextPage };
                        setRiskFilters(next);
                        loadDashboard(reportFilters, next, listenerFilters, feedbackFilters);
                      }}
                    />
                  </>
                )}
              </section>
            </RevealOnScroll>

            <RevealOnScroll>
              <section className="mc-card mc-list-card">
                <div className="mc-list-header">
                  <div>
                    <h2 className="mc-section-title" style={{ fontSize: "1.45rem", marginBottom: 6 }}>
                      Session feedback
                    </h2>
                    <p className="mc-section-subtitle">
                      Review ratings and comments to understand support quality and user satisfaction.
                    </p>
                  </div>
                </div>

                {loading ? (
                  <div className="mc-empty-state">
                    <div>
                      <strong>Loading feedback…</strong>
                      <span>Please wait while feedback is being retrieved.</span>
                    </div>
                  </div>
                ) : feedback.length === 0 ? (
                  <div className="mc-empty-state">
                    <div>
                      <strong>No feedback found</strong>
                      <span>Session ratings and comments will appear here after submissions.</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mc-table-like">
                      {feedback.map((item) => (
                        <div
                          key={item.id}
                          className="mc-card-soft"
                          style={{ padding: 18, borderRadius: 20 }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 12,
                              flexWrap: "wrap",
                              alignItems: "center",
                            }}
                          >
                            <div className="mc-row-title">Rating: {item.rating}/5</div>
                            <span className="mc-badge approved">{formatDate(item.createdAt)}</span>
                          </div>

                          <div className="mc-row-sub" style={{ marginTop: 10 }}>
                            <strong>Submitted by:</strong> {item.submittedBy?.fullName || "Unknown"} ({item.submittedBy?.role || "—"})
                          </div>

                          <div className="mc-row-sub" style={{ marginTop: 6 }}>
                            <strong>Session topic:</strong> {item.session?.topic || "—"} |{" "}
                            <strong>Mode:</strong> {item.session?.mode || "—"} |{" "}
                            <strong>Risk:</strong> {item.session?.riskLevel || "—"}
                          </div>

                          <div className="mc-row-sub" style={{ marginTop: 6 }}>
                            <strong>Would use again:</strong>{" "}
                            {typeof item.wouldUseAgain === "boolean"
                              ? item.wouldUseAgain
                                ? "Yes"
                                : "No"
                              : "Not answered"}
                          </div>

                          <div className="mc-row-sub" style={{ marginTop: 10 }}>
                            <strong>Comment:</strong> {truncate(item.comment || "No comment provided.", 220)}
                          </div>
                        </div>
                      ))}
                    </div>

                    <PaginationControls
                      pagination={feedbackPagination}
                      onPageChange={(nextPage) => {
                        const next = { ...feedbackFilters, page: nextPage };
                        setFeedbackFilters(next);
                        loadDashboard(reportFilters, riskFilters, listenerFilters, next);
                      }}
                    />
                  </>
                )}
              </section>
            </RevealOnScroll>
          </main>
        </div>
      </div>
    </div>
  );
}