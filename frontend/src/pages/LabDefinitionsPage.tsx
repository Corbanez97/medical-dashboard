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

        await medicalApi.createLabDefinition(payload);
        setForm(emptyForm);
        await loadDefinitions();
        setNotice({ kind: "success", message: "Lab definition created." });
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <article className="page-card stack-gap">
        <h2>Create definition</h2>
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
            {saving ? "Saving..." : "Save definition"}
          </button>
        </form>
      </article>
    </section>
  );
}


