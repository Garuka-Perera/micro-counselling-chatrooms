import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { Field, StatusMessage, SubmitButton, TextInput } from "../components/AuthFormParts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login/admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Admin login failed.");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", "ADMIN");
      localStorage.setItem("user", JSON.stringify(data.user || {}));
      navigate("/admin-dashboard");
    } catch (err) {
      setError(err.message || "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Admin access"
      subtitle="Review listener applications, monitor safety workflows, and manage the platform."
      sideTitle={
        <>
          Calm platform control
          <br />
          <span className="mc-gradient-text">with safety oversight</span>
        </>
      }
      sideDescription="Admins approve listeners, monitor reports, and keep the support environment aligned with privacy, moderation, and student wellbeing goals."
    >
      <form className="mc-form-grid" onSubmit={handleSubmit}>
        <StatusMessage error={error} />

        <Field label="Admin email">
          <TextInput
            type="email"
            name="email"
            placeholder="admin@example.com"
            value={form.email}
            onChange={updateField}
            required
          />
        </Field>

        <Field label="Password">
          <TextInput
            type="password"
            name="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={updateField}
            required
          />
        </Field>

        <div className="mc-helper-text" style={{ marginTop: -4 }}>
          <Link to="/forgot-password" style={{ color: "var(--mc-primary-deep)", fontWeight: 700 }}>
            Forgot your password?
          </Link>
        </div>

        <SubmitButton disabled={loading}>Enter dashboard</SubmitButton>
      </form>
    </AuthLayout>
  );
}