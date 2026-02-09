import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOutletContext } from "react-router-dom";
import { medicalApi } from "../api";
import { NoticeBanner } from "../components/common/NoticeBanner";
import { EvolutionChart } from "../components/dashboard/EvolutionChart";
import { LabAlerts } from "../components/dashboard/LabAlerts";
import { formatDate, formatDecimal } from "../helpers";
import type { Notice } from "../helpers";
import type { LabTestDefinition } from "../types";
import type { PatientRouteContext } from "./PatientRouteLayout";



export function PatientDashboardPage() {
  const { patientId, patient } = useOutletContext<PatientRouteContext>();

  /*
   * REACT QUERY:
   * We fetch all data in parallel using useQuery.
   * Since there are multiple dependent queries, we can use multiple useQuery hooks or better yet,
   * a single useQuery that fetches everything if we want them to load together (like Promise.all).
   *
   * For simplicity and to keep the "one loading state" behavior without waterfalls, we can do a single query.
   * Alternatively, separate queries would allow parts of the UI to load independently.
   * Given the current UI structure (NoticeBanner, then content), a single query is easier to migrate to.
   */

  const { data, isLoading: loading, error } = useQuery({
    queryKey: ["patient-dashboard", patientId],
    queryFn: async () => {
      const [labDefinitions, labResults, bioimpedanceEntries, anthropometryEntries, subjectiveEntries] = await Promise.all([
        medicalApi.listLabDefinitions(),
        medicalApi.listPatientLabResults(patientId),
        medicalApi.listPatientBioimpedance(patientId),
        medicalApi.listPatientAnthropometry(patientId),
        medicalApi.listPatientSubjectiveEntries(patientId),
      ]);

      return {
        definitions: labDefinitions,
        labResults,
        bioimpedanceEntries,
        anthropometryEntries,
        subjectiveEntries,
      };
    },
  });

  // Extract data with safe defaults
  const definitions = data?.definitions ?? [];
  const dashboardData = useMemo(() => {
    return {
      labResults: data?.labResults ?? [],
      bioimpedanceEntries: data?.bioimpedanceEntries ?? [],
      anthropometryEntries: data?.anthropometryEntries ?? [],
      subjectiveEntries: data?.subjectiveEntries ?? [],
    };
  }, [data]);

  // Handle errors (we can't easily use state for notice inside render, so we just derive it)
  const notice: Notice | null = error
    ? { kind: "error", message: `Não foi possível carregar dados do painel: ${error instanceof Error ? error.message : "Erro desconhecido"}` }
    : null;

  const definitionMap = useMemo(() => {
    return new Map<number, LabTestDefinition>(definitions.map((definition) => [definition.id, definition]));
  }, [definitions]);

  const sortedLabs = useMemo(
    () => [...dashboardData.labResults].sort((left, right) => right.collection_date.localeCompare(left.collection_date)),
    [dashboardData.labResults],
  );
  const sortedBio = useMemo(
    () => [...dashboardData.bioimpedanceEntries].sort((left, right) => right.date.localeCompare(left.date)),
    [dashboardData.bioimpedanceEntries],
  );
  const sortedAnthro = useMemo(
    () => [...dashboardData.anthropometryEntries].sort((left, right) => right.date.localeCompare(left.date)),
    [dashboardData.anthropometryEntries],
  );
  const sortedSubjective = useMemo(
    () => [...dashboardData.subjectiveEntries].sort((left, right) => right.date.localeCompare(left.date)),
    [dashboardData.subjectiveEntries],
  );

  const latestBio = sortedBio[0] ?? null;
  const latestAnthro = sortedAnthro[0] ?? null;

  // Prepare chart data
  const weightData = useMemo(() => {
    return dashboardData.bioimpedanceEntries.map((entry) => ({
      date: entry.date,
      weight: entry.weight_kg,
      muscle: entry.muscle_mass_kg,
      fat: entry.fat_mass_kg,
    }));
  }, [dashboardData.bioimpedanceEntries]);

  const compositionData = useMemo(() => {
    return dashboardData.bioimpedanceEntries.map((entry) => ({
      date: entry.date,
      fat_percent: entry.body_fat_percent,
      hydration: entry.hydration_percent ?? 0,
    }));
  }, [dashboardData.bioimpedanceEntries]);

  return (
    <div className="stack-gap">
      <div className="split-row">
        <div>
          <h3>Visão Geral</h3>
          <p className="muted-text">Métricas principais e alertas</p>
        </div>
      </div>

      <NoticeBanner notice={notice} />

      {loading ? (
        <p className="muted-text">Carregando painel...</p>
      ) : (
        <>
          <section className="metric-grid">
            <div className="metric-card">
              <h4>Peso</h4>
              <strong>{latestBio ? `${formatDecimal(latestBio.weight_kg)} kg` : "-"}</strong>
              <span>
                {latestBio ? `IMC: ${formatDecimal(latestBio.bmi)}` : "Sem dados"}
              </span>
            </div>
            <div className="metric-card">
              <h4>Gordura Corporal</h4>
              <strong>{latestBio ? `${formatDecimal(latestBio.body_fat_percent)}%` : "-"}</strong>
              <span>
                {latestBio ? `${formatDecimal(latestBio.fat_mass_kg)} kg gordura` : "Sem dados"}
              </span>
            </div>
            <div className="metric-card">
              <h4>Massa Muscular</h4>
              <strong>{latestBio ? `${formatDecimal(latestBio.muscle_mass_kg)} kg` : "-"}</strong>
              <span>Músculo Esquelético</span>
            </div>
            <div className="metric-card">
              <h4>Cintura</h4>
              <strong>{latestAnthro ? `${formatDecimal(latestAnthro.waist_cm)} cm` : "-"}</strong>
              <span>
                {latestAnthro ? formatDate(latestAnthro.date) : "-"}
              </span>
            </div>
          </section>

          <LabAlerts results={dashboardData.labResults} definitions={definitions} patient={patient} />

          <section className="grid-two">
            <EvolutionChart
              title="Evolução de Peso e Composição"
              data={weightData}
              lines={[
                { key: "weight", color: "#111827", name: "Peso (kg)" },
                { key: "muscle", color: "#c5a028", name: "Músculo (kg)" },
              ]}
            />
            <EvolutionChart
              title="Evolução % Gordura Corporal"
              data={compositionData}
              lines={[
                { key: "fat_percent", color: "#ef4444", name: "% Gordura Corporal" },
                { key: "hydration", color: "#3b82f6", name: "% Hidratação" },
              ]}
            />
          </section>

          <section className="grid-two">
            <div className="page-card stack-gap-sm">
              <h4>Resultados de Exames Recentes</h4>
              <div className="table-wrap" style={{ border: "none" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Exame</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedLabs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="empty-cell">
                          Nenhum resultado de exame ainda.
                        </td>
                      </tr>
                    ) : (
                      sortedLabs.slice(0, 5).map((result) => (
                        <tr key={result.id}>
                          <td>{formatDate(result.collection_date)}</td>
                          <td>{definitionMap.get(result.test_definition_id)?.name ?? "Desconhecido"}</td>
                          <td>{formatDecimal(result.value)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="page-card stack-gap-sm">
              <h4>Registros Subjetivos</h4>
              <div className="table-wrap" style={{ border: "none" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Métrica</th>
                      <th>Pontuação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSubjective.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="empty-cell">
                          Sem dados subjetivos ainda.
                        </td>
                      </tr>
                    ) : (
                      sortedSubjective.slice(0, 5).map((entry) => (
                        <tr key={entry.id}>
                          <td>{formatDate(entry.date)}</td>
                          <td>{entry.metric_name}</td>
                          <td><strong>{entry.score}</strong>/10</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
