import React, { useState } from "react";
import AuthLayout from "../components/AuthLayout";
import { Field, StatusMessage, SubmitButton, TextInput } from "../components/AuthFormParts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [devResetUrl, setDevResetUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setDevResetUrl("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to start password reset.");
      }

      setSuccess(data.message || "Password reset started.");
      if (data.devResetUrl) {
        setDevResetUrl(data.devResetUrl);
      }
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email address and we will prepare a password reset link."
      bottomText="Remembered your password?"
      bottomLinkText="Go back to sign in"
      bottomLinkTo="/user-login"
    >
      <form className="mc-form-grid" onSubmit={handleSubmit}>
        <StatusMessage error={error} success={success} />

        <Field label="Email address">
          <TextInput
            type="email"
            name="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>

        {devResetUrl ? (
          <div className="mc-warning-box">
            Development reset link:{" "}
            <a
              href={devResetUrl}
              style={{ color: "var(--mc-primary-deep)", fontWeight: 700, wordBreak: "break-all" }}
            >
              {devResetUrl}
            </a>
          </div>
        ) : null}

        <SubmitButton disabled={loading}>Send reset link</SubmitButton>
      </form>
    </AuthLayout>
  );
}