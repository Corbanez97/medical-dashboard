export interface Patient {
  id: number;
  full_name: string;
  date_of_birth: string;
  gender: string;
  height_cm: number;
  created_at: string;
}

export interface PatientCreate {
  full_name: string;
  date_of_birth: string;
  gender: string;
  height_cm: number;
}

export interface PatientUpdate {
  full_name?: string;
  date_of_birth?: string;
  gender?: string;
  height_cm?: number;
}

export interface LabTestDefinition {
  id: number;
  name: string;
  category: string;
  unit: string;
  ref_min_male: number | null;
  ref_max_male: number | null;
  ref_min_female: number | null;
  ref_max_female: number | null;
}

export interface LabTestDefinitionCreate {
  name: string;
  category: string;
  unit: string;
  ref_min_male: number | null;
  ref_max_male: number | null;
  ref_min_female: number | null;
  ref_max_female: number | null;
}

export interface LabResult {
  id: number;
  patient_id: number;
  test_definition_id: number;
  collection_date: string;
  value: number;
  flag: string | null;
}

export interface LabResultCreate {
  patient_id: number;
  test_definition_id: number;
  collection_date: string;
  value: number;
  flag: string | null;
}

export interface BioimpedanceEntry {
  id: number;
  patient_id: number;
  date: string;
  weight_kg: number;
  bmi: number;
  body_fat_percent: number;
  fat_mass_kg: number;
  muscle_mass_kg: number;
  visceral_fat_level: number | null;
  basal_metabolic_rate_kcal: number | null;
  hydration_percent: number | null;
}

export interface BioimpedanceEntryCreate {
  patient_id: number;
  date: string;
  weight_kg: number;
  bmi: number;
  body_fat_percent: number;
  fat_mass_kg: number;
  muscle_mass_kg: number;
  visceral_fat_level: number | null;
  basal_metabolic_rate_kcal: number | null;
  hydration_percent: number | null;
}

export interface AnthropometryEntry {
  id: number;
  patient_id: number;
  date: string;
  waist_cm: number | null;
  abdomen_cm: number | null;
  hips_cm: number | null;
  right_arm_cm: number | null;
  left_arm_cm: number | null;
  right_thigh_cm: number | null;
  left_thigh_cm: number | null;
}

export interface AnthropometryEntryCreate {
  patient_id: number;
  date: string;
  waist_cm: number | null;
  abdomen_cm: number | null;
  hips_cm: number | null;
  right_arm_cm: number | null;
  left_arm_cm: number | null;
  right_thigh_cm: number | null;
  left_thigh_cm: number | null;
}

export interface SubjectiveEntry {
  id: number;
  patient_id: number;
  date: string;
  metric_name: string;
  score: number;
  notes: string | null;
}

export interface SubjectiveEntryCreate {
  patient_id: number;
  date: string;
  metric_name: string;
  score: number;
  notes: string | null;
}

export interface PatientDashboardData {
  labResults: LabResult[];
  bioimpedanceEntries: BioimpedanceEntry[];
  anthropometryEntries: AnthropometryEntry[];
  subjectiveEntries: SubjectiveEntry[];
}
