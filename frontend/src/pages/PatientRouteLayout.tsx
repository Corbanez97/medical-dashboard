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
  { path: "dashboard", label: "Painel" },
  { path: "labs", label: "Resultados de Exames" },
  { path: "bioimpedance", label: "Bioimpedância" },
  { path: "anthropometry", label: "Antropometria" },
  { path: "subjective", label: "Subjetivo" },
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
        setError("ID do paciente inválido na URL.");
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
        const message = loadError instanceof Error ? loadError.message : "Erro desconhecido";
        setError(`Não foi possível carregar o paciente: ${message}`);
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
    return <section className="page-card">Carregando paciente...</section>;
  }

  if (error || patient === null) {
    return (
      <section className="page-card stack-gap">
        <h2>Paciente não disponível</h2>
        <p>{error ?? "Paciente não encontrado."}</p>
        <button className="button button--outline" type="button" onClick={() => navigate("/patients")}>Voltar para pacientes</button>
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
          &larr; Voltar para pacientes
        </button>
        <div className="patient-header" style={{ marginTop: "1rem" }}>
          <div>
            <h1 style={{ marginBottom: "0.5rem" }}>{patient.full_name}</h1>
            <p className="muted-text" style={{ fontSize: "1rem" }}>
              ID #{patient.id} &bull; {age === null ? "Idade n/a" : `${age} anos`} &bull; {patient.gender} &bull; {patient.height_cm} cm
            </p>
          </div>
          <div className="muted-text">Criado em: {formatDateTime(patient.created_at)}</div>
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
