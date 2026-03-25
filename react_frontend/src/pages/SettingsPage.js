import React, { useEffect, useState } from "react";
import { apiHealth, apiInfo } from "../api/qdms";
import { Card, Notice } from "../components/ui";
import { getApiBaseUrl } from "../api/http";

// PUBLIC_INTERFACE
export function SettingsPage() {
  /** Settings and connectivity diagnostics. */
  const [health, setHealth] = useState("");
  const [info, setInfo] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setErr("");
      try {
        const h = await apiHealth();
        const i = await apiInfo();
        if (mounted) {
          setHealth(String(h));
          setInfo(String(i));
        }
      } catch (e) {
        if (mounted) setErr(e.message || "Failed to contact backend");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <div className="pageHeader">
        <div>
          <h1 className="h1">Settings</h1>
          <p className="p">Environment and connectivity diagnostics.</p>
        </div>
      </div>

      {err && <Notice tone="error">{err}</Notice>}

      <div className="grid2">
        <Card title="API Configuration">
          <Notice>
            Configure <span className="mono">REACT_APP_API_BASE_URL</span> to point to the Spring Boot backend.
          </Notice>
          <div style={{ marginTop: 10 }}>
            <div className="label">Current base URL</div>
            <div className="notice mono">{getApiBaseUrl() || "(same-origin)"}</div>
          </div>
        </Card>

        <Card title="Backend Status">
          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <div className="label">/health</div>
              <div className="notice mono">{health || "Loading..."}</div>
            </div>
            <div>
              <div className="label">/api/info</div>
              <div className="notice mono">{info || "Loading..."}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
