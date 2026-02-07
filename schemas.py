from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import List, Optional

# --- Patient Schemas ---
class PatientBase(BaseModel):
    full_name: str
    date_of_birth: date
    gender: str
    height_cm: float

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = None

class Patient(PatientBase):
    id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# --- LabTestDefinition Schemas ---
class LabTestDefinitionBase(BaseModel):
    name: str
    category: str
    unit: str
    ref_min_male: Optional[float] = None
    ref_max_male: Optional[float] = None
    ref_min_female: Optional[float] = None
    ref_max_female: Optional[float] = None

class LabTestDefinitionCreate(LabTestDefinitionBase):
    pass

class LabTestDefinitionUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    ref_min_male: Optional[float] = None
    ref_max_male: Optional[float] = None
    ref_min_female: Optional[float] = None
    ref_max_female: Optional[float] = None

class LabTestDefinition(LabTestDefinitionBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

# --- LabResult Schemas ---
class LabResultBase(BaseModel):
    patient_id: int
    test_definition_id: int
    collection_date: date
    value: float
    flag: Optional[str] = None

class LabResultCreate(LabResultBase):
    pass

class LabResultUpdate(BaseModel):
    patient_id: Optional[int] = None
    test_definition_id: Optional[int] = None
    collection_date: Optional[date] = None
    value: Optional[float] = None
    flag: Optional[str] = None

class LabResult(LabResultBase):
    id: int
    
    # Optional nested models for convenience, can be added later if needed
    # patient: Optional[Patient] = None
    # test_definition: Optional[LabTestDefinition] = None

    model_config = ConfigDict(from_attributes=True)

# --- BioimpedanceEntry Schemas ---
class BioimpedanceEntryBase(BaseModel):
    patient_id: int
    date: date
    weight_kg: float
    bmi: float
    body_fat_percent: float
    fat_mass_kg: float
    muscle_mass_kg: float
    visceral_fat_level: Optional[float] = None
    basal_metabolic_rate_kcal: Optional[int] = None
    hydration_percent: Optional[float] = None

class BioimpedanceEntryCreate(BioimpedanceEntryBase):
    pass

class BioimpedanceEntryUpdate(BaseModel):
    patient_id: Optional[int] = None
    date: Optional[date] = None
    weight_kg: Optional[float] = None
    bmi: Optional[float] = None
    body_fat_percent: Optional[float] = None
    fat_mass_kg: Optional[float] = None
    muscle_mass_kg: Optional[float] = None
    visceral_fat_level: Optional[float] = None
    basal_metabolic_rate_kcal: Optional[int] = None
    hydration_percent: Optional[float] = None

class BioimpedanceEntry(BioimpedanceEntryBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

# --- AnthropometryEntry Schemas ---
class AnthropometryEntryBase(BaseModel):
    patient_id: int
    date: date
    waist_cm: Optional[float] = None
    abdomen_cm: Optional[float] = None
    hips_cm: Optional[float] = None
    right_arm_cm: Optional[float] = None
    left_arm_cm: Optional[float] = None
    right_thigh_cm: Optional[float] = None
    left_thigh_cm: Optional[float] = None

class AnthropometryEntryCreate(AnthropometryEntryBase):
    pass

class AnthropometryEntryUpdate(BaseModel):
    patient_id: Optional[int] = None
    date: Optional[date] = None
    waist_cm: Optional[float] = None
    abdomen_cm: Optional[float] = None
    hips_cm: Optional[float] = None
    right_arm_cm: Optional[float] = None
    left_arm_cm: Optional[float] = None
    right_thigh_cm: Optional[float] = None
    left_thigh_cm: Optional[float] = None

class AnthropometryEntry(AnthropometryEntryBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

# --- SubjectiveEntry Schemas ---
class SubjectiveEntryBase(BaseModel):
    patient_id: int
    date: date
    metric_name: str
    score: int
    notes: Optional[str] = None

class SubjectiveEntryCreate(SubjectiveEntryBase):
    pass

class SubjectiveEntryUpdate(BaseModel):
    patient_id: Optional[int] = None
    date: Optional[date] = None
    metric_name: Optional[str] = None
    score: Optional[int] = None
    notes: Optional[str] = None

class SubjectiveEntry(SubjectiveEntryBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
