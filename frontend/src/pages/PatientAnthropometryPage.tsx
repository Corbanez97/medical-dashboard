import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { medicalApi } from "../api";
import { NoticeBanner } from "../components/common/NoticeBanner";
import { formatDate, formatDecimal, parseOptionalNumber, toTodayInput } from "../helpers";
import type { Notice } from "../helpers";
import type { AnthropometryEntry, AnthropometryEntryCreate } from "../types";
import type { PatientRouteContext } from "./PatientRouteLayout";

type FormState = {
  date: string;
  waist_cm: string;
  abdomen_cm: string;
  hips_cm: string;
  right_arm_cm: string;
  left_arm_cm: string;
  right_thigh_cm: string;
  left_thigh_cm: string;
};

const emptyForm: FormState = {
  date: toTodayInput(),
  waist_cm: "",
  abdomen_cm: "",
  hips_cm: "",
  right_arm_cm: "",
  left_arm_cm: "",
  right_thigh_cm: "",
  left_thigh_cm: "",
};

export function PatientAnthropometryPage() {
  const { patientId } = useOutletContext<PatientRouteContext>();

  const [entries, setEntries] = useState<AnthropometryEntry[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const sorted = useMemo(() => {
    return [...entries].sort((left, right) => right.date.localeCompare(left.date));
  }, [entries]);

  const loadEntries = async () => {
    const loaded = await medicalApi.listPatientAnthropometry(patientId);
    setEntries(loaded);
  };

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      setNotice(null);
      try {
        const loaded = await medicalApi.listPatientAnthropometry(patientId);
        if (active) {
          setEntries(loaded);
        }
      } catch (error) {
        if (!active) {
          return;
        }
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        setNotice({ kind: "error", message: `Não foi possível carregar dados de antropometria: ${message}` });
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
        const payload: AnthropometryEntryCreate = {
          patient_id: patientId,
          date: form.date,
          waist_cm: parseOptionalNumber(form.waist_cm, "Cintura"),
          abdomen_cm: parseOptionalNumber(form.abdomen_cm, "Abdômen"),
          hips_cm: parseOptionalNumber(form.hips_cm, "Quadril"),
          right_arm_cm: parseOptionalNumber(form.right_arm_cm, "Braço Direito"),
          left_arm_cm: parseOptionalNumber(form.left_arm_cm, "Braço Esquerdo"),
          right_thigh_cm: parseOptionalNumber(form.right_thigh_cm, "Coxa Direita"),
          left_thigh_cm: parseOptionalNumber(form.left_thigh_cm, "Coxa Esquerda"),
        };

        await medicalApi.createAnthropometryEntry(payload);
        setForm(emptyForm);
        await loadEntries();
        setNotice({ kind: "success", message: "Registro de antropometria salvo." });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        setNotice({ kind: "error", message });
      } finally {
        setSaving(false);
      }
    };

    void run();
  };

  return (
    <div className="stack-gap" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <section className="grid-two stack-gap">
        <article className="page-card stack-gap">
          <div className="split-row">
            <h3>Histórico de Antropometria</h3>
            <span className="muted-text">{entries.length} registros</span>
          </div>

          <NoticeBanner notice={notice} />

          {loading ? (
            <p className="muted-text">Carregando histórico...</p>
          ) : (
            <div className="table-wrap" style={{ maxHeight: "400px", overflowY: "auto", overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Cintura</th>
                    <th>Abdômen</th>
                    <th>Quadril</th>
                    <th>Braço Dir.</th>
                    <th>Braço Esq.</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-cell">
                        Nenhum registro de antropometria ainda.
                      </td>
                    </tr>
                  ) : (
                    sorted.map((entry) => (
                      <tr key={entry.id}>
                        <td>{formatDate(entry.date)}</td>
                        <td>{formatDecimal(entry.waist_cm)}</td>
                        <td>{formatDecimal(entry.abdomen_cm)}</td>
                        <td>{formatDecimal(entry.hips_cm)}</td>
                        <td>{formatDecimal(entry.right_arm_cm)}</td>
                        <td>{formatDecimal(entry.left_arm_cm)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="page-card stack-gap">
          <h3>Adicionar registro de antropometria</h3>
          <form className="form-grid" onSubmit={onSubmit}>
            <label>
              Data
              <input
                className="input"
                type="date"
                value={form.date}
                onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
                required
              />
            </label>

            <div className="grid-two">
              <label>
                Cintura (cm)
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={form.waist_cm}
                  onChange={(event) => setForm((current) => ({ ...current, waist_cm: event.target.value }))}
                />
              </label>
              <label>
                Abdômen (cm)
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={form.abdomen_cm}
                  onChange={(event) => setForm((current) => ({ ...current, abdomen_cm: event.target.value }))}
                />
              </label>
              <label>
                Quadril (cm)
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={form.hips_cm}
                  onChange={(event) => setForm((current) => ({ ...current, hips_cm: event.target.value }))}
                />
              </label>
              <label>
                Braço Dir. (cm)
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={form.right_arm_cm}
                  onChange={(event) => setForm((current) => ({ ...current, right_arm_cm: event.target.value }))}
                />
              </label>
              <label>
                Braço Esq. (cm)
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={form.left_arm_cm}
                  onChange={(event) => setForm((current) => ({ ...current, left_arm_cm: event.target.value }))}
                />
              </label>
              <label>
                Coxa Dir. (cm)
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={form.right_thigh_cm}
                  onChange={(event) => setForm((current) => ({ ...current, right_thigh_cm: event.target.value }))}
                />
              </label>
              <label>
                Coxa Esq. (cm)
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={form.left_thigh_cm}
                  onChange={(event) => setForm((current) => ({ ...current, left_thigh_cm: event.target.value }))}
                />
              </label>
            </div>

            <button className="button button--primary" type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar Antropometria"}
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}


