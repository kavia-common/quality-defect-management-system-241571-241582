import React, { useEffect, useMemo, useState } from "react";
import { listDefects, listActions } from "../api/qdms";
import { Card, Notice, Badge } from "../components/ui";

function bySeverity(defects) {
  const sev = { LOW: 0, MAJOR: 0, CRITICAL: 0 };
  defects.forEach((d) => {
    sev[d.severity] = (sev[d.severity] || 0) + 1;
  });
  return Object.entries(sev).map(([k, v]) => ({ severity: k, count: v }));
}

// PUBLIC_INTERFACE
export function ReportsPage() {
  /** Audit-friendly reporting view; supports print-to-PDF using browser print. */
  const [defects, setDefects] = useState([]);
  const [actions, setActions] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setErr("");
      try {
        const d = await listDefects();
        const a = await listActions();
        if (mounted) {
          setDefects(d);
          setActions(a);
        }
      } catch (e) {
        if (mounted) setErr(e.message || "Failed to load report data");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const sevRows = useMemo(() => bySeverity(defects), [defects]);

  const today = new Date().toISOString().slice(0, 10);
  const overdue = useMemo(
    () => actions.filter((a) => a.status !== "DONE" && a.dueDate < today).length,
    [actions, today]
  );

  const onPrint = () => window.print();

  return (
    <div>
      <div className="pageHeader">
        <div>
          <h1 className="h1">Reports</h1>
          <p className="p">Audit-ready snapshot. Use Print to save as PDF.</p>
        </div>
        <button className="btn btnPrimary" onClick={onPrint}>
          Print / Save PDF
        </button>
      </div>

      {err && <Notice tone="error">{err}</Notice>}

      <div className="grid3">
        <Card title="Total Defects">
          <div className="kpi">
            <div className="kpiValue">{defects.length}</div>
            <div className="kpiLabel">All records (demo)</div>
          </div>
        </Card>
        <Card title="Total Actions">
          <div className="kpi">
            <div className="kpiValue">{actions.length}</div>
            <div className="kpiLabel">Corrective actions</div>
          </div>
        </Card>
        <Card title="Overdue Actions" right={<Badge tone={overdue ? "red" : "blue"}>{overdue ? "Attention" : "OK"}</Badge>}>
          <div className="kpi">
            <div className="kpiValue">{overdue}</div>
            <div className="kpiLabel">Due date past today</div>
          </div>
        </Card>
      </div>

      <div style={{ height: 14 }} />

      <div className="grid2">
        <Card title="Severity Summary">
          <div className="tableWrap">
            <table className="table" style={{ minWidth: 0 }}>
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {sevRows.map((r) => (
                  <tr key={r.severity}>
                    <td>
                      <Badge tone={r.severity === "CRITICAL" ? "red" : r.severity === "MAJOR" ? "amber" : "blue"}>
                        {r.severity}
                      </Badge>
                    </td>
                    <td style={{ fontWeight: 900 }}>{r.count}</td>
                  </tr>
                ))}
                {!sevRows.length && (
                  <tr>
                    <td colSpan={2} style={{ color: "var(--muted)" }}>
                      No data.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Overdue Action Details">
          <div className="tableWrap">
            <table className="table" style={{ minWidth: 0 }}>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Owner</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {actions
                  .filter((a) => a.status !== "DONE" && a.dueDate < today)
                  .map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div style={{ fontWeight: 900 }}>{a.title}</div>
                        <div className="mono" style={{ color: "var(--muted)", fontSize: 12 }}>
                          {a.id} · {a.defectId}
                        </div>
                      </td>
                      <td>{a.owner}</td>
                      <td>{a.dueDate}</td>
                    </tr>
                  ))}
                {!actions.filter((a) => a.status !== "DONE" && a.dueDate < today).length && (
                  <tr>
                    <td colSpan={3} style={{ color: "var(--muted)" }}>
                      No overdue actions.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
