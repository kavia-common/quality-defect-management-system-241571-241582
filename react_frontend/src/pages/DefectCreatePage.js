import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createDefect } from "../api/qdms";
import { Card, Notice } from "../components/ui";
import { useAuth } from "../auth/AuthContext";

function emptyWhy() {
  return { why: "", answer: "" };
}

// PUBLIC_INTERFACE
export function DefectCreatePage() {
  /** Create a new defect record with optional 5 Whys. */
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [area, setArea] = useState("Assembly");
  const [severity, setSeverity] = useState("MAJOR");
  const [description, setDescription] = useState("");
  const [fiveWhys, setFiveWhys] = useState([emptyWhy(), emptyWhy(), emptyWhy(), emptyWhy(), emptyWhy()]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const setWhyField = (idx, field, value) => {
    setFiveWhys((prev) => prev.map((w, i) => (i === idx ? { ...w, [field]: value } : w)));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!title.trim()) return setErr("Title is required");
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        area,
        severity,
        reporter: user?.email || "unknown",
        description,
        fiveWhys: fiveWhys.filter((w) => w.why.trim() || w.answer.trim()),
      };
      const created = await createDefect(payload);
      navigate(`/defects/${created.id}`);
    } catch (e2) {
      setErr(e2.message || "Failed to create defect");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="pageHeader">
        <div>
          <h1 className="h1">New Defect</h1>
          <p className="p">Capture what happened, where, and how severe it is.</p>
        </div>
      </div>

      {err && <Notice tone="error">{err}</Notice>}

      <form onSubmit={onSubmit}>
        <div className="grid2">
          <Card title="Defect Details">
            <div style={{ marginBottom: 12 }}>
              <div className="label">Title</div>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="formGrid2" style={{ marginBottom: 12 }}>
              <div>
                <div className="label">Area</div>
                <select className="select" value={area} onChange={(e) => setArea(e.target.value)}>
                  <option>Assembly</option>
                  <option>Packaging</option>
                  <option>Incoming</option>
                  <option>Machining</option>
                  <option>Final Inspection</option>
                </select>
              </div>
              <div>
                <div className="label">Severity</div>
                <select className="select" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                  <option value="LOW">Low</option>
                  <option value="MAJOR">Major</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div className="label">Description</div>
              <textarea
                className="textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What was observed? Include part numbers, batch, equipment, shift, etc."
              />
            </div>

            <button className="btn btnPrimary" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Create Defect"}
            </button>
          </Card>

          <Card
            title="5 Whys (Root Cause Analysis)"
            right={<span style={{ fontSize: 12, color: "var(--muted)" }}>Optional</span>}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {fiveWhys.map((w, idx) => (
                <div key={idx} className="card" style={{ borderRadius: 12 }}>
                  <div className="cardBody" style={{ padding: 12 }}>
                    <div style={{ fontWeight: 800, marginBottom: 8 }}>Why #{idx + 1}</div>
                    <div style={{ marginBottom: 8 }}>
                      <div className="label">Why?</div>
                      <input
                        className="input"
                        value={w.why}
                        onChange={(e) => setWhyField(idx, "why", e.target.value)}
                        placeholder="e.g., Why was the part scratched?"
                      />
                    </div>
                    <div>
                      <div className="label">Because...</div>
                      <input
                        className="input"
                        value={w.answer}
                        onChange={(e) => setWhyField(idx, "answer", e.target.value)}
                        placeholder="e.g., It contacted a fixture edge."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
}
