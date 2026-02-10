import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { Edit, Trash2 } from "lucide-react";
import { medicalApi } from "../api";
import { NoticeBanner } from "../components/common/NoticeBanner";
import { Modal } from "../components/common/Modal";
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
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);

  // Create State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(emptyForm);
  const [creating, setCreating] = useState(false);

  // Edit State
  const [editingItem, setEditingItem] = useState<SubjectiveEntry | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [updating, setUpdating] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
        if (!active) return;
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        setNotice({ kind: "error", message: `Não foi possível carregar dados subjetivos: ${message}` });
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
        const score = Number.parseInt(createForm.score, 10);
        if (Number.isNaN(score) || score < 0 || score > 10) {
          throw new Error("A nota deve ser entre 0 e 10.");
        }

        const payload: SubjectiveEntryCreate = {
          patient_id: patientId,
          date: createForm.date,
          metric_name: createForm.metric_name.trim(),
          score,
          notes: createForm.notes.trim() || null,
        };

        if (!payload.metric_name) {
          throw new Error("Nome da métrica é obrigatório.");
        }

        await medicalApi.createSubjectiveEntry(payload);
        setCreateForm(emptyForm);
        setIsCreateOpen(false);
        await loadEntries();
        setNotice({ kind: "success", message: "Registro subjetivo criado." });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        setNotice({ kind: "error", message });
      } finally {
        setCreating(false);
      }
    };

    void run();
  };

  const startEdit = (entry: SubjectiveEntry) => {
    setEditingItem(entry);
    setEditForm({
      date: entry.date,
      metric_name: entry.metric_name,
      score: String(entry.score),
      notes: entry.notes || "",
    });
  };

  const handleUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingItem) return;
    setUpdating(true);

    const run = async () => {
      try {
        const score = Number.parseInt(editForm.score, 10);
        if (Number.isNaN(score) || score < 0 || score > 10) {
          throw new Error("A nota deve ser entre 0 e 10.");
        }

        const payload: Partial<SubjectiveEntryCreate> = {
          patient_id: editingItem.patient_id,
          date: editForm.date,
          metric_name: editForm.metric_name.trim(),
          score,
          notes: editForm.notes.trim() || null,
        };

        await medicalApi.updateSubjectiveEntry(editingItem.id, payload);
        await loadEntries();
        setEditingItem(null);
        setNotice({ kind: "success", message: "Registro atualizado." });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        setNotice({ kind: "error", message });
      } finally {
        setUpdating(false);
      }
    };
    void run();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este registro?")) return;
    setDeletingId(id);
    try {
      await medicalApi.deleteSubjectiveEntry(id);
      await loadEntries();
      setNotice({ kind: "success", message: "Registro excluído." });
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
          <h3>Histórico Subjetivo</h3>
          <p className="muted-text">Acompanhamento de métricas subjetivas (sono, energia, etc.).</p>
        </div>
        <button
          className="button button--primary"
          onClick={() => setIsCreateOpen(true)}
        >
          + Novo Registro
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
                  <th>Métrica</th>
                  <th>Nota</th>
                  <th>Notas</th>
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-cell">
                      Nenhum registro subjetivo ainda.
                    </td>
                  </tr>
                ) : (
                  sorted.map((entry) => (
                    <tr key={entry.id}>
                      <td>{formatDate(entry.date)}</td>
                      <td>{entry.metric_name}</td>
                      <td>{entry.score}</td>
                      <td>{entry.notes ?? "-"}</td>
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
        title="Novo Registro Subjetivo"
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

          <label>
            Métrica
            <select
              className="input"
              value={createForm.metric_name}
              onChange={(event) => setCreateForm((current) => ({ ...current, metric_name: event.target.value }))}
            >
              <option value="Sono">Sono</option>
              <option value="Energia">Energia</option>
              <option value="Libido">Libido</option>
              <option value="Fome">Fome</option>
              <option value="Humor">Humor</option>
              {/* Add more metrics as needed or allow free text if desired */}
            </select>
          </label>

          <label>
            Nota (0-10)
            <input
              className="input"
              type="number"
              min="0"
              max="10"
              step="1"
              value={createForm.score}
              onChange={(event) => setCreateForm((current) => ({ ...current, score: event.target.value }))}
              required
            />
          </label>

          <label>
            Notas
            <textarea
              className="input input--textarea"
              value={createForm.notes}
              onChange={(event) => setCreateForm((current) => ({ ...current, notes: event.target.value }))}
            />
          </label>

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
        title="Editar Registro Subjetivo"
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

          <label>
            Métrica
            <select
              className="input"
              value={editForm.metric_name}
              onChange={(event) => setEditForm((current) => ({ ...current, metric_name: event.target.value }))}
            >
              <option value="Sono">Sono</option>
              <option value="Energia">Energia</option>
              <option value="Libido">Libido</option>
              <option value="Fome">Fome</option>
              <option value="Humor">Humor</option>
            </select>
          </label>

          <label>
            Nota (0-10)
            <input
              className="input"
              type="number"
              min="0"
              max="10"
              step="1"
              value={editForm.score}
              onChange={(event) => setEditForm((current) => ({ ...current, score: event.target.value }))}
              required
            />
          </label>

          <label>
            Notas
            <textarea
              className="input input--textarea"
              value={editForm.notes}
              onChange={(event) => setEditForm((current) => ({ ...current, notes: event.target.value }))}
            />
          </label>

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
