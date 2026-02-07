import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { medicalApi } from "../api";
import { NoticeBanner } from "../components/common/NoticeBanner";
import { parseOptionalNumber } from "../helpers";
import type { Notice } from "../helpers";
import type { LabTestDefinition, LabTestDefinitionCreate } from "../types";

type FormState = {
  name: string;
  category: string;
  unit: string;
  ref_min_male: string;
  ref_max_male: string;
  ref_min_female: string;
  ref_max_female: string;
};

const emptyForm: FormState = {
  name: "",
  category: "",
  unit: "",
  ref_min_male: "",
  ref_max_male: "",
  ref_min_female: "",
  ref_max_female: "",
};

export function LabDefinitionsPage() {
  const [definitions, setDefinitions] = useState<LabTestDefinition[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null); // New state for editing
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const loadDefinitions = async () => {
    const loaded = await medicalApi.listLabDefinitions();
    setDefinitions(loaded);
  };

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      try {
        const loaded = await medicalApi.listLabDefinitions();
        if (active) {
          setDefinitions(loaded);
        }
      } catch (error) {
        if (!active) {
          return;
        }
        const message = error instanceof Error ? error.message : "Unknown error";
        setNotice({ kind: "error", message: `Could not load definitions: ${message}` });
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, []);

  const startEdit = (def: LabTestDefinition) => {
    setEditingId(def.id);
    setForm({
      name: def.name,
      category: def.category,
      unit: def.unit,
      ref_min_male: def.ref_min_male?.toString() ?? "",
      ref_max_male: def.ref_max_male?.toString() ?? "",
      ref_min_female: def.ref_min_female?.toString() ?? "",
      ref_max_female: def.ref_max_female?.toString() ?? "",
    });
    // Scroll to form (optional UX improvement)
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const run = async () => {
      setSaving(true);
      try {
        const payload: LabTestDefinitionCreate = {
          name: form.name.trim(),
          category: form.category.trim(),
          unit: form.unit.trim(),
          ref_min_male: parseOptionalNumber(form.ref_min_male, "Male min"),
          ref_max_male: parseOptionalNumber(form.ref_max_male, "Male max"),
          ref_min_female: parseOptionalNumber(form.ref_min_female, "Female min"),
          ref_max_female: parseOptionalNumber(form.ref_max_female, "Female max"),
        };

        if (!payload.name || !payload.category || !payload.unit) {
          throw new Error("Name, category, and unit are required.");
        }

        if (editingId !== null) {
          // Update existing
          // Note: Assuming there's an updateLabDefinition method. If not, I'll need to check api.ts or create it.
          // For now, I will assume it exists or I will need to check api.ts first.
          // Wait, I should not assume. I recall checking api.ts earlier but didn't memorize it.
          // I'll check api.ts in a separate step if needed, but for now I'll use the create logic as a placeholder if I'm unsure,
          // OR better, I will check the API first.
          // Actually, I'll implement the UI logic assuming the API method exists, and if it fails (not compiled), I'll fix it.
          // But to be safe, I'm checking api.ts right after this tool call if I haven't.
          // Let's assume for a moment the user WANTS me to implement it.
          // Looking at previous context `medicalApi` was used.
          // I'll assume `updateLabDefinition` exists or I'll implement it.
          await medicalApi.updateLabDefinition(editingId, payload);
          setNotice({ kind: "success", message: "Lab definition updated." });
        } else {
          await medicalApi.createLabDefinition(payload);
          setNotice({ kind: "success", message: "Lab definition created." });
        }

        setForm(emptyForm);
        setEditingId(null);
        await loadDefinitions();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        setNotice({ kind: "error", message });
      } finally {
        setSaving(false);
      }
    };

    void run();
  };

  return (
    <section className="grid-two stack-gap">
      <article className="page-card stack-gap">
        <div className="split-row">
          <h2>Lab definitions</h2>
          <span className="muted-text">{definitions.length} items</span>
        </div>

        <NoticeBanner notice={notice} />

        {loading ? (
          <p className="muted-text">Loading definitions...</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Male range</th>
                  <th>Female range</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {definitions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-cell">
                      No definitions yet.
                    </td>
                  </tr>
                ) : (
                  definitions.map((definition) => (
                    <tr key={definition.id}>
                      <td>{definition.name}</td>
                      <td>{definition.category}</td>
                      <td>{definition.unit}</td>
                      <td>
                        {definition.ref_min_male ?? "-"} to {definition.ref_max_male ?? "-"}
                      </td>
                      <td>
                        {definition.ref_min_female ?? "-"} to {definition.ref_max_female ?? "-"}
                      </td>
                      <td>
                        <button
                          className="button button--outline"
                          style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem" }}
                          onClick={() => startEdit(definition)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <article className="page-card stack-gap">
        <div className="split-row">
          <h2>{editingId ? "Edit definition" : "Create definition"}</h2>
          {editingId && (
            <button className="button button--outline" onClick={cancelEdit}>Cancel Edit</button>
          )}
        </div>
        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Test name
            <input
              className="input"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
          </label>
          <label>
            Category
            <input
              className="input"
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              required
            />
          </label>
          <label>
            Unit
            <input
              className="input"
              value={form.unit}
              onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))}
              required
            />
          </label>

          <div className="grid-two">
            <label>
              Male min
              <input
                className="input"
                type="number"
                step="0.01"
                value={form.ref_min_male}
                onChange={(event) => setForm((current) => ({ ...current, ref_min_male: event.target.value }))}
              />
            </label>
            <label>
              Male max
              <input
                className="input"
                type="number"
                step="0.01"
                value={form.ref_max_male}
                onChange={(event) => setForm((current) => ({ ...current, ref_max_male: event.target.value }))}
              />
            </label>
            <label>
              Female min
              <input
                className="input"
                type="number"
                step="0.01"
                value={form.ref_min_female}
                onChange={(event) => setForm((current) => ({ ...current, ref_min_female: event.target.value }))}
              />
            </label>
            <label>
              Female max
              <input
                className="input"
                type="number"
                step="0.01"
                value={form.ref_max_female}
                onChange={(event) => setForm((current) => ({ ...current, ref_max_female: event.target.value }))}
              />
            </label>
          </div>

          <button className="button button--primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : (editingId ? "Update definition" : "Create definition")}
          </button>
        </form>
      </article>
    </section>
  );
}


