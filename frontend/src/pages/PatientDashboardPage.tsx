import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { medicalApi } from "../api";
import { NoticeBanner } from "../components/common/NoticeBanner";
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
  const { patientId } = useOutletContext<PatientRouteContext>();

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

  const latestLab = sortedLabs[0] ?? null;
  const latestBio = sortedBio[0] ?? null;
  const latestAnthro = sortedAnthro[0] ?? null;
  const latestSubjective = sortedSubjective[0] ?? null;

  return (
    <article className="page-card stack-gap">
      <div className="split-row">
        <h3>Patient dashboard</h3>
        <span className="muted-text">Overview of all domains</span>
      </div>

      <NoticeBanner notice={notice} />

      {loading ? (
        <p className="muted-text">Loading dashboard...</p>
      ) : (
        <>
          <section className="metric-grid">
            <div className="metric-card">
              <h4>Latest weight</h4>
              <strong>{latestBio ? `${latestBio.weight_kg} kg` : "-"}</strong>
              <span>Body fat: {latestBio ? `${latestBio.body_fat_percent}%` : "-"}</span>
            </div>
            <div className="metric-card">
              <h4>Latest waist</h4>
              <strong>{latestAnthro ? `${formatOptional(latestAnthro.waist_cm)} cm` : "-"}</strong>
              <span>Date: {latestAnthro ? formatDate(latestAnthro.date) : "-"}</span>
            </div>
            <div className="metric-card">
              <h4>Latest subjective score</h4>
              <strong>{latestSubjective ? `${latestSubjective.metric_name}: ${latestSubjective.score}` : "-"}</strong>
              <span>Date: {latestSubjective ? formatDate(latestSubjective.date) : "-"}</span>
            </div>
            <div className="metric-card">
              <h4>Latest lab</h4>
              <strong>
                {latestLab
                  ? `${definitionMap.get(latestLab.test_definition_id)?.name ?? "Test"}: ${latestLab.value}`
                  : "-"}
              </strong>
              <span>Date: {latestLab ? formatDate(latestLab.collection_date) : "-"}</span>
            </div>
          </section>

          <section className="grid-two">
            <div className="table-wrap">
              <h4>Recent lab results</h4>
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
                    sortedLabs.slice(0, 6).map((result) => (
                      <tr key={result.id}>
                        <td>{formatDate(result.collection_date)}</td>
                        <td>{definitionMap.get(result.test_definition_id)?.name ?? result.test_definition_id}</td>
                        <td>{result.value}</td>
                        <td>{result.flag ?? "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-wrap">
              <h4>Recent subjective logs</h4>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Metric</th>
                    <th>Score</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSubjective.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="empty-cell">
                        No subjective data yet.
                      </td>
                    </tr>
                  ) : (
                    sortedSubjective.slice(0, 6).map((entry) => (
                      <tr key={entry.id}>
                        <td>{formatDate(entry.date)}</td>
                        <td>{entry.metric_name}</td>
                        <td>{entry.score}</td>
                        <td>{entry.notes ?? "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </article>
  );
}
