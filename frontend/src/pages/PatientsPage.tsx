import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { medicalApi } from "../api";
import { NoticeBanner } from "../components/common/NoticeBanner";
import { Modal } from "../components/common/Modal";
import { parseRequiredNumber, calculateAge } from "../helpers";
import type { Notice } from "../helpers";
import type { Patient, PatientCreate, PatientUpdate } from "../types";

type PatientFormState = {
  full_name: string;
  date_of_birth: string;
  gender: string;
  height_cm: string;
};

const emptyForm: PatientFormState = {
  full_name: "",
  date_of_birth: "",
  gender: "Feminino",
  height_cm: "",
};

export function PatientsPage() {
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [action, setAction] = useState<string | null>(null);

  const { data: patients = [], isLoading: loading, error } = useQuery({
    queryKey: ["patients"],
    queryFn: () => medicalApi.listPatients(),
  });

  // Effect to handle query errors if needed, or render error in UI
  if (error && !notice) {
    // Ideally we'd set notice here, but setting state during render is bad.
    // We can handle error display in the UI directly or via a useEffect if we must use the banner.
  }

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<PatientFormState>(emptyForm);

  const [editPatientId, setEditPatientId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<PatientFormState>(emptyForm);

  const filteredPatients = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return patients;
    }
    return patients.filter((patient) => patient.full_name.toLowerCase().includes(normalized));
  }, [patients, search]);





  const startEdit = (patient: Patient) => {
    setEditPatientId(patient.id);
    setEditForm({
      full_name: patient.full_name,
      date_of_birth: patient.date_of_birth,
      gender: patient.gender,
      height_cm: String(patient.height_cm),
    });
  };

  const closeEdit = () => {
    setEditPatientId(null);
    setEditForm(emptyForm);
  };

  const runAction = async (name: string, work: () => Promise<void>) => {
    setAction(name);
    try {
      await work();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setNotice({ kind: "error", message });
    } finally {
      setAction(null);
    }
  };

  const onCreatePatient = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runAction("create-patient", async () => {
      const payload: PatientCreate = {
        full_name: createForm.full_name.trim(),
        date_of_birth: createForm.date_of_birth,
        gender: createForm.gender,
        height_cm: parseRequiredNumber(createForm.height_cm, "Height"),
      };
      if (!payload.full_name || !payload.date_of_birth) {
        throw new Error("Name and date of birth are required.");
      }

      await medicalApi.createPatient(payload);
      setCreateForm(emptyForm);
      setIsCreateOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["patients"] });
      setNotice({ kind: "success", message: "Patient created successfully." });
    });
  };

  const onUpdatePatient = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editPatientId === null) {
      return;
    }

    void runAction("update-patient", async () => {
      const payload: PatientUpdate = {
        full_name: editForm.full_name.trim(),
        date_of_birth: editForm.date_of_birth,
        gender: editForm.gender,
        height_cm: parseRequiredNumber(editForm.height_cm, "Altura"),
      };
      await medicalApi.updatePatient(editPatientId, payload);
      await queryClient.invalidateQueries({ queryKey: ["patients"] });
      closeEdit();
      setNotice({ kind: "success", message: "Paciente atualizado com sucesso." });
    });
  };

  const onDeletePatient = (patient: Patient) => {
    const confirmed = window.confirm(`Tem certeza que deseja excluir o paciente ${patient.full_name}?`);
    if (!confirmed) {
      return;
    }

    void runAction("delete-patient", async () => {
      await medicalApi.deletePatient(patient.id);
      await queryClient.invalidateQueries({ queryKey: ["patients"] });
      setNotice({ kind: "success", message: "Paciente excluído." });
    });
  };

  return (
    <div className="stack-gap" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <header className="split-row" style={{ paddingBottom: "1.5rem", borderBottom: "1px solid var(--border)" }}>
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Pacientes</h1>
          <p className="muted-text">Gerencie os registros de seus pacientes e acesse o histórico médico.</p>
        </div>
        <div className="row-gap">
          <button
            className="button button--primary"
            onClick={() => setIsCreateOpen(true)}
            style={{ height: "48px", paddingLeft: "1.5rem", paddingRight: "1.5rem" }}
          >
            <span style={{ marginRight: "0.5rem", fontSize: "1.2rem" }}>+</span> Novo Paciente
          </button>
        </div>
      </header>

      <NoticeBanner notice={notice} />

      <div className="page-card stack-gap">
        <div className="split-row">
          <input
            className="input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar pacientes..."
            style={{ maxWidth: "320px" }}
          />
          <div className="muted-text">
            {filteredPatients.length} registros
          </div>
        </div>

        {loading ? (
          <p className="muted-text">Carregando...</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>ID</th>
                  <th>Idade/Data de Nasc.</th>
                  <th>Gênero</th>
                  <th>Altura</th>
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-cell" style={{ padding: "2rem" }}>
                      Nenhum paciente encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient) => {
                    const age = calculateAge(patient.date_of_birth);
                    return (
                      <tr key={patient.id}>
                        <td>
                          <strong>{patient.full_name}</strong>
                        </td>
                        <td className="muted-text">#{patient.id}</td>
                        <td>
                          {age !== null ? `${age} anos` : "N/A"}{" "}
                          <span className="muted-text" style={{ fontSize: "0.8em" }}>
                            ({patient.date_of_birth})
                          </span>
                        </td>
                        <td>{patient.gender}</td>
                        <td>{patient.height_cm} cm</td>
                        <td style={{ textAlign: "right" }}>
                          <div className="button-row" style={{ justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              className="button button--outline"
                              style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
                              onClick={() => navigate(`/patients/${patient.id}/dashboard`)}
                            >
                              Abrir
                            </button>
                            <button
                              type="button"
                              className="button button--outline"
                              style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
                              onClick={() => startEdit(patient)}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="button button--danger"
                              style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
                              onClick={() => onDeletePatient(patient)}
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
        title="Criar Novo Paciente"
      >
        <form className="form-grid" onSubmit={onCreatePatient}>
          <label>
            Nome Completo
            <input
              className="input"
              value={createForm.full_name}
              onChange={(event) => setCreateForm((current) => ({ ...current, full_name: event.target.value }))}
              required
              placeholder="Ex: João Silva"
            />
          </label>
          <div className="grid-two">
            <label>
              Data de Nascimento
              <input
                className="input"
                type="date"
                value={createForm.date_of_birth}
                onChange={(event) => setCreateForm((current) => ({ ...current, date_of_birth: event.target.value }))}
                required
              />
            </label>
            <label>
              Gênero
              <select
                className="input"
                value={createForm.gender}
                onChange={(event) => setCreateForm((current) => ({ ...current, gender: event.target.value }))}
              >
                <option value="Feminino">Feminino</option>
                <option value="Masculino">Masculino</option>
                <option value="Outro">Outro</option>
              </select>
            </label>
          </div>
          <label>
            Altura (cm)
            <input
              className="input"
              type="number"
              step="0.1"
              value={createForm.height_cm}
              onChange={(event) => setCreateForm((current) => ({ ...current, height_cm: event.target.value }))}
              required
              placeholder="Ex: 175"
            />
          </label>
          <div className="split-row" style={{ marginTop: "1rem" }}>
            <button type="button" className="button button--outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </button>
            <button className="button button--primary" type="submit" disabled={action === "create-patient"}>
              {action === "create-patient" ? "Criando..." : "Criar Paciente"}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={editPatientId !== null}
        onClose={closeEdit}
        title="Editar Paciente"
      >
        <form className="form-grid" onSubmit={onUpdatePatient}>
          <label>
            Nome Completo
            <input
              className="input"
              value={editForm.full_name}
              onChange={(event) => setEditForm((current) => ({ ...current, full_name: event.target.value }))}
              required
            />
          </label>
          <div className="grid-two">
            <label>
              Data de Nascimento
              <input
                className="input"
                type="date"
                value={editForm.date_of_birth}
                onChange={(event) => setEditForm((current) => ({ ...current, date_of_birth: event.target.value }))}
                required
              />
            </label>
            <label>
              Gênero
              <select
                className="input"
                value={editForm.gender}
                onChange={(event) => setEditForm((current) => ({ ...current, gender: event.target.value }))}
              >
                <option value="Feminino">Feminino</option>
                <option value="Masculino">Masculino</option>
                <option value="Outro">Outro</option>
              </select>
            </label>
          </div>
          <label>
            Altura (cm)
            <input
              className="input"
              type="number"
              step="0.1"
              value={editForm.height_cm}
              onChange={(event) => setEditForm((current) => ({ ...current, height_cm: event.target.value }))}
              required
            />
          </label>
          <div className="split-row" style={{ marginTop: "1rem" }}>
            <button type="button" className="button button--outline" onClick={closeEdit}>
              Cancelar
            </button>
            <button className="button button--primary" type="submit" disabled={action === "update-patient"}>
              {action === "update-patient" ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


