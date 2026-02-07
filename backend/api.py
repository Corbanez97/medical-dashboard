from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from database import get_db, engine
from models import (
    Base, Patient, LabTestDefinition, LabResult, 
    BioimpedanceEntry, AnthropometryEntry, SubjectiveEntry
)
from schemas import (
    PatientCreate, PatientUpdate, Patient as PatientSchema,
    LabTestDefinitionCreate, LabTestDefinitionUpdate, LabTestDefinition as LabTestDefinitionSchema,
    LabResultCreate, LabResultUpdate, LabResult as LabResultSchema,
    BioimpedanceEntryCreate, BioimpedanceEntryUpdate, BioimpedanceEntry as BioimpedanceEntrySchema,
    AnthropometryEntryCreate, AnthropometryEntryUpdate, AnthropometryEntry as AnthropometryEntrySchema,
    SubjectiveEntryCreate, SubjectiveEntryUpdate, SubjectiveEntry as SubjectiveEntrySchema
)

app = FastAPI(title="Medical Dashboard API")

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# --- Patients ---

@app.post("/patients/", response_model=PatientSchema, status_code=status.HTTP_201_CREATED)
async def create_patient(patient: PatientCreate, db: AsyncSession = Depends(get_db)):
    db_patient = Patient(**patient.model_dump())
    db.add(db_patient)
    await db.commit()
    await db.refresh(db_patient)
    return db_patient

@app.get("/patients/", response_model=List[PatientSchema])
async def read_patients(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Patient).offset(skip).limit(limit))
    return result.scalars().all()

@app.get("/patients/{patient_id}", response_model=PatientSchema)
async def read_patient(patient_id: int, db: AsyncSession = Depends(get_db)):
    db_patient = await db.get(Patient, patient_id)
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return db_patient

@app.put("/patients/{patient_id}", response_model=PatientSchema)
async def update_patient(patient_id: int, patient: PatientUpdate, db: AsyncSession = Depends(get_db)):
    db_patient = await db.get(Patient, patient_id)
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    update_data = patient.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_patient, key, value)
    
    await db.commit()
    await db.refresh(db_patient)
    return db_patient

@app.delete("/patients/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(patient_id: int, db: AsyncSession = Depends(get_db)):
    db_patient = await db.get(Patient, patient_id)
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    await db.delete(db_patient)
    await db.commit()

# --- Lab Test Definitions ---

@app.post("/lab-definitions/", response_model=LabTestDefinitionSchema, status_code=status.HTTP_201_CREATED)
async def create_lab_definition(definition: LabTestDefinitionCreate, db: AsyncSession = Depends(get_db)):
    db_definition = LabTestDefinition(**definition.model_dump())
    db.add(db_definition)
    await db.commit()
    await db.refresh(db_definition)
    return db_definition

@app.get("/lab-definitions/", response_model=List[LabTestDefinitionSchema])
async def read_lab_definitions(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LabTestDefinition).offset(skip).limit(limit))
    return result.scalars().all()

# --- Lab Results ---

@app.post("/lab-results/", response_model=LabResultSchema, status_code=status.HTTP_201_CREATED)
async def create_lab_result(result: LabResultCreate, db: AsyncSession = Depends(get_db)):
    db_result = LabResult(**result.model_dump())
    db.add(db_result)
    await db.commit()
    await db.refresh(db_result)
    return db_result

@app.get("/patients/{patient_id}/lab-results/", response_model=List[LabResultSchema])
async def read_patient_lab_results(patient_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(LabResult).where(LabResult.patient_id == patient_id))
    return result.scalars().all()

# --- Bioimpedance Entries ---

@app.post("/bioimpedance/", response_model=BioimpedanceEntrySchema, status_code=status.HTTP_201_CREATED)
async def create_bioimpedance(entry: BioimpedanceEntryCreate, db: AsyncSession = Depends(get_db)):
    db_entry = BioimpedanceEntry(**entry.model_dump())
    db.add(db_entry)
    await db.commit()
    await db.refresh(db_entry)
    return db_entry

@app.get("/patients/{patient_id}/bioimpedance/", response_model=List[BioimpedanceEntrySchema])
async def read_patient_bioimpedance(patient_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BioimpedanceEntry).where(BioimpedanceEntry.patient_id == patient_id))
    return result.scalars().all()

# --- Anthropometry Entries ---

@app.post("/anthropometry/", response_model=AnthropometryEntrySchema, status_code=status.HTTP_201_CREATED)
async def create_anthropometry(entry: AnthropometryEntryCreate, db: AsyncSession = Depends(get_db)):
    db_entry = AnthropometryEntry(**entry.model_dump())
    db.add(db_entry)
    await db.commit()
    await db.refresh(db_entry)
    return db_entry

@app.get("/patients/{patient_id}/anthropometry/", response_model=List[AnthropometryEntrySchema])
async def read_patient_anthropometry(patient_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AnthropometryEntry).where(AnthropometryEntry.patient_id == patient_id))
    return result.scalars().all()

# --- Subjective Entries ---

@app.post("/subjective/", response_model=SubjectiveEntrySchema, status_code=status.HTTP_201_CREATED)
async def create_subjective(entry: SubjectiveEntryCreate, db: AsyncSession = Depends(get_db)):
    db_entry = SubjectiveEntry(**entry.model_dump())
    db.add(db_entry)
    await db.commit()
    await db.refresh(db_entry)
    return db_entry

@app.get("/patients/{patient_id}/subjective/", response_model=List[SubjectiveEntrySchema])
async def read_patient_subjective(patient_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SubjectiveEntry).where(SubjectiveEntry.patient_id == patient_id))
    return result.scalars().all()
