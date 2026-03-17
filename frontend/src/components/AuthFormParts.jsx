import React from "react";

export function Field({ label, children }) {
  return (
    <div className="mc-input-wrap">
      <label className="mc-label">{label}</label>
      {children}
    </div>
  );
}

export function TextInput(props) {
  return <input className="mc-input" {...props} />;
}

export function SelectInput(props) {
  return <select className="mc-select" {...props} />;
}

export function TextAreaInput(props) {
  return <textarea className="mc-textarea" {...props} />;
}

export function SubmitButton({ children, disabled }) {
  return (
    <button className="mc-button mc-button-primary" type="submit" disabled={disabled}>
      {disabled ? "Please wait..." : children}
    </button>
  );
}

export function StatusMessage({ error, success }) {
  if (error) return <div className="mc-error">{error}</div>;
  if (success) return <div className="mc-success">{success}</div>;
  return null;
}