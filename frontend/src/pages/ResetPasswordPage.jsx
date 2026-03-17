import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { Field, StatusMessage, SubmitButton, TextInput } from "../components/AuthFormParts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const token = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("token") || "";
  }, [location.search]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!token) {
      setError("Missing reset token. Open the reset link again.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to reset password.");
      }

      setSuccess(data.message || "Password reset successful.");
      setTimeout(() => {
        navigate("/user-login");
      }, 1200);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Choose a new password for your account."
      bottomText="Need a new reset link?"
      bottomLinkText="Forgot password"
      bottomLinkTo="/forgot-password"
    >
      <form className="mc-form-grid" onSubmit={handleSubmit}>
        <StatusMessage error={error} success={success} />

        <Field label="New password">
          <TextInput
            type="password"
            name="newPassword"
            placeholder="Enter a new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </Field>

        <Field label="Confirm new password">
          <TextInput
            type="password"
            name="confirmPassword"
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </Field>

        <SubmitButton disabled={loading}>Reset password</SubmitButton>
      </form>
    </AuthLayout>
  );
}