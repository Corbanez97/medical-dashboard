import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { medicalApi } from "../api";
import { NoticeBanner } from "../components/common/NoticeBanner";
import { formatDate, toTodayInput } from "../helpers";
import type { Notice } from "../helpers";
import type { SubjectiveEntry, SubjectiveEntryCreate } from "../types";
import type { PatientRouteContext } from "./PatientRouteLayout";

type FormState = {
  date: string;
  metric_name: string;
  score: string;
  notes: string;
};

const emptyForm: FormState = {
  date: toTodayInput(),
  metric_name: "Sono",
  score: "5",
  notes: "",
};

export function PatientSubjectivePage() {
  const { patientId } = useOutletContext<PatientRouteContext>();

  const [entries, setEntries] = useState<SubjectiveEntry[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const sorted = useMemo(() => {
    return [...entries].sort((left, right) => right.date.localeCompare(left.date));
  }, [entries]);

  const loadEntries = async () => {
    const loaded = await medicalApi.listPatientSubjectiveEntries(patientId);
    setEntries(loaded);
  };

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      setNotice(null);
      try {
        const loaded = await medicalApi.listPatientSubjectiveEntries(patientId);
        if (active) {
          setEntries(loaded);
        }
      } catch (error) {
        if (!active) {
          return;
        }
        const message = error instanceof Error ? error.message : "Unknown error";
        setNotice({ kind: "error", message: `Could not load subjective data: ${message}` });
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
        const score = Number.parseInt(form.score, 10);
        if (Number.isNaN(score) || score < 0 || score > 10) {
          throw new Error("Score must be between 0 and 10.");
        }

        const payload: SubjectiveEntryCreate = {
          patient_id: patientId,
          date: form.date,
          metric_name: form.metric_name.trim(),
          score,
          notes: form.notes.trim() || null,
        };

        if (!payload.metric_name) {
          throw new Error("Metric name is required.");
        }

        await medicalApi.createSubjectiveEntry(payload);
        setForm(emptyForm);
        await loadEntries();
        setNotice({ kind: "success", message: "Subjective entry saved." });
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
          <h3>Subjective history</h3>
          <span className="muted-text">{entries.length} records</span>
        </div>

        <NoticeBanner notice={notice} />

        {loading ? (
          <p className="muted-text">Loading history...</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Metric</th>
                  <th>Score</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty-cell">
                      No subjective records yet.
                    </td>
                  </tr>
                ) : (
                  sorted.map((entry) => (
                    <tr key={entry.id}>
                      <td>{formatDate(entry.date)}</td>
                      <td>{entry.metric_name}</td>
                      <td>{entry.score}</td>
                      <td>{entry.notes ?? "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <article className="page-card stack-gap">
        <h3>Add subjective entry</h3>
        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Date
            <input
              className="input"
              type="date"
              value={form.date}
              onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
              required
            />
          </label>

          <label>
            Metric
            <select
              className="input"
              value={form.metric_name}
              onChange={(event) => setForm((current) => ({ ...current, metric_name: event.target.value }))}
            >
              <option value="Sono">Sono</option>
              <option value="Energia">Energia</option>
              <option value="Libido">Libido</option>
              <option value="Fome">Fome</option>
              <option value="Humor">Humor</option>
            </select>
          </label>

          <label>
            Score (0-10)
            <input
              className="input"
              type="number"
              min="0"
              max="10"
              step="1"
              value={form.score}
              onChange={(event) => setForm((current) => ({ ...current, score: event.target.value }))}
              required
            />
          </label>

          <label>
            Notes
            <textarea
              className="input input--textarea"
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            />
          </label>

          <button className="button button--primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save subjective entry"}
          </button>
        </form>
      </article>
    </section>
  );
}


