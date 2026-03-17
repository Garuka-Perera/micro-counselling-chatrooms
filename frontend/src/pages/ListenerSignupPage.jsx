import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import {
  Field,
  SelectInput,
  StatusMessage,
  SubmitButton,
  TextInput,
} from "../components/AuthFormParts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function ListenerSignupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    language: "English",
    specialty: "General support",
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
      const res = await fetch(`${API_URL}/auth/signup/listener`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Listener signup failed.");
      }

      setSuccess("Listener application submitted. Awaiting admin approval.");
      setTimeout(() => navigate("/login/listener"), 1100);
    } catch (err) {
      setError(err.message || "Unable to complete signup.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Apply as a volunteer listener"
      subtitle="Create your listener profile for review. Approved listeners can support students in anonymous timed sessions."
      bottomText="Already applied?"
      bottomLinkText="Sign in"
      bottomLinkTo="/login/listener"
      sideTitle={
        <>
          Become part of a
          <br />
          <span className="mc-gradient-text">gentle support network</span>
        </>
      }
      sideDescription="Volunteer listeners help students feel heard in a calm, respectful, and moderated environment. Admin review keeps the experience safer for everyone."
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
            placeholder="listener@example.com"
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

        <Field label="Preferred language">
          <SelectInput name="language" value={form.language} onChange={updateField}>
            <option value="English">English</option>
            <option value="Sinhala">Sinhala</option>
            <option value="Tamil">Tamil</option>
          </SelectInput>
        </Field>

        <Field label="Support specialty">
          <SelectInput name="specialty" value={form.specialty} onChange={updateField}>
            <option value="General support">General support</option>
            <option value="Stress">Stress</option>
            <option value="Anxiety">Anxiety</option>
            <option value="Relationship">Relationship</option>
            <option value="Studies / exams">Studies / exams</option>
            <option value="Loneliness">Loneliness</option>
          </SelectInput>
        </Field>

        <SubmitButton disabled={loading}>Submit application</SubmitButton>
      </form>
    </AuthLayout>
  );
}