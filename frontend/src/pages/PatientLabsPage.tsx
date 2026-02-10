import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import { Edit, Trash2 } from "lucide-react";
import { medicalApi } from "../api";
import { NoticeBanner } from "../components/common/NoticeBanner";
import { Modal } from "../components/common/Modal";
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
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);

  // Create State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(emptyForm);
  const [creating, setCreating] = useState(false);

  // Edit State
  const [editingItem, setEditingItem] = useState<LabResult | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [updating, setUpdating] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
        await loadData();
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        setNotice({ kind: "error", message: `Não foi possível carregar dados de exames: ${message}` });
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
        const definitionId = Number.parseInt(createForm.test_definition_id, 10);
        if (Number.isNaN(definitionId)) {
          throw new Error("Selecione uma definição de exame.");
        }

        const payload: LabResultCreate = {
          patient_id: patientId,
          test_definition_id: definitionId,
          collection_date: createForm.collection_date,
          value: parseRequiredNumber(createForm.value, "Valor"),
          flag: createForm.flag.trim() || null,
        };

        await medicalApi.createLabResult(payload);
        setCreateForm(emptyForm);
        setIsCreateOpen(false);
        await loadData();
        setNotice({ kind: "success", message: "Resultado criado com sucesso." });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        setNotice({ kind: "error", message });
      } finally {
        setCreating(false);
      }
    };
    void run();
  };

  const startEdit = (item: LabResult) => {
    setEditingItem(item);
    setEditForm({
      test_definition_id: String(item.test_definition_id),
      collection_date: item.collection_date,
      value: String(item.value),
      flag: item.flag || "",
    });
  };

  const handleUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingItem) return;
    setUpdating(true);

    const run = async () => {
      try {
        const definitionId = Number.parseInt(editForm.test_definition_id, 10);
        if (Number.isNaN(definitionId)) {
          throw new Error("Selecione uma definição de exame.");
        }

        // We only send the fields that can be updated.
        // Assuming the API supports partial updates as implemented in api.ts
        const payload: Partial<LabResultCreate> = {
          test_definition_id: definitionId,
          collection_date: editForm.collection_date,
          value: parseRequiredNumber(editForm.value, "Valor"),
          flag: editForm.flag.trim() || null,
        };

        await medicalApi.updateLabResult(editingItem.id, payload);
        await loadData();
        setEditingItem(null);
        setNotice({ kind: "success", message: "Resultado atualizado com sucesso." });
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
    if (!window.confirm("Tem certeza que deseja excluir este resultado?")) return;
    setDeletingId(id);
    try {
      await medicalApi.deleteLabResult(id);
      await loadData();
      setNotice({ kind: "success", message: "Resultado excluído com sucesso." });
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
          <h3>Exames</h3>
          <p className="muted-text">Histórico de exames laboratoriais.</p>
        </div>
        <button
          className="button button--primary"
          onClick={() => setIsCreateOpen(true)}
        >
          + Novo Exame
        </button>
      </header>

      <NoticeBanner notice={notice} />

      <div className="page-card">
        {loading ? (
          <p className="muted-text">Carregando resultados...</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Exame</th>
                  <th>Valor</th>
                  <th>Alerta</th>
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-cell">
                      Nenhum resultado registrado.
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
                      <td style={{ textAlign: "right" }}>
                        <div className="button-row" style={{ justifyContent: "flex-end", display: "flex", gap: "0.5rem" }}>
                          <button
                            className="button button--icon"
                            onClick={() => startEdit(item)}
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="button button--icon button--danger"
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
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
        title="Novo Resultado de Exame"
      >
        <form className="form-grid" onSubmit={handleCreate}>
          <label>
            Exame
            <select
              className="input"
              value={createForm.test_definition_id}
              onChange={(e) => setCreateForm(prev => ({ ...prev, test_definition_id: e.target.value }))}
              required
            >
              <option value="">Selecione...</option>
              {definitions.map((def) => (
                <option key={def.id} value={def.id}>
                  {def.name} ({def.unit})
                </option>
              ))}
            </select>
          </label>

          <label>
            Data da Coleta
            <input
              className="input"
              type="date"
              value={createForm.collection_date}
              onChange={(e) => setCreateForm(prev => ({ ...prev, collection_date: e.target.value }))}
              required
            />
          </label>

          <label>
            Valor
            <input
              className="input"
              type="number"
              step="0.01"
              value={createForm.value}
              onChange={(e) => setCreateForm(prev => ({ ...prev, value: e.target.value }))}
              required
            />
          </label>

          <label>
            Alerta (Opcional)
            <input
              className="input"
              value={createForm.flag}
              onChange={(e) => setCreateForm(prev => ({ ...prev, flag: e.target.value }))}
              placeholder="Ex: alto, baixo"
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
        title="Editar Resultado"
      >
        <form className="form-grid" onSubmit={handleUpdate}>
          {/* Note: We typically don't change the test definition in edit, but we can allow it if needed. 
              Let's allow it for flexibility. */}
          <label>
            Exame
            <select
              className="input"
              value={editForm.test_definition_id}
              onChange={(e) => setEditForm(prev => ({ ...prev, test_definition_id: e.target.value }))}
              required
            >
              <option value="">Selecione...</option>
              {definitions.map((def) => (
                <option key={def.id} value={def.id}>
                  {def.name} ({def.unit})
                </option>
              ))}
            </select>
          </label>

          <label>
            Data da Coleta
            <input
              className="input"
              type="date"
              value={editForm.collection_date}
              onChange={(e) => setEditForm(prev => ({ ...prev, collection_date: e.target.value }))}
              required
            />
          </label>

          <label>
            Valor
            <input
              className="input"
              type="number"
              step="0.01"
              value={editForm.value}
              onChange={(e) => setEditForm(prev => ({ ...prev, value: e.target.value }))}
              required
            />
          </label>

          <label>
            Alerta (Opcional)
            <input
              className="input"
              value={editForm.flag}
              onChange={(e) => setEditForm(prev => ({ ...prev, flag: e.target.value }))}
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


