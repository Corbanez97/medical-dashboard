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
  const [editingId, setEditingId] = useState<number | null>(null); // New state for editing
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
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        setNotice({ kind: "error", message: `Não foi possível carregar definições: ${message}` });
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

  const startEdit = (def: LabTestDefinition) => {
    setEditingId(def.id);
    setForm({
      name: def.name,
      category: def.category,
      unit: def.unit,
      ref_min_male: def.ref_min_male?.toString() ?? "",
      ref_max_male: def.ref_max_male?.toString() ?? "",
      ref_min_female: def.ref_min_female?.toString() ?? "",
      ref_max_female: def.ref_max_female?.toString() ?? "",
    });
    // Scroll to form (optional UX improvement)
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const run = async () => {
      setSaving(true);
      try {
        const payload: LabTestDefinitionCreate = {
          name: form.name.trim(),
          category: form.category.trim(),
          unit: form.unit.trim(),
          ref_min_male: parseOptionalNumber(form.ref_min_male, "Mín. Masculino"),
          ref_max_male: parseOptionalNumber(form.ref_max_male, "Máx. Masculino"),
          ref_min_female: parseOptionalNumber(form.ref_min_female, "Mín. Feminino"),
          ref_max_female: parseOptionalNumber(form.ref_max_female, "Máx. Feminino"),
        };

        if (!payload.name || !payload.category || !payload.unit) {
          throw new Error("Nome, categoria e unidade são obrigatórios.");
        }

        if (editingId !== null) {
          await medicalApi.updateLabDefinition(editingId, payload);
          setNotice({ kind: "success", message: "Definição atualizada." });
        } else {
          await medicalApi.createLabDefinition(payload);
          setNotice({ kind: "success", message: "Definição criada." });
        }

        setForm(emptyForm);
        setEditingId(null);
        await loadDefinitions();
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
            <h2>Definições de Exames</h2>
            <span className="muted-text">{definitions.length} itens</span>
          </div>

          <NoticeBanner notice={notice} />

          {loading ? (
            <p className="muted-text">Carregando definições...</p>
          ) : (
            <div className="table-wrap" style={{ maxHeight: "400px", overflowY: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Categoria</th>
                    <th>Unidade</th>
                    <th>Ref. Masculino</th>
                    <th>Ref. Feminino</th>
                    <th>Ação</th>
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
                        <td>
                          <button
                            className="button button--outline"
                            style={{ padding: "0.25rem 0.75rem", fontSize: "0.8rem" }}
                            onClick={() => startEdit(definition)}
                          >
                            Editar
                          </button>
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
          <div className="split-row">
            <h2>{editingId ? "Editar Definição" : "Criar Definição"}</h2>
            {editingId && (
              <button className="button button--outline" onClick={cancelEdit}>Cancelar Edição</button>
            )}
          </div>
          <form className="form-grid" onSubmit={onSubmit}>
            <label>
              Nome do Exame
              <input
                className="input"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </label>
            <label>
              Categoria
              <input
                className="input"
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                required
              />
            </label>
            <label>
              Unidade
              <input
                className="input"
                value={form.unit}
                onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))}
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
                  value={form.ref_min_male}
                  onChange={(event) => setForm((current) => ({ ...current, ref_min_male: event.target.value }))}
                />
              </label>
              <label>
                Máx. Masculino
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={form.ref_max_male}
                  onChange={(event) => setForm((current) => ({ ...current, ref_max_male: event.target.value }))}
                />
              </label>
              <label>
                Mín. Feminino
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={form.ref_min_female}
                  onChange={(event) => setForm((current) => ({ ...current, ref_min_female: event.target.value }))}
                />
              </label>
              <label>
                Máx. Feminino
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
              {saving ? "Salvando..." : (editingId ? "Atualizar Definição" : "Criar Definição")}
            </button>
          </form>
        </article>
      </section>
    </div>
  );
}


