from pydantic import BaseModel, ConfigDict
from datetime import date as DateType, datetime
from typing import List, Optional

# --- Patient Schemas ---
class PatientBase(BaseModel):
    full_name: str
    date_of_birth: DateType
    gender: str
    height_cm: float

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    date_of_birth: Optional[DateType] = None
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
    collection_date: DateType
    value: float
    flag: Optional[str] = None

class LabResultCreate(LabResultBase):
    pass

class LabResultUpdate(BaseModel):
    patient_id: Optional[int] = None
    test_definition_id: Optional[int] = None
    collection_date: Optional[DateType] = None
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
    date: DateType
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
    date: Optional[DateType] = None
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
    date: DateType
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
    date: Optional[DateType] = None
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
    date: DateType
    metric_name: str
    score: int
    notes: Optional[str] = None

class SubjectiveEntryCreate(SubjectiveEntryBase):
    pass

class SubjectiveEntryUpdate(BaseModel):
    patient_id: Optional[int] = None
    date: Optional[DateType] = None
    metric_name: Optional[str] = None
    score: Optional[int] = None
    notes: Optional[str] = None

class SubjectiveEntry(SubjectiveEntryBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

# --- ExamUpload Schemas ---
class ExamUploadBase(BaseModel):
    patient_id: int
    filename: str
    status: str = "uploading"

class ExamUploadCreate(ExamUploadBase):
    s3_key: str
    
class ExamUploadUpdate(BaseModel):
    status: Optional[str] = None
    pages_processed: Optional[int] = None
    tokens_used: Optional[int] = None

class ExamUpload(ExamUploadBase):
    id: int
    s3_key: str
    pages_processed: int
    tokens_used: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# --- ExtractedLabResult Schemas ---
class ExtractedLabResultBase(BaseModel):
    exam_upload_id: int
    raw_test_name: str
    matched_test_definition_id: Optional[int] = None
    value: float
    unit: str
    confidence_score: float

class ExtractedLabResultCreate(ExtractedLabResultBase):
    pass

class ExtractedLabResultUpdate(BaseModel):
    raw_test_name: Optional[str] = None
    matched_test_definition_id: Optional[int] = None
    value: Optional[float] = None
    unit: Optional[str] = None
    confidence_score: Optional[float] = None

class ExtractedLabResult(ExtractedLabResultBase):
    id: int
    
    # matched_definition: Optional[LabTestDefinition] = None 
    
    model_config = ConfigDict(from_attributes=True)
