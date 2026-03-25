import { httpRequest } from "./http";

/**
 * QDMS API facade (frontend).
 *
 * This module targets the Spring Boot backend REST API.
 * For developer ergonomics in preview environments, it includes a minimal "demo fallback"
 * only when the backend cannot be reached (network error / 5xx / CORS).
 *
 * Backend routes used:
 * - POST   /api/auth/login
 * - GET    /api/defects
 * - GET    /api/defects/{id}
 * - POST   /api/defects
 * - PUT    /api/defects/{id}
 * - DELETE /api/defects/{id}
 * - GET    /api/defects/{defectId}/actions
 * - POST   /api/defects/{defectId}/actions
 * - PUT    /api/actions/{actionId}
 * - DELETE /api/actions/{actionId}
 * - GET    /api/dashboard/severity-distribution
 * - GET    /api/dashboard/overdue-actions
 * - GET    /api/dashboard/defect-trend?days=N
 *
 * Public "hello/health/info" endpoints:
 * - GET /health
 * - GET /api/info
 */

const DEMO_KEY = "qdms_demo_state_v1";

function nowIso() {
  return new Date().toISOString();
}

function loadDemoState() {
  const raw = window.localStorage.getItem(DEMO_KEY);
  if (raw) return JSON.parse(raw);
  const seed = {
    defects: [
      {
        id: "D-1007",
        title: "Scratch on housing",
        area: "Assembly",
        severity: "MAJOR",
        status: "OPEN",
        detectedAt: nowIso(),
        reporter: "alex@factory.com",
        description: "Visible scratch on anodized housing after assembly.",
        fiveWhys: [
          { why: "Scratch visible after assembly", answer: "Part contacts fixture edge" },
          { why: "Why contact edge?", answer: "Fixture alignment pin worn" },
          { why: "Why pin worn?", answer: "No preventive replacement schedule" },
          { why: "Why no schedule?", answer: "Maintenance plan missing for fixture" },
          { why: "Why missing?", answer: "No ownership defined" },
        ],
      },
      {
        id: "D-1008",
        title: "Incorrect label applied",
        area: "Packaging",
        severity: "CRITICAL",
        status: "IN_PROGRESS",
        detectedAt: nowIso(),
        reporter: "maria@factory.com",
        description: "Wrong revision label on carton for batch 24-03A.",
        fiveWhys: [],
      },
    ],
    actions: [
      {
        id: "A-2001",
        defectId: "D-1007",
        owner: "maintenance@factory.com",
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString().slice(0, 10),
        status: "OPEN",
        title: "Replace alignment pin and validate fixture",
        notes: "",
      },
    ],
    users: [{ email: "demo@qdms.com", password: "demo", name: "Demo User", role: "QUALITY_ENGINEER" }],
  };
  window.localStorage.setItem(DEMO_KEY, JSON.stringify(seed));
  return seed;
}

function saveDemoState(state) {
  window.localStorage.setItem(DEMO_KEY, JSON.stringify(state));
}

function nextId(prefix, existingIds) {
  const numbers = existingIds
    .map((id) => Number(String(id).split("-")[1]))
    .filter((n) => Number.isFinite(n));
  const next = (numbers.length ? Math.max(...numbers) : 1000) + 1;
  return `${prefix}-${next}`;
}

async function demoDelay() {
  await new Promise((r) => setTimeout(r, 200));
}

function isConnectivityError(err) {
  // fetch network errors usually surface as TypeError; additionally treat 5xx as "backend unhealthy" for fallback.
  return (
    err?.name === "TypeError" ||
    err?.message?.toLowerCase().includes("failed to fetch") ||
    err?.status >= 500 ||
    err?.status === 0
  );
}

async function withDemoFallback(fn, fallbackFn) {
  try {
    return await fn();
  } catch (e) {
    if (isConnectivityError(e) && typeof fallbackFn === "function") return fallbackFn(e);
    throw e;
  }
}

