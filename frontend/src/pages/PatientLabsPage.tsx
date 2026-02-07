import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { medicalApi } from "../api";
import { NoticeBanner } from "../components/common/NoticeBanner";
import { formatDate, parseRequiredNumber, toTodayInput } from "../helpers";
import type { Notice } from "../helpers";
import type { LabResult, LabResultCreate, LabTestDefinition } from "../types";
import type { PatientRouteContext } from "./PatientRouteLayout";

type FormState = {
  test_definition_id: string;
  collection_date: string;
  value: string;
  flag: string;
};

const emptyForm: FormState = {
  test_definition_id: "",
  collection_date: toTodayInput(),
  value: "",
  flag: "",
};

export function PatientLabsPage() {
  const { patientId } = useOutletContext<PatientRouteContext>();

  const [definitions, setDefinitions] = useState<LabTestDefinition[]>([]);
  const [results, setResults] = useState<LabResult[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const definitionMap = useMemo(() => {
    return new Map<number, LabTestDefinition>(definitions.map((definition) => [definition.id, definition]));
  }, [definitions]);

  const sorted = useMemo(() => {
    return [...results].sort((left, right) => right.collection_date.localeCompare(left.collection_date));
  }, [results]);

  const loadData = async () => {
    const [loadedDefinitions, loadedResults] = await Promise.all([
      medicalApi.listLabDefinitions(),
      medicalApi.listPatientLabResults(patientId),
    ]);
    setDefinitions(loadedDefinitions);
    setResults(loadedResults);
  };

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      setNotice(null);
      try {
        const [loadedDefinitions, loadedResults] = await Promise.all([
          medicalApi.listLabDefinitions(),
          medicalApi.listPatientLabResults(patientId),
        ]);

        if (!active) {
          return;
        }

        setDefinitions(loadedDefinitions);
        setResults(loadedResults);
      } catch (error) {
        if (!active) {
          return;
        }
        const message = error instanceof Error ? error.message : "Unknown error";
        setNotice({ kind: "error", message: `Could not load lab data: ${message}` });
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
  }, [patientId]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const run = async () => {
      setSaving(true);
      try {
        const definitionId = Number.parseInt(form.test_definition_id, 10);
        if (Number.isNaN(definitionId)) {
          throw new Error("Select one lab definition.");
        }

        const payload: LabResultCreate = {
          patient_id: patientId,
          test_definition_id: definitionId,
          collection_date: form.collection_date,
          value: parseRequiredNumber(form.value, "Value"),
          flag: form.flag.trim() || null,
        };

        await medicalApi.createLabResult(payload);
        setForm(emptyForm);
        await loadData();
        setNotice({ kind: "success", message: "Lab result saved." });
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
          <h3>Lab results</h3>
          <span className="muted-text">{results.length} records</span>
        </div>

        <NoticeBanner notice={notice} />

        {loading ? (
          <p className="muted-text">Loading results...</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Test</th>
                  <th>Value</th>
                  <th>Flag</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty-cell">
                      No lab records yet.
                    </td>
                  </tr>
                ) : (
                  sorted.map((item) => (
                    <tr key={item.id}>
                      <td>{formatDate(item.collection_date)}</td>
                      <td>{definitionMap.get(item.test_definition_id)?.name ?? item.test_definition_id}</td>
                      <td>
                        {item.value} {definitionMap.get(item.test_definition_id)?.unit ?? ""}
                      </td>
                      <td>{item.flag ?? "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <article className="page-card stack-gap">
        <h3>Add lab result</h3>
        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Test
            <select
              className="input"
              value={form.test_definition_id}
              onChange={(event) => setForm((current) => ({ ...current, test_definition_id: event.target.value }))}
              required
            >
              <option value="">Choose one</option>
              {definitions.map((definition) => (
                <option key={definition.id} value={definition.id}>
                  {definition.name} ({definition.unit})
                </option>
              ))}
            </select>
          </label>

          <label>
            Collection date
            <input
              className="input"
              type="date"
              value={form.collection_date}
              onChange={(event) => setForm((current) => ({ ...current, collection_date: event.target.value }))}
              required
            />
          </label>

          <label>
            Value
            <input
              className="input"
              type="number"
              step="0.01"
              value={form.value}
              onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))}
              required
            />
          </label>

          <label>
            Flag (optional)
            <input
              className="input"
              value={form.flag}
              onChange={(event) => setForm((current) => ({ ...current, flag: event.target.value }))}
              placeholder="low / normal / high"
            />
          </label>

          <button className="button button--primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save lab result"}
          </button>
        </form>
      </article>
    </section>
  );
}


