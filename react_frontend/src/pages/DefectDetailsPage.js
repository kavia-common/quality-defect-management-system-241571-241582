import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { createAction, getDefect, listActions, updateDefect } from "../api/qdms";
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
export function DefectDetailsPage() {
  /** Detailed view: defect fields, 5 Whys, and associated corrective actions. */
  const { defectId } = useParams();

  const [defect, setDefect] = useState(null);
  const [actions, setActions] = useState([]);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const [newActionTitle, setNewActionTitle] = useState("");
  const [newActionOwner, setNewActionOwner] = useState("maintenance@factory.com");
  const [newActionDue, setNewActionDue] = useState(new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10));

  useEffect(() => {
    let mounted = true;
    (async () => {
      setErr("");
      try {
        const d = await getDefect(defectId);
        const a = await listActions({ defectId });
        if (mounted) {
          setDefect(d);
          setActions(a);
        }
      } catch (e) {
        if (mounted) setErr(e.message || "Failed to load defect");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [defectId]);

  const fiveWhys = defect?.fiveWhys || [];

  const overdueCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return actions.filter((a) => a.status !== "DONE" && a.dueDate < today).length;
  }, [actions]);

  const patchStatus = async (next) => {
    if (!defect) return;
    setSaving(true);
    setErr("");
    try {
      const updated = await updateDefect(defect.id, { status: next });
      setDefect(updated);
    } catch (e) {
      setErr(e.message || "Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  const onCreateAction = async (e) => {
    e.preventDefault();
    if (!newActionTitle.trim()) return;
    setSaving(true);
    setErr("");
    try {
      await createAction({
        defectId,
        title: newActionTitle.trim(),
        owner: newActionOwner.trim(),
        dueDate: newActionDue,
      });
      setNewActionTitle("");
      const a = await listActions({ defectId });
      setActions(a);
    } catch (e2) {
      setErr(e2.message || "Failed to create action");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="pageHeader">
        <div>
          <h1 className="h1">Defect {defectId}</h1>
          <p className="p">Structured investigation and corrective action tracking.</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="btn" to="/defects">
            Back to Defects
          </Link>
          <button className="btn" disabled={saving} onClick={() => patchStatus("IN_PROGRESS")}>
            Mark In Progress
          </button>
          <button className="btn btnPrimary" disabled={saving} onClick={() => patchStatus("CLOSED")}>
            Close Defect
          </button>
        </div>
      </div>

      {err && <Notice tone="error">{err}</Notice>}

      {!defect ? (
        <Notice>Loading...</Notice>
      ) : (
        <div className="grid2">
          <Card
            title="Overview"
            right={
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Badge tone={severityTone(defect.severity)}>{defect.severity}</Badge>
                <Badge tone={statusTone(defect.status)}>{defect.status}</Badge>
              </div>
            }
          >
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>{defect.title}</div>
              <div style={{ color: "var(--muted)", fontSize: 13 }}>
                Area: <strong style={{ color: "var(--text)" }}>{defect.area}</strong> · Reporter:{" "}
                <strong style={{ color: "var(--text)" }}>{defect.reporter}</strong>
              </div>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>
                Detected: {new Date(defect.detectedAt).toLocaleString()}
              </div>
              <div className="notice" style={{ marginTop: 6 }}>
                {defect.description || <span style={{ color: "var(--muted)" }}>No description provided.</span>}
              </div>
            </div>
          </Card>

          <Card
            title="Corrective Actions"
            right={
              overdueCount ? (
                <span className="badge badgeRed">{overdueCount} overdue</span>
              ) : (
                <span className="badge badgeBlue">On track</span>
              )
            }
          >
            <form onSubmit={onCreateAction} style={{ marginBottom: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 140px", gap: 10 }}>
                <input
                  className="input"
                  value={newActionTitle}
                  onChange={(e) => setNewActionTitle(e.target.value)}
                  placeholder="New action title"
                />
                <input
                  className="input"
                  value={newActionOwner}
                  onChange={(e) => setNewActionOwner(e.target.value)}
                  placeholder="Owner email"
                />
                <input
                  className="input"
                  type="date"
                  value={newActionDue}
                  onChange={(e) => setNewActionDue(e.target.value)}
                />
              </div>
              <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                <button className="btn btnPrimary" type="submit" disabled={saving}>
                  Add Action
                </button>
              </div>
            </form>

            <div className="tableWrap">
              <table className="table" style={{ minWidth: 0 }}>
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Owner</th>
                    <th>Due</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {actions.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div style={{ fontWeight: 800 }}>{a.title}</div>
                        <div className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>
                          {a.id}
                        </div>
                      </td>
                      <td>{a.owner}</td>
                      <td>{a.dueDate}</td>
                      <td>
                        <Badge tone={a.status === "DONE" ? "blue" : a.dueDate < new Date().toISOString().slice(0, 10) ? "red" : "amber"}>
                          {a.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {!actions.length && (
                    <tr>
                      <td colSpan={4} style={{ color: "var(--muted)" }}>
                        No corrective actions yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="5 Whys (RCA)">
            {fiveWhys.length ? (
              <div style={{ display: "grid", gap: 10 }}>
                {fiveWhys.map((w, idx) => (
                  <div key={idx} className="notice">
                    <div style={{ fontWeight: 900, marginBottom: 4 }}>Why #{idx + 1}</div>
                    <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 6 }}>{w.why}</div>
                    <div>{w.answer}</div>
                  </div>
                ))}
              </div>
            ) : (
              <Notice>No 5 Whys recorded yet. Create a defect with RCA or add it via backend once available.</Notice>
            )}
          </Card>

          <Card title="Audit Notes">
            <Notice>
              PDF export and formal reporting will be enabled once backend endpoints exist. For now, use the Reports tab
              to generate a printable report view.
            </Notice>
          </Card>
        </div>
      )}
    </div>
  );
}
