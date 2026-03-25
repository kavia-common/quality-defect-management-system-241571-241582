import React, { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Card, Badge, Notice } from "../components/ui";
import { getDashboardSummary } from "../api/qdms";
import { Link } from "react-router-dom";

const PIE_COLORS = {
  LOW: "#2563EB",
  MAJOR: "#F59E0B",
  CRITICAL: "#EF4444",
};

// PUBLIC_INTERFACE
export function DashboardPage() {
  /** Operational overview dashboard with KPIs and distributions. */
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getDashboardSummary();
        if (mounted) setData(res);
      } catch (e) {
        if (mounted) setErr(e.message || "Failed to load dashboard");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const severityPie = useMemo(() => {
    if (!data) return [];
    return data.severityCounts.map((s) => ({ name: s.severity, value: s.count }));
  }, [data]);

  return (
    <div>
      <div className="pageHeader">
        <div>
          <h1 className="h1">Dashboard</h1>
          <p className="p">Real-time trend snapshot and overdue alerts.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link className="btn" to="/defects/new">
            New Defect
          </Link>
          <Link className="btn btnPrimary" to="/defects">
            View Defects
          </Link>
        </div>
      </div>

      {err && <Notice tone="error">{err}</Notice>}

      <div className="grid3">
        <Card title="Open Defects">
          <div className="kpi">
            <div className="kpiValue">{data?.kpis.open ?? "—"}</div>
            <div className="kpiLabel">Items requiring triage</div>
          </div>
        </Card>
        <Card title="In Progress">
          <div className="kpi">
            <div className="kpiValue">{data?.kpis.inProgress ?? "—"}</div>
            <div className="kpiLabel">Under investigation / containment</div>
          </div>
        </Card>
        <Card title="Overdue Actions" right={<Badge tone="amber">Alert</Badge>}>
          <div className="kpi">
            <div className="kpiValue">{data?.kpis.overdueActions ?? "—"}</div>
            <div className="kpiLabel">Corrective actions past due</div>
          </div>
        </Card>
      </div>

      <div style={{ height: 14 }} />

      <div className="grid2">
        <Card
          title="Severity Distribution"
          right={<span style={{ fontSize: 12, color: "var(--muted)" }}>Last 30 days (demo)</span>}
        >
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={severityPie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
                  {severityPie.map((entry) => (
                    <Cell key={entry.name} fill={PIE_COLORS[entry.name] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {severityPie.map((s) => (
              <span key={s.name} className="badge badgeBlue" style={{ borderColor: "rgba(229,231,235,0.8)" }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: PIE_COLORS[s.name] || "#94a3b8",
                    display: "inline-block",
                  }}
                />
                {s.name}: {s.value}
              </span>
            ))}
          </div>
        </Card>

        <Card title="Recent Defects">
          <div className="tableWrap">
            <table className="table" style={{ minWidth: 0 }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Severity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentDefects || []).map((d) => (
                  <tr key={d.id}>
                    <td className="mono">
                      <Link to={`/defects/${d.id}`} style={{ color: "var(--primary)", fontWeight: 700 }}>
                        {d.id}
                      </Link>
                    </td>
                    <td>{d.title}</td>
                    <td>
                      <Badge tone={d.severity === "CRITICAL" ? "red" : d.severity === "MAJOR" ? "amber" : "blue"}>
                        {d.severity}
                      </Badge>
                    </td>
                    <td>
                      <Badge tone={d.status === "OPEN" ? "blue" : d.status === "IN_PROGRESS" ? "amber" : "blue"}>
                        {d.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {!data?.recentDefects?.length && (
                  <tr>
                    <td colSpan={4} style={{ color: "var(--muted)" }}>
                      No recent defects.
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
