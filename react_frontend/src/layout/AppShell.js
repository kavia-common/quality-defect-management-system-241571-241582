import React, { useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function NavItem({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `navItem ${isActive ? "navItemActive" : ""}`}
      end
    >
      <span aria-hidden="true" style={{ width: 18, textAlign: "center" }}>
        {icon}
      </span>
      <span className="navLabel">{label}</span>
    </NavLink>
  );
}

// PUBLIC_INTERFACE
export function AppShell({ children }) {
  /** Main authenticated layout: sidebar + topbar + content. */
  const { user, signOut } = useAuth();
  const location = useLocation();

  const pageName = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith("/defects/new")) return "New Defect";
    if (path.startsWith("/defects/")) return "Defect Details";
    if (path.startsWith("/defects")) return "Defects";
    if (path.startsWith("/actions")) return "Corrective Actions";
    if (path.startsWith("/reports")) return "Reports";
    return "Dashboard";
  }, [location.pathname]);

  return (
    <div className="appShell">
      <aside className="sidebar" aria-label="Sidebar Navigation">
        <div className="brand">
          <div className="brandMark" aria-hidden="true" />
          <div>
            <div className="brandTitle">QDMS</div>
            <div className="brandSub">Ocean Professional</div>
          </div>
        </div>

        <nav className="nav">
          <NavItem to="/" label="Dashboard" icon="▦" />
          <NavItem to="/defects" label="Defects" icon="≡" />
          <NavItem to="/actions" label="Actions" icon="✓" />
          <NavItem to="/reports" label="Reports" icon="⎙" />
          <NavItem to="/settings" label="Settings" icon="⚙" />
        </nav>

        <div style={{ marginTop: "auto", padding: 10 }}>
          <div className="notice" style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 13 }}>{user?.name || "User"}</div>
            <div style={{ color: "var(--muted)", fontSize: 12 }}>{user?.email}</div>
            <div style={{ color: "var(--muted)", fontSize: 12 }}>Role: {user?.role || "—"}</div>
          </div>
          <button className="btn btnDanger" onClick={signOut} style={{ width: "100%" }}>
            Logout
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbarRow">
            <div>
              <div style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>{pageName}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                Track defects, root causes, and corrective actions
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="badge badgeBlue" title="Environment">
                Demo data
              </span>
              <span className="badge badgeAmber" title="Backend status">
                Backend: /api-docs minimal
              </span>
            </div>
          </div>
        </header>

        <main className="page">{children}</main>
      </div>
    </div>
  );
}
