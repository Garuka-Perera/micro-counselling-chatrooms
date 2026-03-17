import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { Field, StatusMessage, SubmitButton, TextInput } from "../components/AuthFormParts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function UserSignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/signup/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "User signup failed.");
      }

      setSuccess("Account created successfully. Redirecting to login...");
      setTimeout(() => navigate("/login/user"), 900);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create your student account"
      subtitle="Access anonymous support rooms, AI backup conversations, and a calmer mental wellness space."
      bottomText="Already have an account?"
      bottomLinkText="Sign in here"
      bottomLinkTo="/login/user"
    >
      <form className="mc-form-grid" onSubmit={handleSubmit}>
        <StatusMessage error={error} success={success} />

        <Field label="Full name">
          <TextInput
            type="text"
            name="fullName"
            placeholder="Enter your name"
            value={form.fullName}
            onChange={updateField}
            required
          />
        </Field>

        <Field label="Email address">
          <TextInput
            type="email"
            name="email"
            placeholder="student@example.com"
            value={form.email}
            onChange={updateField}
            required
          />
        </Field>

        <Field label="Password">
          <TextInput
            type="password"
            name="password"
            placeholder="Create a secure password"
            value={form.password}
            onChange={updateField}
            required
          />
        </Field>

        <SubmitButton disabled={loading}>Create account</SubmitButton>
      </form>
    </AuthLayout>
  );
}