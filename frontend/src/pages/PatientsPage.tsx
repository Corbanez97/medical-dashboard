import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { medicalApi } from "../api";
import { NoticeBanner } from "../components/common/NoticeBanner";
import { parseRequiredNumber } from "../helpers";
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
      await loadPatients();
      setNotice({ kind: "success", message: "Patient created." });
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
      setNotice({ kind: "success", message: "Patient updated." });
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
    <section className="grid-two stack-gap">
      <article className="page-card stack-gap">
        <div className="split-row">
          <h2>Patients</h2>
          <span className="muted-text">{patients.length} total</span>
        </div>

        <NoticeBanner notice={notice} />

        <input
          className="input"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name"
        />

        {loading ? (
          <p className="muted-text">Loading list...</p>
        ) : (
          <div className="stack-gap">
            {filteredPatients.length === 0 ? (
              <p className="muted-text">No patients found.</p>
            ) : (
              filteredPatients.map((patient) => (
                <div key={patient.id} className="list-item">
                  <div>
                    <strong>{patient.full_name}</strong>
                    <p className="muted-text">
                      ID {patient.id} | DOB {patient.date_of_birth} | {patient.gender}
                    </p>
                  </div>
                  <div className="button-row">
                    <button
                      type="button"
                      className="button button--outline"
                      onClick={() => navigate(`/patients/${patient.id}/dashboard`)}
                    >
                      Open
                    </button>
                    <button type="button" className="button button--outline" onClick={() => startEdit(patient)}>
                      Edit
                    </button>
                    <button type="button" className="button button--danger" onClick={() => onDeletePatient(patient)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </article>

      <article className="page-card stack-gap">
        <h2>Create patient</h2>
        <form className="form-grid" onSubmit={onCreatePatient}>
          <label>
            Full name
            <input
              className="input"
              value={createForm.full_name}
              onChange={(event) => setCreateForm((current) => ({ ...current, full_name: event.target.value }))}
              required
            />
          </label>
          <label>
            Date of birth
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
          <label>
            Height (cm)
            <input
              className="input"
              type="number"
              step="0.1"
              value={createForm.height_cm}
              onChange={(event) => setCreateForm((current) => ({ ...current, height_cm: event.target.value }))}
              required
            />
          </label>
          <button className="button button--primary" type="submit" disabled={action === "create-patient"}>
            {action === "create-patient" ? "Saving..." : "Save patient"}
          </button>
        </form>

        <h2>Edit selected patient</h2>
        {editPatientId === null ? (
          <p className="muted-text">Choose one patient and click Edit to load this form.</p>
        ) : (
          <form className="form-grid" onSubmit={onUpdatePatient}>
            <label>
              Full name
              <input
                className="input"
                value={editForm.full_name}
                onChange={(event) => setEditForm((current) => ({ ...current, full_name: event.target.value }))}
                required
              />
            </label>
            <label>
              Date of birth
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
            <button className="button button--primary" type="submit" disabled={action === "update-patient"}>
              {action === "update-patient" ? "Saving..." : "Update patient"}
            </button>
          </form>
        )}
      </article>
    </section>
  );
}


