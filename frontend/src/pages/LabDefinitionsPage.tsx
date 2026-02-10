import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Edit, Trash2 } from "lucide-react";
import { medicalApi } from "../api";
import { NoticeBanner } from "../components/common/NoticeBanner";
import { Modal } from "../components/common/Modal";
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
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);

  // Create State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(emptyForm);
  const [creating, setCreating] = useState(false);

  // Edit State
  const [editingItem, setEditingItem] = useState<LabTestDefinition | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [updating, setUpdating] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
        if (!active) return;
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        setNotice({ kind: "error", message: `Não foi possível carregar definições: ${message}` });
      } finally {
        if (active) setLoading(false);
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, []);

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);

    const run = async () => {
      try {
        const payload: LabTestDefinitionCreate = {
          name: createForm.name.trim(),
          category: createForm.category.trim(),
          unit: createForm.unit.trim(),
          ref_min_male: parseOptionalNumber(createForm.ref_min_male, "Mín. Masculino"),
          ref_max_male: parseOptionalNumber(createForm.ref_max_male, "Máx. Masculino"),
          ref_min_female: parseOptionalNumber(createForm.ref_min_female, "Mín. Feminino"),
          ref_max_female: parseOptionalNumber(createForm.ref_max_female, "Máx. Feminino"),
        };

        if (!payload.name || !payload.category || !payload.unit) {
          throw new Error("Nome, categoria e unidade são obrigatórios.");
        }

        await medicalApi.createLabDefinition(payload);
        setCreateForm(emptyForm);
        setIsCreateOpen(false);
        await loadDefinitions();
        setNotice({ kind: "success", message: "Definição criada." });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        setNotice({ kind: "error", message });
      } finally {
        setCreating(false);
      }
    };

    void run();
  };

  const startEdit = (def: LabTestDefinition) => {
    setEditingItem(def);
    setEditForm({
      name: def.name,
      category: def.category,
      unit: def.unit,
      ref_min_male: def.ref_min_male?.toString() ?? "",
      ref_max_male: def.ref_max_male?.toString() ?? "",
      ref_min_female: def.ref_min_female?.toString() ?? "",
      ref_max_female: def.ref_max_female?.toString() ?? "",
    });
  };

  const handleUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingItem) return;
    setUpdating(true);

    const run = async () => {
      try {
        const payload: Partial<LabTestDefinitionCreate> = {
          name: editForm.name.trim(),
          category: editForm.category.trim(),
          unit: editForm.unit.trim(),
          ref_min_male: parseOptionalNumber(editForm.ref_min_male, "Mín. Masculino"),
          ref_max_male: parseOptionalNumber(editForm.ref_max_male, "Máx. Masculino"),
          ref_min_female: parseOptionalNumber(editForm.ref_min_female, "Mín. Feminino"),
          ref_max_female: parseOptionalNumber(editForm.ref_max_female, "Máx. Feminino"),
        };

        await medicalApi.updateLabDefinition(editingItem.id, payload);
        await loadDefinitions();
        setEditingItem(null);
        setNotice({ kind: "success", message: "Definição atualizada." });
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
    if (!window.confirm("Tem certeza que deseja excluir esta definição?")) return;
    setDeletingId(id);
    try {
      await medicalApi.deleteLabDefinition(id);
      await loadDefinitions();
      setNotice({ kind: "success", message: "Definição excluída." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      setNotice({ kind: "error", message });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="stack-gap" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <header className="split-row" style={{ paddingBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
        <div>
          <h2>Definições de Exames</h2>
          <span className="muted-text">{definitions.length} itens</span>
        </div>
        <button
          className="button button--primary"
          onClick={() => setIsCreateOpen(true)}
        >
          + Nova Definição
        </button>
      </header>

      <NoticeBanner notice={notice} />

      <div className="page-card">
        {loading ? (
          <p className="muted-text">Carregando definições...</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Categoria</th>
                  <th>Unidade</th>
                  <th>Ref. Masculino</th>
                  <th>Ref. Feminino</th>
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {definitions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-cell">
                      Nenhuma definição ainda.
                    </td>
                  </tr>
                ) : (
                  definitions.map((definition) => (
                    <tr key={definition.id}>
                      <td>{definition.name}</td>
                      <td>{definition.category}</td>
                      <td>{definition.unit}</td>
                      <td>
                        {definition.ref_min_male ?? "-"} a {definition.ref_max_male ?? "-"}
                      </td>
                      <td>
                        {definition.ref_min_female ?? "-"} a {definition.ref_max_female ?? "-"}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div className="button-row" style={{ justifyContent: "flex-end", display: "flex", gap: "0.5rem" }}>
                          <button
                            className="button button--icon"
                            onClick={() => startEdit(definition)}
                            title="Editar"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="button button--icon button--danger"
                            onClick={() => handleDelete(definition.id)}
                            disabled={deletingId === definition.id}
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
        title="Nova Definição de Exame"
      >
        <form className="form-grid" onSubmit={handleCreate}>
          <label>
            Nome do Exame
            <input
              className="input"
              value={createForm.name}
              onChange={(event) => setCreateForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
          </label>
          <label>
            Categoria
            <input
              className="input"
              value={createForm.category}
              onChange={(event) => setCreateForm((current) => ({ ...current, category: event.target.value }))}
              required
            />
          </label>
          <label>
            Unidade
            <input
              className="input"
              value={createForm.unit}
              onChange={(event) => setCreateForm((current) => ({ ...current, unit: event.target.value }))}
              required
            />
          </label>

          <div className="grid-two">
            <label>
              Mín. Masculino
              <input
                className="input"
                type="number"
                step="0.01"
                value={createForm.ref_min_male}
                onChange={(event) => setCreateForm((current) => ({ ...current, ref_min_male: event.target.value }))}
              />
            </label>
            <label>
              Máx. Masculino
              <input
                className="input"
                type="number"
                step="0.01"
                value={createForm.ref_max_male}
                onChange={(event) => setCreateForm((current) => ({ ...current, ref_max_male: event.target.value }))}
              />
            </label>
            <label>
              Mín. Feminino
              <input
                className="input"
                type="number"
                step="0.01"
                value={createForm.ref_min_female}
                onChange={(event) => setCreateForm((current) => ({ ...current, ref_min_female: event.target.value }))}
              />
            </label>
            <label>
              Máx. Feminino
              <input
                className="input"
                type="number"
                step="0.01"
                value={createForm.ref_max_female}
                onChange={(event) => setCreateForm((current) => ({ ...current, ref_max_female: event.target.value }))}
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
        title="Editar Definição de Exame"
      >
        <form className="form-grid" onSubmit={handleUpdate}>
          <label>
            Nome do Exame
            <input
              className="input"
              value={editForm.name}
              onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
          </label>
          <label>
            Categoria
            <input
              className="input"
              value={editForm.category}
              onChange={(event) => setEditForm((current) => ({ ...current, category: event.target.value }))}
              required
            />
          </label>
          <label>
            Unidade
            <input
              className="input"
              value={editForm.unit}
              onChange={(event) => setEditForm((current) => ({ ...current, unit: event.target.value }))}
              required
            />
          </label>

          <div className="grid-two">
            <label>
              Mín. Masculino
              <input
                className="input"
                type="number"
                step="0.01"
                value={editForm.ref_min_male}
                onChange={(event) => setEditForm((current) => ({ ...current, ref_min_male: event.target.value }))}
              />
            </label>
            <label>
              Máx. Masculino
              <input
                className="input"
                type="number"
                step="0.01"
                value={editForm.ref_max_male}
                onChange={(event) => setEditForm((current) => ({ ...current, ref_max_male: event.target.value }))}
              />
            </label>
            <label>
              Mín. Feminino
              <input
                className="input"
                type="number"
                step="0.01"
                value={editForm.ref_min_female}
                onChange={(event) => setEditForm((current) => ({ ...current, ref_min_female: event.target.value }))}
              />
            </label>
            <label>
              Máx. Feminino
              <input
                className="input"
                type="number"
                step="0.01"
                value={editForm.ref_max_female}
                onChange={(event) => setEditForm((current) => ({ ...current, ref_max_female: event.target.value }))}
              />
            </label>
          </div>

          <div className="split-row" style={{ marginTop: "1rem" }}>
            <button type="button" className="button button--outline" onClick={() => setEditingItem(null)}>
              Cancelar
            </button>
            <button className="button button--primary" type="submit" disabled={updating}>
              {updating ? "Salvando..." : "Atualizar"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
