import React from "react";

export default function Modal({
  open,
  title,
  subtitle,
  children,
  onClose,
  actions,
  width = 560,
}) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(14, 33, 22, 0.42)",
        backdropFilter: "blur(6px)",
        display: "grid",
        placeItems: "center",
        zIndex: 9999,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="mc-card"
        style={{
          width: "min(100%, " + width + "px)",
          padding: 24,
          borderRadius: 28,
          background: "linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(241,248,243,0.98) 100%)",
          border: "1px solid rgba(25, 135, 84, 0.10)",
          boxShadow: "0 24px 70px rgba(15, 93, 57, 0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "1.45rem",
                color: "var(--mc-primary-deep)",
                letterSpacing: "-0.03em",
              }}
            >
              {title}
            </h3>

            {subtitle ? (
              <p
                style={{
                  margin: "10px 0 0",
                  color: "var(--mc-text-soft)",
                  lineHeight: 1.6,
                }}
              >
                {subtitle}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            className="mc-button mc-button-secondary"
            onClick={onClose}
            style={{
              minWidth: 44,
              minHeight: 44,
              padding: "0 14px",
              borderRadius: 14,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginTop: 20 }}>{children}</div>

        {actions ? (
          <div
            style={{
              marginTop: 24,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}