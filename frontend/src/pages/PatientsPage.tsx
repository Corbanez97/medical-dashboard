import { useEffect, useMemo, useState } from "react";
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

  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [action, setAction] = useState<string | null>(null);

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

  const loadPatients = async () => {
    const loaded = await medicalApi.listPatients();
    setPatients(loaded);
    if (editPatientId !== null && !loaded.some((patient) => patient.id === editPatientId)) {
      setEditPatientId(null);
      setEditForm(emptyForm);
    }
  };

  useEffect(() => {
    let active = true;

    const run = async () => {
      setLoading(true);
      try {
        const loaded = await medicalApi.listPatients();
        if (!active) {
          return;
        }
        setPatients(loaded);
      } catch (error) {
        if (!active) {
          return;
        }
        const message = error instanceof Error ? error.message : "Unknown error";
        setNotice({ kind: "error", message: `Could not load patients: ${message}` });
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
      await loadPatients();
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
        height_cm: parseRequiredNumber(editForm.height_cm, "Height"),
      };
      await medicalApi.updatePatient(editPatientId, payload);
      await loadPatients();
      closeEdit();
      setNotice({ kind: "success", message: "Patient updated successfully." });
    });
  };

  const onDeletePatient = (patient: Patient) => {
    const confirmed = window.confirm(`Delete patient ${patient.full_name}?`);
    if (!confirmed) {
      return;
    }

    void runAction("delete-patient", async () => {
      await medicalApi.deletePatient(patient.id);
      await loadPatients();
      setNotice({ kind: "success", message: "Patient deleted." });
    });
  };

  return (
    <div className="stack-gap" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <header className="split-row" style={{ paddingBottom: "1.5rem", borderBottom: "1px solid var(--border)" }}>
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Patients</h1>
          <p className="muted-text">Manage your patient records and access medical history.</p>
        </div>
        <div className="row-gap">
          <button
            className="button button--primary"
            onClick={() => setIsCreateOpen(true)}
            style={{ height: "48px", paddingLeft: "1.5rem", paddingRight: "1.5rem" }}
          >
            <span style={{ marginRight: "0.5rem", fontSize: "1.2rem" }}>+</span> New Patient
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
            placeholder="Search patients..."
            style={{ maxWidth: "320px" }}
          />
          <div className="muted-text">
            {filteredPatients.length} records
          </div>
        </div>

        {loading ? (
          <p className="muted-text">Loading...</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>ID</th>
                  <th>Age/DOB</th>
                  <th>Gender</th>
                  <th>Height</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-cell" style={{ padding: "2rem" }}>
                      No patients found.
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
                          {age !== null ? `${age} yrs` : "N/A"}{" "}
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
                              Open
                            </button>
                            <button
                              type="button"
                              className="button button--outline"
                              style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
                              onClick={() => startEdit(patient)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="button button--danger"
                              style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
                              onClick={() => onDeletePatient(patient)}
                            >
                              Delete
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
        title="Create New Patient"
      >
        <form className="form-grid" onSubmit={onCreatePatient}>
          <label>
            Full Name
            <input
              className="input"
              value={createForm.full_name}
              onChange={(event) => setCreateForm((current) => ({ ...current, full_name: event.target.value }))}
              required
              placeholder="e.g. John Doe"
            />
          </label>
          <div className="grid-two">
            <label>
              Date of Birth
              <input
                className="input"
                type="date"
                value={createForm.date_of_birth}
                onChange={(event) => setCreateForm((current) => ({ ...current, date_of_birth: event.target.value }))}
                required
              />
            </label>
            <label>
              Gender
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
            Height (cm)
            <input
              className="input"
              type="number"
              step="0.1"
              value={createForm.height_cm}
              onChange={(event) => setCreateForm((current) => ({ ...current, height_cm: event.target.value }))}
              required
              placeholder="e.g. 175"
            />
          </label>
          <div className="split-row" style={{ marginTop: "1rem" }}>
            <button type="button" className="button button--outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </button>
            <button className="button button--primary" type="submit" disabled={action === "create-patient"}>
              {action === "create-patient" ? "Creating..." : "Create Patient"}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        isOpen={editPatientId !== null}
        onClose={closeEdit}
        title="Edit Patient"
      >
        <form className="form-grid" onSubmit={onUpdatePatient}>
          <label>
            Full Name
            <input
              className="input"
              value={editForm.full_name}
              onChange={(event) => setEditForm((current) => ({ ...current, full_name: event.target.value }))}
              required
            />
          </label>
          <div className="grid-two">
            <label>
              Date of Birth
              <input
                className="input"
                type="date"
                value={editForm.date_of_birth}
                onChange={(event) => setEditForm((current) => ({ ...current, date_of_birth: event.target.value }))}
                required
              />
            </label>
            <label>
              Gender
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
            Height (cm)
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
              Cancel
            </button>
            <button className="button button--primary" type="submit" disabled={action === "update-patient"}>
              {action === "update-patient" ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}


