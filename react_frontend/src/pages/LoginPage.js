import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Notice } from "../components/ui";

// PUBLIC_INTERFACE
export function LoginPage() {
  /** Login screen for QDMS. */
  const { signIn, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("demo@qdms.com");
  const [password, setPassword] = useState("demo");
  const [error, setError] = useState("");

  const from = location.state?.from || "/";

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signIn({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, rgba(37,99,235,0.10), rgba(245,158,11,0.08), rgba(249,250,251,1))",
        display: "grid",
        placeItems: "center",
        padding: 18,
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: 520 }}>
        <div className="cardBody">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <div className="brandMark" aria-hidden="true" />
            <div>
              <div style={{ fontWeight: 900, letterSpacing: "-0.03em", fontSize: 18 }}>
                Quality Defect Management System
              </div>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>
                Sign in to manage defects, 5 Whys, and corrective actions
              </div>
            </div>
          </div>

          {error && <Notice tone="error">{error}</Notice>}

          <form onSubmit={onSubmit} style={{ marginTop: 12 }}>
            <div style={{ marginBottom: 12 }}>
              <div className="label">Email</div>
              <input
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div className="label">Password</div>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button className="btn btnPrimary" type="submit" disabled={loading} style={{ width: "100%" }}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div style={{ marginTop: 12, fontSize: 12, color: "var(--muted)" }}>
            Demo credentials are prefilled. This UI will automatically switch to real backend auth once endpoints
            are implemented.
          </div>
        </div>
      </div>
    </div>
  );
}