function mapDefectFromApi(d) {
  // Backend returns numeric id and uses fields: location, createdBy, createdAt, updatedAt, status/severity enums.
  // Frontend UI expects: id(string), title, area, severity, status, detectedAt, reporter, description, fiveWhys.
  return {
    id: `D-${d.id}`,
    title: d.title,
    area: d.location || "—",
    severity: d.severity,
    status: d.status,
    detectedAt: d.createdAt || d.updatedAt || nowIso(),
    reporter: d.createdBy || "unknown",
    description: d.description || "",
    // RCA endpoints are separate; keep empty for now.
    fiveWhys: [],
  };
}

function mapDefectToUpdateRequest(patch) {
  // Backend expects full update request (DefectUpdateRequest) with known fields.
  // We map minimal patches; other fields remain undefined and should be handled server-side (DTO allows nulls).
  const mapped = {};
  if (patch.title !== undefined) mapped.title = patch.title;
  if (patch.description !== undefined) mapped.description = patch.description;
  if (patch.severity !== undefined) mapped.severity = patch.severity;
  if (patch.status !== undefined) mapped.status = patch.status;
  if (patch.area !== undefined) mapped.location = patch.area;
  return mapped;
}

function mapDefectToCreateRequest(payload) {
  return {
    title: payload.title,
    description: payload.description || "",
    severity: payload.severity,
    status: payload.status, // optional; backend can default
    location: payload.area || "",
  };
}

function mapActionFromApi(a) {
  return {
    id: `A-${a.id}`,
    defectId: `D-${a.defectId}`,
    owner: a.owner || "",
    dueDate: a.dueDate || "",
    status: a.status,
    title: a.description || "(no description)",
    notes: "",
  };
}

function parseUiId(uiId) {
  // Accept both "D-123" and "123"
  const s = String(uiId);
  const parts = s.split("-");
  const raw = parts.length > 1 ? parts[1] : parts[0];
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error("Invalid id");
  return n;
}

// PUBLIC_INTERFACE
export async function apiHealth() {
  /** Calls backend health endpoint. */
  return httpRequest("/health");
}

// PUBLIC_INTERFACE
export async function apiInfo() {
  /** Calls backend info endpoint. */
  return httpRequest("/api/info");
}

// PUBLIC_INTERFACE
export async function login({ email, password }) {
  /**
   * Logs in against backend and returns { token, user }.
   * Backend expects username/password. We pass email as username.
   */
  return withDemoFallback(
    async () => {
      const res = await httpRequest("/api/auth/login", {
        method: "POST",
        body: { username: email, password },
      });

      const roles = Array.isArray(res?.roles) ? res.roles : [];
      const role = roles.includes("ROLE_ADMIN")
        ? "ADMIN"
        : roles.includes("ROLE_QUALITY_ENGINEER")
          ? "QUALITY_ENGINEER"
          : roles[0] || "USER";

      return {
        token: res.accessToken,
        user: {
          email,
          name: email.split("@")[0],
          role,
        },
      };
    },
    async () => {
      // Demo fallback (same behavior as before) if backend is down.
      const state = loadDemoState();
      await demoDelay();
      const user = state.users.find((u) => u.email === email && u.password === password);
      if (!user) {
        const err = new Error("Invalid email or password");
        err.status = 401;
        throw err;
      }
      return {
        token: `demo-token:${email}:${Date.now()}`,
        user: { email: user.email, name: user.name, role: user.role },
      };
    }
  );
}

