import type {
  AnthropometryEntry,
  AnthropometryEntryCreate,
  BioimpedanceEntry,
  BioimpedanceEntryCreate,
  LabResult,
  LabResultCreate,
  LabTestDefinition,
  LabTestDefinitionCreate,
  Patient,
  PatientCreate,
  PatientUpdate,
  SubjectiveEntry,
  SubjectiveEntryCreate,
} from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

type ApiMethod = "GET" | "POST" | "PUT" | "DELETE";

async function request<T>(
  endpoint: string,
  method: ApiMethod = "GET",
  body?: unknown,
): Promise<T> {
  const headers: HeadersInit = body ? { "Content-Type": "application/json" } : {};

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const errorJson = (await response.json()) as { detail?: string };
      if (errorJson.detail) {
        detail = errorJson.detail;
      }
    } catch {
      // noop: falls back to status text
    }
    throw new Error(`API ${response.status}: ${detail}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const medicalApi = {
  listPatients: (skip = 0, limit = 100) =>
    request<Patient[]>(`/patients/?skip=${skip}&limit=${limit}`),
  getPatient: (patientId: number) => request<Patient>(`/patients/${patientId}`),
  createPatient: (payload: PatientCreate) => request<Patient>("/patients/", "POST", payload),
  updatePatient: (patientId: number, payload: PatientUpdate) =>
    request<Patient>(`/patients/${patientId}`, "PUT", payload),
  deletePatient: (patientId: number) => request<void>(`/patients/${patientId}`, "DELETE"),

  listLabDefinitions: (skip = 0, limit = 100) =>
    request<LabTestDefinition[]>(`/lab-definitions/?skip=${skip}&limit=${limit}`),
  createLabDefinition: (payload: LabTestDefinitionCreate) =>
    request<LabTestDefinition>("/lab-definitions/", "POST", payload),
  updateLabDefinition: (id: number, payload: LabTestDefinitionCreate) =>
    request<LabTestDefinition>(`/lab-definitions/${id}`, "PUT", payload),

  createLabResult: (payload: LabResultCreate) => request<LabResult>("/lab-results/", "POST", payload),
  listPatientLabResults: (patientId: number) => request<LabResult[]>(`/patients/${patientId}/lab-results/`),

  createBioimpedanceEntry: (payload: BioimpedanceEntryCreate) =>
    request<BioimpedanceEntry>("/bioimpedance/", "POST", payload),
  listPatientBioimpedance: (patientId: number) =>
    request<BioimpedanceEntry[]>(`/patients/${patientId}/bioimpedance/`),

  createAnthropometryEntry: (payload: AnthropometryEntryCreate) =>
    request<AnthropometryEntry>("/anthropometry/", "POST", payload),
  listPatientAnthropometry: (patientId: number) =>
    request<AnthropometryEntry[]>(`/patients/${patientId}/anthropometry/`),

  createSubjectiveEntry: (payload: SubjectiveEntryCreate) =>
    request<SubjectiveEntry>("/subjective/", "POST", payload),
  listPatientSubjectiveEntries: (patientId: number) =>
    request<SubjectiveEntry[]>(`/patients/${patientId}/subjective/`),
};
