import { useMemo, useState } from "react";
import { formatDate } from "../../helpers";
import type { LabResult, LabTestDefinition, Patient } from "../../types";
import { Modal } from "../common/Modal";

type Props = {
    results: LabResult[];
    definitions: LabTestDefinition[];
    patient: Patient | null;
};

export function LabAlerts({ results, definitions, patient }: Props) {
    const [showAllAlerts, setShowAllAlerts] = useState(false);

    const alerts = useMemo(() => {
        if (!patient) return [];

        const defMap = new Map(definitions.map((d) => [d.id, d]));
        const isFemale = patient.gender.toLowerCase().startsWith("f");

        const outOfRange = results.filter((result) => {
            const def = defMap.get(result.test_definition_id);
            if (!def) return false;

            const min = isFemale ? def.ref_min_female : def.ref_min_male;
            const max = isFemale ? def.ref_max_female : def.ref_max_male;

            if (min === null && max === null) return false;

            const lower = min ?? -Infinity;
            const upper = max ?? Infinity;

            return result.value < lower || result.value > upper;
        });

        outOfRange.sort((a, b) => b.collection_date.localeCompare(a.collection_date));

        const seenNames = new Set<string>();
        const uniqueAlerts: LabResult[] = [];

        for (const result of outOfRange) {
            const def = defMap.get(result.test_definition_id);
            if (def) {
                if (!seenNames.has(def.name)) {
                    seenNames.add(def.name);
                    uniqueAlerts.push(result);
                }
            }
        }

        return uniqueAlerts;
    }, [results, definitions, patient]);

    if (alerts.length === 0) {
        return null;
    }

    const defMap = new Map(definitions.map((d) => [d.id, d]));

    return (
        <>
            <div className="page-card stack-gap-sm" style={{ borderColor: "var(--danger-border)", backgroundColor: "#fff5f5" }}>
                <div className="row-gap" style={{ color: "var(--danger)" }}>
                    <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <h4 style={{ color: "var(--danger)" }}>Resultados de Exames Anormais ({alerts.length})</h4>
                </div>

                <div className="table-wrap">
                    <table style={{ background: "transparent" }}>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Exame</th>
                                <th>Valor</th>
                                <th>Referência</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alerts.slice(0, 5).map((result) => {
                                const def = defMap.get(result.test_definition_id);
                                const isFemale = patient?.gender.toLowerCase().startsWith("f");
                                const min = isFemale ? def?.ref_min_female : def?.ref_min_male;
                                const max = isFemale ? def?.ref_max_female : def?.ref_max_male;

                                return (
                                    <tr key={result.id}>
                                        <td>{formatDate(result.collection_date)}</td>
                                        <td><strong>{def?.name ?? "Desconhecido"}</strong></td>
                                        <td style={{ color: "var(--danger)", fontWeight: 600 }}>{result.value} {def?.unit}</td>
                                        <td className="muted-text">
                                            {min !== null ? min : "?"} - {max !== null ? max : "?"}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {alerts.length > 5 && (
                    <button
                        type="button"
                        className="muted-text"
                        style={{
                            fontSize: "0.85rem",
                            textAlign: "center",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            width: "100%",
                            padding: "0.5rem",
                            textDecoration: "underline"
                        }}
                        onClick={() => setShowAllAlerts(true)}
                    >
                        + {alerts.length - 5} mais alertas
                    </button>
                )}
            </div>

            <Modal
                isOpen={showAllAlerts}
                onClose={() => setShowAllAlerts(false)}
                title="Resultados de Exames Anormais"
            >
                <div className="table-wrap" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                    <table style={{ background: "transparent" }}>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Exame</th>
                                <th>Valor</th>
                                <th>Referência</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alerts.map((result) => {
                                const def = defMap.get(result.test_definition_id);
                                const isFemale = patient?.gender.toLowerCase().startsWith("f");
                                const min = isFemale ? def?.ref_min_female : def?.ref_min_male;
                                const max = isFemale ? def?.ref_max_female : def?.ref_max_male;

                                return (
                                    <tr key={result.id}>
                                        <td>{formatDate(result.collection_date)}</td>
                                        <td><strong>{def?.name ?? "Desconhecido"}</strong></td>
                                        <td style={{ color: "var(--danger)", fontWeight: 600 }}>{result.value} {def?.unit}</td>
                                        <td className="muted-text">
                                            {min !== null ? min : "?"} - {max !== null ? max : "?"}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Modal>
        </>
    );
}
