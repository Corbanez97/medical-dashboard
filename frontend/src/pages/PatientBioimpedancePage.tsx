import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { Edit, Trash2 } from "lucide-react";
import { medicalApi } from "../api";
import { NoticeBanner } from "../components/common/NoticeBanner";
import { Modal } from "../components/common/Modal";
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
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);

  // Create State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(emptyForm);
  const [creating, setCreating] = useState(false);

  // Edit State
  const [editingItem, setEditingItem] = useState<BioimpedanceEntry | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [updating, setUpdating] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
        if (!active) return;
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        setNotice({ kind: "error", message: `Não foi possível carregar dados de bioimpedância: ${message}` });
      } finally {
        if (active) setLoading(false);
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [patientId]);

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);

    const run = async () => {
      try {
        const payload: BioimpedanceEntryCreate = {
          patient_id: patientId,
          date: createForm.date,
          weight_kg: parseRequiredNumber(createForm.weight_kg, "Peso"),
          bmi: parseRequiredNumber(createForm.bmi, "IMC"),
          body_fat_percent: parseRequiredNumber(createForm.body_fat_percent, "Gordura Corporal"),
          fat_mass_kg: parseRequiredNumber(createForm.fat_mass_kg, "Massa Gorda"),
          muscle_mass_kg: parseRequiredNumber(createForm.muscle_mass_kg, "Massa Muscular"),
          visceral_fat_level: parseOptionalNumber(createForm.visceral_fat_level, "Gordura Visceral"),
          basal_metabolic_rate_kcal: parseOptionalInt(createForm.basal_metabolic_rate_kcal, "TMB"),
          hydration_percent: parseOptionalNumber(createForm.hydration_percent, "Hidratação"),
        };

        await medicalApi.createBioimpedanceEntry(payload);
        setCreateForm(emptyForm);
        setIsCreateOpen(false);
        await loadEntries();
        setNotice({ kind: "success", message: "Registro de bioimpedância criado." });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        setNotice({ kind: "error", message });
      } finally {
        setCreating(false);
      }
    };

    void run();
  };

  const startEdit = (entry: BioimpedanceEntry) => {
    setEditingItem(entry);
    setEditForm({
      date: entry.date,
      weight_kg: String(entry.weight_kg),
      bmi: String(entry.bmi),
      body_fat_percent: String(entry.body_fat_percent),
      fat_mass_kg: String(entry.fat_mass_kg),
      muscle_mass_kg: String(entry.muscle_mass_kg),
      visceral_fat_level: entry.visceral_fat_level !== null ? String(entry.visceral_fat_level) : "",
      basal_metabolic_rate_kcal: entry.basal_metabolic_rate_kcal !== null ? String(entry.basal_metabolic_rate_kcal) : "",
      hydration_percent: entry.hydration_percent !== null ? String(entry.hydration_percent) : "",
    });
  };

  const handleUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingItem) return;
    setUpdating(true);

    const run = async () => {
      try {
        const payload: Partial<BioimpedanceEntryCreate> = {
          date: editForm.date,
          weight_kg: parseRequiredNumber(editForm.weight_kg, "Peso"),
          bmi: parseRequiredNumber(editForm.bmi, "IMC"),
          body_fat_percent: parseRequiredNumber(editForm.body_fat_percent, "Gordura Corporal"),
          fat_mass_kg: parseRequiredNumber(editForm.fat_mass_kg, "Massa Gorda"),
          muscle_mass_kg: parseRequiredNumber(editForm.muscle_mass_kg, "Massa Muscular"),
          visceral_fat_level: parseOptionalNumber(editForm.visceral_fat_level, "Gordura Visceral"),
          basal_metabolic_rate_kcal: parseOptionalInt(editForm.basal_metabolic_rate_kcal, "TBM"),
          hydration_percent: parseOptionalNumber(editForm.hydration_percent, "Hidratação"),
        };

        await medicalApi.updateBioimpedanceEntry(editingItem.id, payload);
        await loadEntries();
        setEditingItem(null);
        setNotice({ kind: "success", message: "Registro alterado com sucesso." });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        setNotice({ kind: "error", message });
      } finally {
        setUpdating(false);
      }
    }
    void run();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este registro de bioimpedância?")) return;
    setDeletingId(id);
    try {
      await medicalApi.deleteBioimpedanceEntry(id);
      await loadEntries();
      setNotice({ kind: "success", message: "Registro excluído com sucesso." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      setNotice({ kind: "error", message });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="stack-gap">
      <header className="split-row" style={{ paddingBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
        <div>
          <h3>Histórico de Bioimpedância</h3>
          <p className="muted-text">Acompanhamento da composição corporal.</p>
        </div>
        <button
          className="button button--primary"
          onClick={() => setIsCreateOpen(true)}
        >
          + Nova Bioimpedância
        </button>
      </header>

      <NoticeBanner notice={notice} />

      <div className="page-card">
        {loading ? (
          <p className="muted-text">Carregando histórico...</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Peso</th>
                  <th>IMC</th>
                  <th>% Gordura</th>
                  <th>Massa Muscular</th>
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-cell">
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
                      <td style={{ textAlign: "right" }}>
                        <div className="button-row" style={{ justifyContent: "flex-end", display: "flex", gap: "0.5rem" }}>
                          <button
                            className="button button--icon"
                            onClick={() => startEdit(entry)}
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="button button--icon button--danger"
                            onClick={() => handleDelete(entry.id)}
                            disabled={deletingId === entry.id}
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nova Bioimpedância"
      >
        <form className="form-grid" onSubmit={handleCreate}>
          <label>
            Data
            <input
              className="input"
              type="date"
              value={createForm.date}
              onChange={(event) => setCreateForm((current) => ({ ...current, date: event.target.value }))}
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
                value={createForm.weight_kg}
                onChange={(event) => setCreateForm((current) => ({ ...current, weight_kg: event.target.value }))}
                required
              />
            </label>
            <label>
              IMC
              <input
                className="input"
                type="number"
                step="0.01"
                value={createForm.bmi}
                onChange={(event) => setCreateForm((current) => ({ ...current, bmi: event.target.value }))}
                required
              />
            </label>
            <label>
              Gordura Corporal (%)
              <input
                className="input"
                type="number"
                step="0.01"
                value={createForm.body_fat_percent}
                onChange={(event) => setCreateForm((current) => ({ ...current, body_fat_percent: event.target.value }))}
                required
              />
            </label>
            <label>
              Massa Gorda (kg)
              <input
                className="input"
                type="number"
                step="0.01"
                value={createForm.fat_mass_kg}
                onChange={(event) => setCreateForm((current) => ({ ...current, fat_mass_kg: event.target.value }))}
                required
              />
            </label>
            <label>
              Massa Muscular (kg)
              <input
                className="input"
                type="number"
                step="0.01"
                value={createForm.muscle_mass_kg}
                onChange={(event) => setCreateForm((current) => ({ ...current, muscle_mass_kg: event.target.value }))}
                required
              />
            </label>
            <label>
              Gordura Visceral
              <input
                className="input"
                type="number"
                step="0.01"
                value={createForm.visceral_fat_level}
                onChange={(event) => setCreateForm((current) => ({ ...current, visceral_fat_level: event.target.value }))}
              />
            </label>
            <label>
              TMB (kcal)
              <input
                className="input"
                type="number"
                step="1"
                value={createForm.basal_metabolic_rate_kcal}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, basal_metabolic_rate_kcal: event.target.value }))
                }
              />
            </label>
            <label>
              Hidratação (%)
              <input
                className="input"
                type="number"
                step="0.01"
                value={createForm.hydration_percent}
                onChange={(event) => setCreateForm((current) => ({ ...current, hydration_percent: event.target.value }))}
              />
            </label>
          </div>

          <div className="split-row" style={{ marginTop: "1rem" }}>
            <button type="button" className="button button--outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </button>
            <button className="button button--primary" type="submit" disabled={creating}>
              {creating ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title="Editar Bioimpedância"
      >
        <form className="form-grid" onSubmit={handleUpdate}>
          <label>
            Data
            <input
              className="input"
              type="date"
              value={editForm.date}
              onChange={(event) => setEditForm((current) => ({ ...current, date: event.target.value }))}
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
                value={editForm.weight_kg}
                onChange={(event) => setEditForm((current) => ({ ...current, weight_kg: event.target.value }))}
                required
              />
            </label>
            <label>
              IMC
              <input
                className="input"
                type="number"
                step="0.01"
                value={editForm.bmi}
                onChange={(event) => setEditForm((current) => ({ ...current, bmi: event.target.value }))}
                required
              />
            </label>
            <label>
              Gordura Corporal (%)
              <input
                className="input"
                type="number"
                step="0.01"
                value={editForm.body_fat_percent}
                onChange={(event) => setEditForm((current) => ({ ...current, body_fat_percent: event.target.value }))}
                required
              />
            </label>
            <label>
              Massa Gorda (kg)
              <input
                className="input"
                type="number"
                step="0.01"
                value={editForm.fat_mass_kg}
                onChange={(event) => setEditForm((current) => ({ ...current, fat_mass_kg: event.target.value }))}
                required
              />
            </label>
            <label>
              Massa Muscular (kg)
              <input
                className="input"
                type="number"
                step="0.01"
                value={editForm.muscle_mass_kg}
                onChange={(event) => setEditForm((current) => ({ ...current, muscle_mass_kg: event.target.value }))}
                required
              />
            </label>
            <label>
              Gordura Visceral
              <input
                className="input"
                type="number"
                step="0.01"
                value={editForm.visceral_fat_level}
                onChange={(event) => setEditForm((current) => ({ ...current, visceral_fat_level: event.target.value }))}
              />
            </label>
            <label>
              TMB (kcal)
              <input
                className="input"
                type="number"
                step="1"
                value={editForm.basal_metabolic_rate_kcal}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, basal_metabolic_rate_kcal: event.target.value }))
                }
              />
            </label>
            <label>
              Hidratação (%)
              <input
                className="input"
                type="number"
                step="0.01"
                value={editForm.hydration_percent}
                onChange={(event) => setEditForm((current) => ({ ...current, hydration_percent: event.target.value }))}
              />
            </label>
          </div>

          <div className="split-row" style={{ marginTop: "1rem" }}>
            <button type="button" className="button button--outline" onClick={() => setEditingItem(null)}>
              Cancelar
            </button>
            <button className="button button--primary" type="submit" disabled={updating}>
              {updating ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


