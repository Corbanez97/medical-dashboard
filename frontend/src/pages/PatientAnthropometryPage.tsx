import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { Edit, Trash2 } from "lucide-react";
import { medicalApi } from "../api";
import { NoticeBanner } from "../components/common/NoticeBanner";
import { Modal } from "../components/common/Modal";
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
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);

  // Create State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(emptyForm);
  const [creating, setCreating] = useState(false);

  // Edit State
  const [editingItem, setEditingItem] = useState<AnthropometryEntry | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [updating, setUpdating] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
        if (!active) return;
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        setNotice({ kind: "error", message: `Não foi possível carregar dados de antropometria: ${message}` });
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
        const payload: AnthropometryEntryCreate = {
          patient_id: patientId,
          date: createForm.date,
          waist_cm: parseOptionalNumber(createForm.waist_cm, "Cintura"),
          abdomen_cm: parseOptionalNumber(createForm.abdomen_cm, "Abdômen"),
          hips_cm: parseOptionalNumber(createForm.hips_cm, "Quadril"),
          right_arm_cm: parseOptionalNumber(createForm.right_arm_cm, "Braço Direito"),
          left_arm_cm: parseOptionalNumber(createForm.left_arm_cm, "Braço Esquerdo"),
          right_thigh_cm: parseOptionalNumber(createForm.right_thigh_cm, "Coxa Direita"),
          left_thigh_cm: parseOptionalNumber(createForm.left_thigh_cm, "Coxa Esquerda"),
        };

        await medicalApi.createAnthropometryEntry(payload);
        setCreateForm(emptyForm);
        setIsCreateOpen(false);
        await loadEntries();
        setNotice({ kind: "success", message: "Registro de antropometria criado." });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        setNotice({ kind: "error", message });
      } finally {
        setCreating(false);
      }
    };

    void run();
  };

  const startEdit = (entry: AnthropometryEntry) => {
    setEditingItem(entry);
    setEditForm({
      date: entry.date,
      waist_cm: entry.waist_cm !== null ? String(entry.waist_cm) : "",
      abdomen_cm: entry.abdomen_cm !== null ? String(entry.abdomen_cm) : "",
      hips_cm: entry.hips_cm !== null ? String(entry.hips_cm) : "",
      right_arm_cm: entry.right_arm_cm !== null ? String(entry.right_arm_cm) : "",
      left_arm_cm: entry.left_arm_cm !== null ? String(entry.left_arm_cm) : "",
      right_thigh_cm: entry.right_thigh_cm !== null ? String(entry.right_thigh_cm) : "",
      left_thigh_cm: entry.left_thigh_cm !== null ? String(entry.left_thigh_cm) : "",
    });
  };

  const handleUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingItem) return;
    setUpdating(true);

    const run = async () => {
      try {
        const payload: Partial<AnthropometryEntryCreate> = {
          date: editForm.date,
          waist_cm: parseOptionalNumber(editForm.waist_cm, "Cintura"),
          abdomen_cm: parseOptionalNumber(editForm.abdomen_cm, "Abdômen"),
          hips_cm: parseOptionalNumber(editForm.hips_cm, "Quadril"),
          right_arm_cm: parseOptionalNumber(editForm.right_arm_cm, "Braço Direito"),
          left_arm_cm: parseOptionalNumber(editForm.left_arm_cm, "Braço Esquerdo"),
          right_thigh_cm: parseOptionalNumber(editForm.right_thigh_cm, "Coxa Direita"),
          left_thigh_cm: parseOptionalNumber(editForm.left_thigh_cm, "Coxa Esquerda"),
        };

        await medicalApi.updateAnthropometryEntry(editingItem.id, payload);
        await loadEntries();
        setEditingItem(null);
        setNotice({ kind: "success", message: "Registro altrado com sucesso." });
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
    if (!window.confirm("Tem certeza que deseja excluir este registro?")) return;
    setDeletingId(id);
    try {
      await medicalApi.deleteAnthropometryEntry(id);
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
          <h3>Histórico de Antropometria</h3>
          <p className="muted-text">Medidas corporais (circunferências).</p>
        </div>
        <button
          className="button button--primary"
          onClick={() => setIsCreateOpen(true)}
        >
          + Nova Medida
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
                  <th>Cintura</th>
                  <th>Abdômen</th>
                  <th>Quadril</th>
                  <th>Braço Dir.</th>
                  <th>Braço Esq.</th>
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-cell">
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
        title="Nova Antropometria"
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
              Cintura (cm)
              <input
                className="input"
                type="number"
                step="0.01"
                value={createForm.waist_cm}
                onChange={(event) => setCreateForm((current) => ({ ...current, waist_cm: event.target.value }))}
              />
            </label>
            <label>
              Abdômen (cm)
              <input
                className="input"
                type="number"
                step="0.01"
                value={createForm.abdomen_cm}
                onChange={(event) => setCreateForm((current) => ({ ...current, abdomen_cm: event.target.value }))}
              />
            </label>
            <label>
              Quadril (cm)
              <input
                className="input"
                type="number"
                step="0.01"
                value={createForm.hips_cm}
                onChange={(event) => setCreateForm((current) => ({ ...current, hips_cm: event.target.value }))}
              />
            </label>
            <label>
              Braço Dir. (cm)
              <input
                className="input"
                type="number"
                step="0.01"
                value={createForm.right_arm_cm}
                onChange={(event) => setCreateForm((current) => ({ ...current, right_arm_cm: event.target.value }))}
              />
            </label>
            <label>
              Braço Esq. (cm)
              <input
                className="input"
                type="number"
                step="0.01"
                value={createForm.left_arm_cm}
                onChange={(event) => setCreateForm((current) => ({ ...current, left_arm_cm: event.target.value }))}
              />
            </label>
            <label>
              Coxa Dir. (cm)
              <input
                className="input"
                type="number"
                step="0.01"
                value={createForm.right_thigh_cm}
                onChange={(event) => setCreateForm((current) => ({ ...current, right_thigh_cm: event.target.value }))}
              />
            </label>
            <label>
              Coxa Esq. (cm)
              <input
                className="input"
                type="number"
                step="0.01"
                value={createForm.left_thigh_cm}
                onChange={(event) => setCreateForm((current) => ({ ...current, left_thigh_cm: event.target.value }))}
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
        title="Editar Antropometria"
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
              Cintura (cm)
              <input
                className="input"
                type="number"
                step="0.01"
                value={editForm.waist_cm}
                onChange={(event) => setEditForm((current) => ({ ...current, waist_cm: event.target.value }))}
              />
            </label>
            <label>
              Abdômen (cm)
              <input
                className="input"
                type="number"
                step="0.01"
                value={editForm.abdomen_cm}
                onChange={(event) => setEditForm((current) => ({ ...current, abdomen_cm: event.target.value }))}
              />
            </label>
            <label>
              Quadril (cm)
              <input
                className="input"
                type="number"
                step="0.01"
                value={editForm.hips_cm}
                onChange={(event) => setEditForm((current) => ({ ...current, hips_cm: event.target.value }))}
              />
            </label>
            <label>
              Braço Dir. (cm)
              <input
                className="input"
                type="number"
                step="0.01"
                value={editForm.right_arm_cm}
                onChange={(event) => setEditForm((current) => ({ ...current, right_arm_cm: event.target.value }))}
              />
            </label>
            <label>
              Braço Esq. (cm)
              <input
                className="input"
                type="number"
                step="0.01"
                value={editForm.left_arm_cm}
                onChange={(event) => setEditForm((current) => ({ ...current, left_arm_cm: event.target.value }))}
              />
            </label>
            <label>
              Coxa Dir. (cm)
              <input
                className="input"
                type="number"
                step="0.01"
                value={editForm.right_thigh_cm}
                onChange={(event) => setEditForm((current) => ({ ...current, right_thigh_cm: event.target.value }))}
              />
            </label>
            <label>
              Coxa Esq. (cm)
              <input
                className="input"
                type="number"
                step="0.01"
                value={editForm.left_thigh_cm}
                onChange={(event) => setEditForm((current) => ({ ...current, left_thigh_cm: event.target.value }))}
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


