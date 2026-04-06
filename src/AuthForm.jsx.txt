import React, { useState } from "react";
import { supabase } from "./supabase";

function cardStyle(extra = {}) {
  return {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.06)",
    ...extra,
  };
}

function inputStyle() {
  return {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #d1d5db",
    fontSize: 14,
    boxSizing: "border-box",
  };
}

function buttonStyle(kind = "primary") {
  const base = {
    padding: "10px 14px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    border: "1px solid transparent",
    width: "100%",
  };

  if (kind === "secondary") {
    return {
      ...base,
      background: "#f8fafc",
      color: "#0f172a",
      border: "1px solid #d1d5db",
    };
  }

  return {
    ...base,
    background: "#0f172a",
    color: "white",
  };
}

export default function AuthForm() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: "http://localhost:5173",
          },
        });

        if (error) {
          alert(error.message);
          return;
        }

        if (data.user && !data.session) {
          alert("Account created. Please check your email and confirm your address before signing in.");
        } else {
          alert("Account created. You can now sign in.");
        }

        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          alert(error.message);
          return;
        }
      }

      setEmail("");
      setPassword("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={cardStyle({ padding: 24, width: "100%", maxWidth: 420 })}>
        <div style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>
          VolunteerNest
        </div>

        <h1 style={{ margin: "0 0 10px 0", fontSize: 30 }}>
          {mode === "signup" ? "Create account" : "Sign in"}
        </h1>

        <p style={{ margin: "0 0 20px 0", color: "#475569" }}>
          {mode === "signup"
            ? "Create your VolunteerNest account."
            : "Sign in to manage your volunteer activity."}
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>
              Email
            </label>
            <input
              style={inputStyle()}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontSize: 14 }}>
              Password
            </label>
            <input
              style={inputStyle()}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button style={buttonStyle()} type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "signup"
              ? "Create account"
              : "Sign in"}
          </button>
        </form>

        <div style={{ marginTop: 16 }}>
          {mode === "signup" ? (
            <button
              style={buttonStyle("secondary")}
              type="button"
              onClick={() => setMode("signin")}
            >
              Already have an account? Sign in
            </button>
          ) : (
            <button
              style={buttonStyle("secondary")}
              type="button"
              onClick={() => setMode("signup")}
            >
              Need an account? Create account
            </button>
          )}
        </div>
      </div>
    </div>
  );
}