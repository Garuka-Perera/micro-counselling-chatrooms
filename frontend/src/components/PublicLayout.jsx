import React from "react";
import PublicNavbar from "./PublicNavbar";
import PublicFooter from "./PublicFooter";
import logo from "../assets/logo.png";

export default function PublicLayout({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, #f0fff0 0%, #ffffff 36%, #f8fff9 68%, #ffffff 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
          zIndex: 0,
        }}
      >
        <img
          src={logo}
          alt=""
          style={{
            position: "absolute",
            width: 700,
            right: -120,
            top: 60,
            opacity: 0.055,
            filter: "grayscale(0%) saturate(1.1)",
          }}
        />
        <img
          src={logo}
          alt=""
          style={{
            position: "absolute",
            width: 520,
            left: -120,
            bottom: 60,
            opacity: 0.04,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 420,
            height: 420,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(60,179,113,0.12) 0%, rgba(60,179,113,0) 70%)",
            top: -80,
            left: -80,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 380,
            height: 380,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(143,188,143,0.14) 0%, rgba(143,188,143,0) 72%)",
            bottom: -40,
            right: -40,
          }}
        />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        <PublicNavbar />
        {children}
        <PublicFooter />
      </div>
    </div>
  );
}