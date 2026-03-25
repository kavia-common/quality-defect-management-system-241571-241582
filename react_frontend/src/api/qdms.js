import { httpRequest } from "./http";

/**
 * QDMS API facade.
 *
 * NOTE: The current backend OpenAPI spec only exposes hello/health/info endpoints.
 * Until defect/auth endpoints exist in the Spring Boot backend, this module falls back
 * to a local in-browser demo store to keep the full UI functional.
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
   * Attempts login. If backend auth not available, uses demo user store.
   * Returns { token, user }.
   */
  // No backend auth endpoints in spec; demo fallback.
  const state = loadDemoState();
  await demoDelay();
  const user = state.users.find((u) => u.email === email && u.password === password);
  if (!user) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }
  // Demo token.
  return {
    token: `demo-token:${email}:${Date.now()}`,
    user: { email: user.email, name: user.name, role: user.role },
  };
}

// PUBLIC_INTERFACE
export async function listDefects({ query = "", status = "ALL", severity = "ALL" } = {}) {
  /** Returns a list of defects matching the provided filters. */
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

// PUBLIC_INTERFACE
export async function getDefect(defectId) {
  /** Returns a defect by id. */
  const state = loadDemoState();
  await demoDelay();
  const found = state.defects.find((d) => d.id === defectId);
  if (!found) throw new Error("Defect not found");
  return found;
}

// PUBLIC_INTERFACE
export async function createDefect(payload) {
  /** Creates a new defect. */
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

// PUBLIC_INTERFACE
export async function updateDefect(defectId, patch) {
  /** Updates a defect fields (including 5 Whys). */
  const state = loadDemoState();
  await demoDelay();
  const idx = state.defects.findIndex((d) => d.id === defectId);
  if (idx < 0) throw new Error("Defect not found");
  state.defects[idx] = { ...state.defects[idx], ...patch };
  saveDemoState(state);
  return state.defects[idx];
}

// PUBLIC_INTERFACE
export async function listActions({ defectId, status = "ALL" } = {}) {
  /** Lists corrective actions (optionally for a specific defect). */
  const state = loadDemoState();
  await demoDelay();
  return state.actions
    .filter((a) => (defectId ? a.defectId === defectId : true))
    .filter((a) => (status === "ALL" ? true : a.status === status))
    .sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1));
}

// PUBLIC_INTERFACE
export async function createAction(payload) {
  /** Creates a corrective action. */
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

// PUBLIC_INTERFACE
export async function updateAction(actionId, patch) {
  /** Updates corrective action fields. */
  const state = loadDemoState();
  await demoDelay();
  const idx = state.actions.findIndex((a) => a.id === actionId);
  if (idx < 0) throw new Error("Action not found");
  state.actions[idx] = { ...state.actions[idx], ...patch };
  saveDemoState(state);
  return state.actions[idx];
}

// PUBLIC_INTERFACE
export async function getDashboardSummary() {
  /** Computes summary KPIs and distributions for dashboard. */
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
    recentDefects: state.defects.slice().sort((a, b) => (a.detectedAt < b.detectedAt ? 1 : -1)).slice(0, 5),
  };
}