// PUBLIC_INTERFACE
export async function listDefects({ query = "", status = "ALL", severity = "ALL" } = {}) {
  /** Returns a list of defects matching the provided filters. */
  return withDemoFallback(
    async () => {
      const rows = await httpRequest("/api/defects");
      const mapped = (rows || []).map(mapDefectFromApi);

      return mapped
        .filter((d) => (status === "ALL" ? true : d.status === status))
        .filter((d) => (severity === "ALL" ? true : d.severity === severity))
        .filter((d) => {
          if (!query) return true;
          const q = query.toLowerCase();
          return (
            d.id.toLowerCase().includes(q) ||
            d.title.toLowerCase().includes(q) ||
            d.area.toLowerCase().includes(q) ||
            d.reporter.toLowerCase().includes(q)
          );
        })
        .sort((a, b) => (a.detectedAt < b.detectedAt ? 1 : -1));
    },
    async () => {
      // Demo fallback
      const state = loadDemoState();
      await demoDelay();
      return state.defects
        .filter((d) => (status === "ALL" ? true : d.status === status))
        .filter((d) => (severity === "ALL" ? true : d.severity === severity))
        .filter((d) => {
          if (!query) return true;
          const q = query.toLowerCase();
          return (
            d.id.toLowerCase().includes(q) ||
            d.title.toLowerCase().includes(q) ||
            d.area.toLowerCase().includes(q) ||
            d.reporter.toLowerCase().includes(q)
          );
        })
        .sort((a, b) => (a.detectedAt < b.detectedAt ? 1 : -1));
    }
  );
}

// PUBLIC_INTERFACE
export async function getDefect(defectId) {
  /** Returns a defect by id. */
  return withDemoFallback(
    async () => {
      const id = parseUiId(defectId);
      const d = await httpRequest(`/api/defects/${id}`);
      return mapDefectFromApi(d);
    },
    async () => {
      const state = loadDemoState();
      await demoDelay();
      const found = state.defects.find((d) => d.id === defectId);
      if (!found) throw new Error("Defect not found");
      return found;
    }
  );
}

// PUBLIC_INTERFACE
export async function createDefect(payload) {
  /** Creates a new defect. */
  return withDemoFallback(
    async () => {
      const created = await httpRequest("/api/defects", { method: "POST", body: mapDefectToCreateRequest(payload) });
      return mapDefectFromApi(created);
    },
    async () => {
      const state = loadDemoState();
      await demoDelay();
      const id = nextId("D", state.defects.map((d) => d.id));
      const defect = {
        id,
        title: payload.title,
        area: payload.area,
        severity: payload.severity,
        status: "OPEN",
        detectedAt: nowIso(),
        reporter: payload.reporter,
        description: payload.description || "",
        fiveWhys: payload.fiveWhys || [],
      };
      state.defects.push(defect);
      saveDemoState(state);
      return defect;
    }
  );
}

// PUBLIC_INTERFACE
export async function updateDefect(defectId, patch) {
  /** Updates defect fields (status etc.). */
  return withDemoFallback(
    async () => {
      const id = parseUiId(defectId);
      const updated = await httpRequest(`/api/defects/${id}`, { method: "PUT", body: mapDefectToUpdateRequest(patch) });
      return mapDefectFromApi(updated);
    },
    async () => {
      const state = loadDemoState();
      await demoDelay();
      const idx = state.defects.findIndex((d) => d.id === defectId);
      if (idx < 0) throw new Error("Defect not found");
      state.defects[idx] = { ...state.defects[idx], ...patch };
      saveDemoState(state);
      return state.defects[idx];
    }
  );
}

// PUBLIC_INTERFACE
export async function listActions({ defectId, status = "ALL" } = {}) {
  /** Lists corrective actions (optionally for a specific defect). */
  return withDemoFallback(
    async () => {
      // Backend only supports list by defect at the moment. If defectId not provided, aggregate by fetching defects.
      if (defectId) {
        const id = parseUiId(defectId);
        const rows = await httpRequest(`/api/defects/${id}/actions`);
        const mapped = (rows || []).map(mapActionFromApi);
        return status === "ALL" ? mapped : mapped.filter((a) => a.status === status);
      }

      const defects = await httpRequest("/api/defects");
      const all = [];
      for (const d of defects || []) {
        const rows = await httpRequest(`/api/defects/${d.id}/actions`);
        (rows || []).forEach((a) => all.push(mapActionFromApi(a)));
      }
      const filtered = status === "ALL" ? all : all.filter((a) => a.status === status);
      return filtered.sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1));
    },
    async () => {
      const state = loadDemoState();
      await demoDelay();
      return state.actions
        .filter((a) => (defectId ? a.defectId === defectId : true))
        .filter((a) => (status === "ALL" ? true : a.status === status))
        .sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1));
    }
  );
}

