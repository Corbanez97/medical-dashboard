import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { medicalApi } from "../api";
import { NoticeBanner } from "../components/common/NoticeBanner";
import { EvolutionChart } from "../components/dashboard/EvolutionChart";
import { LabAlerts } from "../components/dashboard/LabAlerts";
import { formatDate, formatOptional } from "../helpers";
import type { Notice } from "../helpers";
import type {
  AnthropometryEntry,
  BioimpedanceEntry,
  LabResult,
  LabTestDefinition,
  SubjectiveEntry,
} from "../types";
import type { PatientRouteContext } from "./PatientRouteLayout";

type DashboardData = {
  labResults: LabResult[];
  bioimpedanceEntries: BioimpedanceEntry[];
  anthropometryEntries: AnthropometryEntry[];
  subjectiveEntries: SubjectiveEntry[];
};

const emptyData: DashboardData = {
  labResults: [],
  bioimpedanceEntries: [],
  anthropometryEntries: [],
  subjectiveEntries: [],
};

export function PatientDashboardPage() {
  const { patientId, patient } = useOutletContext<PatientRouteContext>();

  const [definitions, setDefinitions] = useState<LabTestDefinition[]>([]);
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setNotice(null);
      try {
        const [labDefinitions, labResults, bioimpedanceEntries, anthropometryEntries, subjectiveEntries] = await Promise.all([
          medicalApi.listLabDefinitions(),
          medicalApi.listPatientLabResults(patientId),
          medicalApi.listPatientBioimpedance(patientId),
          medicalApi.listPatientAnthropometry(patientId),
          medicalApi.listPatientSubjectiveEntries(patientId),
        ]);

        if (!active) {
          return;
        }

        setDefinitions(labDefinitions);
        setData({ labResults, bioimpedanceEntries, anthropometryEntries, subjectiveEntries });
      } catch (error) {
        if (!active) {
          return;
        }
        const message = error instanceof Error ? error.message : "Unknown error";
        setNotice({ kind: "error", message: `Could not load dashboard data: ${message}` });
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [patientId]);

  const definitionMap = useMemo(() => {
    return new Map<number, LabTestDefinition>(definitions.map((definition) => [definition.id, definition]));
  }, [definitions]);

  const sortedLabs = useMemo(
    () => [...data.labResults].sort((left, right) => right.collection_date.localeCompare(left.collection_date)),
    [data.labResults],
  );
  const sortedBio = useMemo(
    () => [...data.bioimpedanceEntries].sort((left, right) => right.date.localeCompare(left.date)),
    [data.bioimpedanceEntries],
  );
  const sortedAnthro = useMemo(
    () => [...data.anthropometryEntries].sort((left, right) => right.date.localeCompare(left.date)),
    [data.anthropometryEntries],
  );
  const sortedSubjective = useMemo(
    () => [...data.subjectiveEntries].sort((left, right) => right.date.localeCompare(left.date)),
    [data.subjectiveEntries],
  );

  const latestBio = sortedBio[0] ?? null;
  const latestAnthro = sortedAnthro[0] ?? null;

  // Prepare chart data
  const weightData = useMemo(() => {
    return data.bioimpedanceEntries.map((entry) => ({
      date: entry.date,
      weight: entry.weight_kg,
      muscle: entry.muscle_mass_kg,
      fat: entry.fat_mass_kg,
    }));
  }, [data.bioimpedanceEntries]);

  const compositionData = useMemo(() => {
    return data.bioimpedanceEntries.map((entry) => ({
      date: entry.date,
      fat_percent: entry.body_fat_percent,
      hydration: entry.hydration_percent ?? 0,
    }));
  }, [data.bioimpedanceEntries]);

  return (
    <div className="stack-gap">
      <div className="split-row">
        <div>
          <h3>Overview</h3>
          <p className="muted-text">Key metrics and alerts</p>
        </div>
      </div>

      <NoticeBanner notice={notice} />

      {loading ? (
        <p className="muted-text">Loading dashboard...</p>
      ) : (
        <>
          <section className="metric-grid">
            <div className="metric-card">
              <h4>Weight</h4>
              <strong>{latestBio ? `${latestBio.weight_kg} kg` : "-"}</strong>
              <span>
                {latestBio ? `BMI: ${latestBio.bmi.toFixed(1)}` : "No data"}
              </span>
            </div>
            <div className="metric-card">
              <h4>Body Fat</h4>
              <strong>{latestBio ? `${latestBio.body_fat_percent}%` : "-"}</strong>
              <span>
                {latestBio ? `${latestBio.fat_mass_kg} kg fat` : "No data"}
              </span>
            </div>
            <div className="metric-card">
              <h4>Muscle Mass</h4>
              <strong>{latestBio ? `${latestBio.muscle_mass_kg} kg` : "-"}</strong>
              <span>Skeletal Muscle</span>
            </div>
            <div className="metric-card">
              <h4>Waist</h4>
              <strong>{latestAnthro ? `${formatOptional(latestAnthro.waist_cm)} cm` : "-"}</strong>
              <span>
                {latestAnthro ? formatDate(latestAnthro.date) : "-"}
              </span>
            </div>
          </section>

          <LabAlerts results={data.labResults} definitions={definitions} patient={patient} />

          <section className="grid-two">
            <EvolutionChart
              title="Weight & Composition Evolution"
              data={weightData}
              lines={[
                { key: "weight", color: "#111827", name: "Weight (kg)" },
                { key: "muscle", color: "#c5a028", name: "Muscle (kg)" },
              ]}
            />
            <EvolutionChart
              title="Body Fat % Evolution"
              data={compositionData}
              lines={[
                { key: "fat_percent", color: "#ef4444", name: "Body Fat %" },
                { key: "hydration", color: "#3b82f6", name: "Hydration %" },
              ]}
            />
          </section>

          <section className="grid-two">
            <div className="page-card stack-gap-sm">
              <h4>Recent Lab Results</h4>
              <div className="table-wrap" style={{ border: "none" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Test</th>
                      <th>Value</th>
                      <th>Flag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedLabs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="empty-cell">
                          No lab results yet.
                        </td>
                      </tr>
                    ) : (
                      sortedLabs.slice(0, 5).map((result) => (
                        <tr key={result.id}>
                          <td>{formatDate(result.collection_date)}</td>
                          <td>{definitionMap.get(result.test_definition_id)?.name ?? "Unknown"}</td>
                          <td>{result.value}</td>
                          <td>{result.flag ?? "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="page-card stack-gap-sm">
              <h4>Subjective Logs</h4>
              <div className="table-wrap" style={{ border: "none" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Metric</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSubjective.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="empty-cell">
                          No subjective data yet.
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
