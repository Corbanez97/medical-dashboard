import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { medicalApi } from "../api";
import { NoticeBanner } from "../components/common/NoticeBanner";
import { formatDate, formatDecimal, parseOptionalInt, parseOptionalNumber, parseRequiredNumber, toTodayInput } from "../helpers";
import type { Notice } from "../helpers";
import type { BioimpedanceEntry, BioimpedanceEntryCreate } from "../types";
import type { PatientRouteContext } from "./PatientRouteLayout";

type FormState = {
  date: string;
  weight_kg: string;
  bmi: string;
  body_fat_percent: string;
  fat_mass_kg: string;
  muscle_mass_kg: string;
  visceral_fat_level: string;
  basal_metabolic_rate_kcal: string;
  hydration_percent: string;
};

const emptyForm: FormState = {
  date: toTodayInput(),
  weight_kg: "",
  bmi: "",
  body_fat_percent: "",
  fat_mass_kg: "",
  muscle_mass_kg: "",
  visceral_fat_level: "",
  basal_metabolic_rate_kcal: "",
  hydration_percent: "",
};

export function PatientBioimpedancePage() {
  const { patientId } = useOutletContext<PatientRouteContext>();

  const [entries, setEntries] = useState<BioimpedanceEntry[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const sorted = useMemo(() => {
    return [...entries].sort((left, right) => right.date.localeCompare(left.date));
  }, [entries]);

  const loadEntries = async () => {
    const loaded = await medicalApi.listPatientBioimpedance(patientId);
    setEntries(loaded);
  };

  useEffect(() => {
    let active = true;

    const run = async () => {
      setLoading(true);
      setNotice(null);
      try {
        const loaded = await medicalApi.listPatientBioimpedance(patientId);
        if (active) {
          setEntries(loaded);
        }
      } catch (error) {
        if (!active) {
          return;
        }
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        setNotice({ kind: "error", message: `Não foi possível carregar dados de bioimpedância: ${message}` });
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
        const payload: BioimpedanceEntryCreate = {
          patient_id: patientId,
          date: form.date,
          weight_kg: parseRequiredNumber(form.weight_kg, "Peso"),
          bmi: parseRequiredNumber(form.bmi, "IMC"),
          body_fat_percent: parseRequiredNumber(form.body_fat_percent, "Gordura Corporal"),
          fat_mass_kg: parseRequiredNumber(form.fat_mass_kg, "Massa Gorda"),
          muscle_mass_kg: parseRequiredNumber(form.muscle_mass_kg, "Massa Muscular"),
          visceral_fat_level: parseOptionalNumber(form.visceral_fat_level, "Gordura Visceral"),
          basal_metabolic_rate_kcal: parseOptionalInt(form.basal_metabolic_rate_kcal, "TMB"),
          hydration_percent: parseOptionalNumber(form.hydration_percent, "Hidratação"),
        };

        await medicalApi.createBioimpedanceEntry(payload);
        setForm(emptyForm);
        await loadEntries();
        setNotice({ kind: "success", message: "Registro de bioimpedância salvo." });
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
            <h3>Histórico de Bioimpedância</h3>
            <span className="muted-text">{entries.length} registros</span>
          </div>

          <NoticeBanner notice={notice} />

          {loading ? (
            <p className="muted-text">Carregando histórico...</p>
          ) : (
            <div className="table-wrap" style={{ maxHeight: "400px", overflowY: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Peso</th>
                    <th>IMC</th>
                    <th>% Gordura</th>
                    <th>Massa Muscular</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="empty-cell">
                        Sem dados de bioimpedância ainda.
                      </td>
                    </tr>
                  ) : (
                    sorted.map((entry) => (
                      <tr key={entry.id}>
                        <td>{formatDate(entry.date)}</td>
                        <td>{formatDecimal(entry.weight_kg)} kg</td>
                        <td>{formatDecimal(entry.bmi)}</td>
                        <td>{formatDecimal(entry.body_fat_percent)}</td>
                        <td>{formatDecimal(entry.muscle_mass_kg)} kg</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="page-card stack-gap">
          <h3>Adicionar registro de bioimpedância</h3>
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
                Peso (kg)
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={form.weight_kg}
                  onChange={(event) => setForm((current) => ({ ...current, weight_kg: event.target.value }))}
                  required
                />
              </label>
              <label>
                IMC
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={form.bmi}
                  onChange={(event) => setForm((current) => ({ ...current, bmi: event.target.value }))}
                  required
                />
              </label>
              <label>
                Gordura Corporal (%)
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={form.body_fat_percent}
                  onChange={(event) => setForm((current) => ({ ...current, body_fat_percent: event.target.value }))}
                  required
                />
              </label>
              <label>
                Massa Gorda (kg)
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={form.fat_mass_kg}
                  onChange={(event) => setForm((current) => ({ ...current, fat_mass_kg: event.target.value }))}
                  required
                />
              </label>
              <label>
                Massa Muscular (kg)
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={form.muscle_mass_kg}
                  onChange={(event) => setForm((current) => ({ ...current, muscle_mass_kg: event.target.value }))}
                  required
                />
              </label>
              <label>
                Gordura Visceral
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={form.visceral_fat_level}
                  onChange={(event) => setForm((current) => ({ ...current, visceral_fat_level: event.target.value }))}
                />
              </label>
              <label>
                TMB (kcal)
                <input
                  className="input"
                  type="number"
                  step="1"
                  value={form.basal_metabolic_rate_kcal}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, basal_metabolic_rate_kcal: event.target.value }))
                  }
                />
              </label>
              <label>
                Hidratação (%)
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={form.hydration_percent}
                  onChange={(event) => setForm((current) => ({ ...current, hydration_percent: event.target.value }))}
                />
              </label>
            </div>

            <button className="button button--primary" type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar Bioimpedância"}
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}


