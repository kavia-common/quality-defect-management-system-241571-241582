import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listDefects } from "../api/qdms";
import { Badge, Card, Notice } from "../components/ui";

function severityTone(sev) {
  if (sev === "CRITICAL") return "red";
  if (sev === "MAJOR") return "amber";
  return "blue";
}

function statusTone(st) {
  if (st === "IN_PROGRESS") return "amber";
  return "blue";
}

// PUBLIC_INTERFACE
export function DefectsListPage() {
  /** List/search/filter defects. */
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [severity, setSeverity] = useState("ALL");
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setErr("");
      try {
        const res = await listDefects({ query, status, severity });
        if (mounted) setRows(res);
      } catch (e) {
        if (mounted) setErr(e.message || "Failed to load defects");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [query, status, severity]);

  return (
    <div>
      <div className="pageHeader">
        <div>
          <h1 className="h1">Defects</h1>
          <p className="p">Log, classify severity, and run 5 Whys root cause analysis.</p>
        </div>
        <Link className="btn btnPrimary" to="/defects/new">
          New Defect
        </Link>
      </div>

      {err && <Notice tone="error">{err}</Notice>}

      <Card title="Filters">
        <div className="formGrid2">
          <div>
            <div className="label">Search</div>
            <input
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ID, title, area, reporter..."
            />
          </div>
          <div className="formGrid2">
            <div>
              <div className="label">Status</div>
              <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="ALL">All</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            <div>
              <div className="label">Severity</div>
              <select className="select" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                <option value="ALL">All</option>
                <option value="LOW">Low</option>
                <option value="MAJOR">Major</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      <div style={{ height: 14 }} />

      <div className="tableWrap">
        <table className="table" aria-label="Defects table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Area</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Reporter</th>
              <th>Detected</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id}>
                <td className="mono">
                  <Link to={`/defects/${d.id}`} style={{ color: "var(--primary)", fontWeight: 800 }}>
                    {d.id}
                  </Link>
                </td>
                <td>{d.title}</td>
                <td>{d.area}</td>
                <td>
                  <Badge tone={severityTone(d.severity)}>{d.severity}</Badge>
                </td>
                <td>
                  <Badge tone={statusTone(d.status)}>{d.status}</Badge>
                </td>
                <td>{d.reporter}</td>
                <td style={{ color: "var(--muted)" }}>{new Date(d.detectedAt).toLocaleString()}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={7} style={{ color: "var(--muted)" }}>
                  No defects match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
