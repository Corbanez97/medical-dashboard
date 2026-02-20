from datetime import date, datetime
from typing import List, Optional
from sqlalchemy import String, Float, ForeignKey, Date, DateTime, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship, DeclarativeBase

class Base(DeclarativeBase):
    pass

class Patient(Base):
    """Core patient demographic data."""
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(150))
    date_of_birth: Mapped[date] = mapped_column(Date)
    gender: Mapped[str] = mapped_column(String(20))  # Masculino/Feminino
    height_cm: Mapped[float] = mapped_column(Float)  # Stored in cm
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    bioimpedance_entries: Mapped[List["BioimpedanceEntry"]] = relationship(back_populates="patient")
    lab_results: Mapped[List["LabResult"]] = relationship(back_populates="patient")
    anthropometry_entries: Mapped[List["AnthropometryEntry"]] = relationship(back_populates="patient")
    subjective_entries: Mapped[List["SubjectiveEntry"]] = relationship(back_populates="patient")
    exam_uploads: Mapped[List["ExamUpload"]] = relationship(back_populates="patient")

class LabTestDefinition(Base):
    """
    The 'Matrix'. Stores standard reference ranges.
    Example: name='Hemoglobina', unit='g/dL', min_male=12.5, max_male=17.0
    """
    __tablename__ = "lab_test_definitions"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    category: Mapped[str] = mapped_column(String(50))  # e.g., 'Metabólica', 'Hormônios'
    unit: Mapped[str] = mapped_column(String(20))
    
    # Reference ranges (nullable as some might not have strict bounds)
    ref_min_male: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ref_max_male: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ref_min_female: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ref_max_female: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

class LabResult(Base):
    """
    Vertical storage for blood work. 
    One row per test per date.
    """
    __tablename__ = "lab_results"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"))
    test_definition_id: Mapped[int] = mapped_column(ForeignKey("lab_test_definitions.id"))
    collection_date: Mapped[date] = mapped_column(Date)
    
    value: Mapped[float] = mapped_column(Float)
    
    # Optional: Store the calculated flag (Low/Normal/High) at insert time for fast retrieval
    flag: Mapped[Optional[str]] = mapped_column(String(20), nullable=True) 

    patient: Mapped["Patient"] = relationship(back_populates="lab_results")
    test_definition: Mapped["LabTestDefinition"] = relationship()

class BioimpedanceEntry(Base):
    """
    Body composition data. 
    Structured as a wide table since these are usually captured in a single scan.
    """
    __tablename__ = "bioimpedance_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"))
    date: Mapped[date] = mapped_column(Date)

    weight_kg: Mapped[float] = mapped_column(Float)
    bmi: Mapped[float] = mapped_column(Float)
    body_fat_percent: Mapped[float] = mapped_column(Float)
    fat_mass_kg: Mapped[float] = mapped_column(Float)
    muscle_mass_kg: Mapped[float] = mapped_column(Float)
    visceral_fat_level: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    basal_metabolic_rate_kcal: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    hydration_percent: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    patient: Mapped["Patient"] = relationship(back_populates="bioimpedance_entries")

class AnthropometryEntry(Base):
    """
    Tape measurements (Medidas).
    """
    __tablename__ = "anthropometry_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"))
    date: Mapped[date] = mapped_column(Date)

    waist_cm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    abdomen_cm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    hips_cm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    right_arm_cm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    left_arm_cm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    right_thigh_cm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    left_thigh_cm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    patient: Mapped["Patient"] = relationship(back_populates="anthropometry_entries")

class SubjectiveEntry(Base):
    """
    Weekly/Daily logs for Sleep, Libido, Energy.
    """
    __tablename__ = "subjective_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"))
    date: Mapped[date] = mapped_column(Date)

    metric_name: Mapped[str] = mapped_column(String(50)) # 'Sono', 'Libido', 'Energia'
    score: Mapped[int] = mapped_column(Integer) # 1-10 Scale or similar
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    patient: Mapped["Patient"] = relationship(back_populates="subjective_entries")

class ExamUpload(Base):
    """
    Tracks the file upload and processing status (Traceability).
    """
    __tablename__ = "exam_uploads"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"))
    
    filename: Mapped[str] = mapped_column(String(255))
    s3_key: Mapped[str] = mapped_column(String(512))
    status: Mapped[str] = mapped_column(String(20), default="uploading") # uploading, processing, ready, failed
    
    # Traceability Metrics
    pages_processed: Mapped[int] = mapped_column(Integer, default=0)
    tokens_used: Mapped[int] = mapped_column(Integer, default=0) # LLM Cost tracking
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    patient: Mapped["Patient"] = relationship(back_populates="exam_uploads")
    extracted_results: Mapped[List["ExtractedLabResult"]] = relationship(back_populates="exam_upload")

class ExtractedLabResult(Base):
    """
    Staging area. Results wait here until the user clicks "Approve".
    """
    __tablename__ = "extracted_lab_results"

    id: Mapped[int] = mapped_column(primary_key=True)
    exam_upload_id: Mapped[int] = mapped_column(ForeignKey("exam_uploads.id"))
    
    # The raw text found in the PDF
    raw_test_name: Mapped[str] = mapped_column(String(200))
    
    # The suggested match from your LabTestDefinitions
    matched_test_definition_id: Mapped[Optional[int]] = mapped_column(ForeignKey("lab_test_definitions.id"), nullable=True)
    
    value: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String(50))
    confidence_score: Mapped[float] = mapped_column(Float) # How confident is the LLM?

    exam_upload: Mapped["ExamUpload"] = relationship(back_populates="extracted_results")
    matched_definition: Mapped["LabTestDefinition"] = relationship()