// PUBLIC_INTERFACE
export async function createAction(payload) {
  /** Creates a corrective action for a defect. */
  return withDemoFallback(
    async () => {
      const defectNumId = parseUiId(payload.defectId);
      const created = await httpRequest(`/api/defects/${defectNumId}/actions`, {
        method: "POST",
        body: {
          description: payload.title,
          owner: payload.owner,
          dueDate: payload.dueDate,
          status: payload.status, // optional; backend defaults
        },
      });
      return mapActionFromApi(created);
    },
    async () => {
      const state = loadDemoState();
      await demoDelay();
      const id = nextId("A", state.actions.map((a) => a.id));
      const action = {
        id,
        defectId: payload.defectId,
        owner: payload.owner,
        dueDate: payload.dueDate,
        status: "OPEN",
        title: payload.title,
        notes: payload.notes || "",
      };
      state.actions.push(action);
      saveDemoState(state);
      return action;
    }
  );
}

// PUBLIC_INTERFACE
export async function updateAction(actionId, patch) {
  /** Updates corrective action fields. */
  return withDemoFallback(
    async () => {
      const actionNumId = parseUiId(actionId);
      const updated = await httpRequest(`/api/actions/${actionNumId}`, {
        method: "PUT",
        body: {
          description: patch.title,
          owner: patch.owner,
          dueDate: patch.dueDate,
          status: patch.status,
        },
      });
      return mapActionFromApi(updated);
    },
    async () => {
      const state = loadDemoState();
      await demoDelay();
      const idx = state.actions.findIndex((a) => a.id === actionId);
      if (idx < 0) throw new Error("Action not found");
      state.actions[idx] = { ...state.actions[idx], ...patch };
      saveDemoState(state);
      return state.actions[idx];
    }
  );
}

// PUBLIC_INTERFACE
export async function getDashboardSummary() {
  /** Loads dashboard KPIs and distributions. */
  return withDemoFallback(
    async () => {
      const [sev, overdue] = await Promise.all([
        httpRequest("/api/dashboard/severity-distribution"),
        httpRequest("/api/dashboard/overdue-actions"),
      ]);

      // Backend responses: { counts: [{severity,count}] } and { overdueCount: N }
      const severityCounts = (sev?.counts || []).map((c) => ({ severity: c.severity, count: c.count }));
      const overdueActions = overdue?.overdueCount ?? 0;

      // There isn't a consolidated "recent defects" endpoint; use list and take top 5 by createdAt.
      const defects = await httpRequest("/api/defects");
      const mapped = (defects || []).map(mapDefectFromApi);
      const recentDefects = mapped
        .slice()
        .sort((a, b) => (a.detectedAt < b.detectedAt ? 1 : -1))
        .slice(0, 5);

      const open = mapped.filter((d) => d.status === "OPEN").length;
      const inProgress = mapped.filter((d) => d.status === "IN_PROGRESS").length;
      const closed = mapped.filter((d) => d.status === "CLOSED").length;

      return {
        kpis: { open, inProgress, closed, overdueActions },
        severityCounts,
        recentDefects,
      };
    },
    async () => {
      // Demo fallback
      const state = loadDemoState();
      await demoDelay();

      const open = state.defects.filter((d) => d.status === "OPEN").length;
      const inProgress = state.defects.filter((d) => d.status === "IN_PROGRESS").length;
      const closed = state.defects.filter((d) => d.status === "CLOSED").length;

      const severityCounts = ["LOW", "MAJOR", "CRITICAL"].map((s) => ({
        severity: s,
        count: state.defects.filter((d) => d.severity === s).length,
      }));

      const overdueActions = state.actions.filter(
        (a) => a.status !== "DONE" && a.dueDate < new Date().toISOString().slice(0, 10)
      ).length;

      return {
        kpis: { open, inProgress, closed, overdueActions },
        severityCounts,
        recentDefects: state.defects
          .slice()
          .sort((a, b) => (a.detectedAt < b.detectedAt ? 1 : -1))
          .slice(0, 5),
      };
    }
  );
}
