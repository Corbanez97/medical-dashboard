import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import { medicalApi } from "../api";
import { calculateAge, formatDateTime } from "../helpers";
import type { Patient } from "../types";

export type PatientRouteContext = {
  patientId: number;
  patient: Patient;
  refreshPatient: () => Promise<void>;
};

const links = [
  { path: "dashboard", label: "Dashboard" },
  { path: "labs", label: "Lab results" },
  { path: "bioimpedance", label: "Bioimpedance" },
  { path: "anthropometry", label: "Anthropometry" },
  { path: "subjective", label: "Subjective" },
];

export function PatientRouteLayout() {
  const navigate = useNavigate();
  const { patientId: patientIdParam } = useParams();
  const patientId = useMemo(() => Number.parseInt(patientIdParam ?? "", 10), [patientIdParam]);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPatient = async () => {
    const loaded = await medicalApi.getPatient(patientId);
    setPatient(loaded);
  };

  useEffect(() => {
    let active = true;

    const loadPatient = async () => {
      if (Number.isNaN(patientId)) {
        setError("Invalid patient id in URL.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const loadedPatient = await medicalApi.getPatient(patientId);
        if (!active) {
          return;
        }
        setPatient(loadedPatient);
      } catch (loadError) {
        if (!active) {
          return;
        }
        const message = loadError instanceof Error ? loadError.message : "Unknown error";
        setError(`Could not load patient: ${message}`);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadPatient();
    return () => {
      active = false;
    };
  }, [patientId]);

  if (loading) {
    return <section className="page-card">Loading patient...</section>;
  }

  if (error || patient === null) {
    return (
      <section className="page-card stack-gap">
        <h2>Patient not available</h2>
        <p>{error ?? "Patient not found."}</p>
        <button className="button button--outline" type="button" onClick={() => navigate("/patients")}>Back to patients</button>
      </section>
    );
  }

  const age = calculateAge(patient.date_of_birth);

  return (
    <div className="stack-gap" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div>
        <button
          onClick={() => navigate("/patients")}
          style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem", padding: "0" }}
        >
          &larr; Back to patients
        </button>
        <div className="patient-header" style={{ marginTop: "1rem" }}>
          <div>
            <h1 style={{ marginBottom: "0.5rem" }}>{patient.full_name}</h1>
            <p className="muted-text" style={{ fontSize: "1rem" }}>
              ID #{patient.id} &bull; {age === null ? "Age n/a" : `${age} years old`} &bull; {patient.gender} &bull; {patient.height_cm} cm
            </p>
          </div>
          <div className="muted-text">Created: {formatDateTime(patient.created_at)}</div>
        </div>

        <div className="sub-nav">
          {links.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `tab-link ${isActive ? "active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      <Outlet context={{ patientId, patient, refreshPatient } satisfies PatientRouteContext} />
    </div>
  );
}
