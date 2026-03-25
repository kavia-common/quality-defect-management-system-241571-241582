import React, { useEffect, useMemo, useState } from "react";
import { listActions, updateAction } from "../api/qdms";
import { Badge, Card, Notice } from "../components/ui";

// PUBLIC_INTERFACE
export function ActionsPage() {
  /** Lists and manages corrective actions across all defects. */
  const [status, setStatus] = useState("ALL");
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [savingId, setSavingId] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setErr("");
      try {
        const res = await listActions({ status });
        if (mounted) setRows(res);
      } catch (e) {
        if (mounted) setErr(e.message || "Failed to load actions");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [status]);

  const today = new Date().toISOString().slice(0, 10);

  const overdue = useMemo(() => rows.filter((a) => a.status !== "DONE" && a.dueDate < today).length, [rows, today]);

  const markDone = async (id) => {
    setSavingId(id);
    setErr("");
    try {
      await updateAction(id, { status: "DONE" });
      const res = await listActions({ status });
      setRows(res);
    } catch (e) {
      setErr(e.message || "Failed to update action");
    } finally {
      setSavingId("");
    }
  };

  return (
    <div>
      <div className="pageHeader">
        <div>
          <h1 className="h1">Corrective Actions</h1>
          <p className="p">Assign owners, due dates, and track overdue items.</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {overdue ? <span className="badge badgeRed">{overdue} overdue</span> : <span className="badge badgeBlue">No overdue</span>}
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 190 }}>
            <option value="ALL">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="DONE">Done</option>
          </select>
        </div>
      </div>

      {err && <Notice tone="error">{err}</Notice>}

      <Card title="Action List">
        <div className="tableWrap">
          <table className="table" aria-label="Actions table" style={{ minWidth: 0 }}>
            <thead>
              <tr>
                <th>Action</th>
                <th>Defect</th>
                <th>Owner</th>
                <th>Due</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const isOverdue = a.status !== "DONE" && a.dueDate < today;
                return (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 900 }}>{a.title}</div>
                      <div className="mono" style={{ color: "var(--muted)", fontSize: 12 }}>
                        {a.id}
                      </div>
                    </td>
                    <td className="mono">{a.defectId}</td>
                    <td>{a.owner}</td>
                    <td>{a.dueDate}</td>
                    <td>
                      <Badge tone={a.status === "DONE" ? "blue" : isOverdue ? "red" : "amber"}>{a.status}</Badge>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {a.status !== "DONE" ? (
                        <button className="btn btnPrimary" onClick={() => markDone(a.id)} disabled={savingId === a.id}>
                          {savingId === a.id ? "Saving..." : "Mark Done"}
                        </button>
                      ) : (
                        <span style={{ color: "var(--muted)" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!rows.length && (
                <tr>
                  <td colSpan={6} style={{ color: "var(--muted)" }}>
                    No actions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
