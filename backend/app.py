import boto3
from botocore.exceptions import ClientError
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List

from config import settings
from database import get_db, engine
from models import (
    Base, Patient, LabTestDefinition, LabResult, 
    BioimpedanceEntry, AnthropometryEntry, SubjectiveEntry, ExamUpload, ExtractedLabResult
)
from schemas import (
    PatientCreate, PatientUpdate, Patient as PatientSchema,
    LabTestDefinitionCreate, LabTestDefinitionUpdate, LabTestDefinition as LabTestDefinitionSchema,
    LabResultCreate, LabResultUpdate, LabResult as LabResultSchema,
    BioimpedanceEntryCreate, BioimpedanceEntryUpdate, BioimpedanceEntry as BioimpedanceEntrySchema,
    AnthropometryEntryCreate, AnthropometryEntryUpdate, AnthropometryEntry as AnthropometryEntrySchema,
    SubjectiveEntryCreate, SubjectiveEntryUpdate, SubjectiveEntry as SubjectiveEntrySchema,
    ExamUploadCreate, ExamUpload as ExamUploadSchema,
    ExtractedLabResult as ExtractedLabResultSchema, ExtractedLabResultUpdate
)

app = FastAPI(title="Medical Dashboard API")

origins = [
    "http://localhost:5174",          
    "http://localhost:3000",          
    "https://medical-dashboard-tatsch.vercel.app",                            
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,            
    allow_credentials=True,
    allow_methods=["*"],              
    allow_headers=["*"], 
)             

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

@app.get("/lab-definitions/{definition_id}", response_model=LabTestDefinitionSchema)
async def read_lab_definition(definition_id: int, db: AsyncSession = Depends(get_db)):
    db_definition = await db.get(LabTestDefinition, definition_id)
    if db_definition is None:
        raise HTTPException(status_code=404, detail="Lab Test Definition not found")
    return db_definition

@app.put("/lab-definitions/{definition_id}", response_model=LabTestDefinitionSchema)
async def update_lab_definition(definition_id: int, definition: LabTestDefinitionUpdate, db: AsyncSession = Depends(get_db)):
    db_definition = await db.get(LabTestDefinition, definition_id)
    if db_definition is None:
        raise HTTPException(status_code=404, detail="Lab Test Definition not found")
    
    update_data = definition.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_definition, key, value)
    
    await db.commit()
    await db.refresh(db_definition)
    return db_definition

@app.delete("/lab-definitions/{definition_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lab_definition(definition_id: int, db: AsyncSession = Depends(get_db)):
    db_definition = await db.get(LabTestDefinition, definition_id)
    if db_definition is None:
        raise HTTPException(status_code=404, detail="Lab Test Definition not found")
    await db.delete(db_definition)
    await db.commit()

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

@app.get("/lab-results/{result_id}", response_model=LabResultSchema)
async def read_lab_result(result_id: int, db: AsyncSession = Depends(get_db)):
    db_result = await db.get(LabResult, result_id)
    if db_result is None:
        raise HTTPException(status_code=404, detail="Lab Result not found")
    return db_result

@app.put("/lab-results/{result_id}", response_model=LabResultSchema)
async def update_lab_result(result_id: int, result: LabResultUpdate, db: AsyncSession = Depends(get_db)):
    db_result = await db.get(LabResult, result_id)
    if db_result is None:
        raise HTTPException(status_code=404, detail="Lab Result not found")
    
    update_data = result.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_result, key, value)
    
    await db.commit()
    await db.refresh(db_result)
    return db_result

@app.delete("/lab-results/{result_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lab_result(result_id: int, db: AsyncSession = Depends(get_db)):
    db_result = await db.get(LabResult, result_id)
    if db_result is None:
        raise HTTPException(status_code=404, detail="Lab Result not found")
    await db.delete(db_result)
    await db.commit()

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

@app.get("/bioimpedance/{entry_id}", response_model=BioimpedanceEntrySchema)
async def read_bioimpedance_entry(entry_id: int, db: AsyncSession = Depends(get_db)):
    db_entry = await db.get(BioimpedanceEntry, entry_id)
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Bioimpedance Entry not found")
    return db_entry

@app.put("/bioimpedance/{entry_id}", response_model=BioimpedanceEntrySchema)
async def update_bioimpedance_entry(entry_id: int, entry: BioimpedanceEntryUpdate, db: AsyncSession = Depends(get_db)):
    db_entry = await db.get(BioimpedanceEntry, entry_id)
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Bioimpedance Entry not found")
    
    update_data = entry.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_entry, key, value)
    
    await db.commit()
    await db.refresh(db_entry)
    return db_entry

@app.delete("/bioimpedance/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bioimpedance_entry(entry_id: int, db: AsyncSession = Depends(get_db)):
    db_entry = await db.get(BioimpedanceEntry, entry_id)
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Bioimpedance Entry not found")
    await db.delete(db_entry)
    await db.commit()

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

@app.get("/anthropometry/{entry_id}", response_model=AnthropometryEntrySchema)
async def read_anthropometry_entry(entry_id: int, db: AsyncSession = Depends(get_db)):
    db_entry = await db.get(AnthropometryEntry, entry_id)
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Anthropometry Entry not found")
    return db_entry

@app.put("/anthropometry/{entry_id}", response_model=AnthropometryEntrySchema)
async def update_anthropometry_entry(entry_id: int, entry: AnthropometryEntryUpdate, db: AsyncSession = Depends(get_db)):
    db_entry = await db.get(AnthropometryEntry, entry_id)
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Anthropometry Entry not found")
    
    update_data = entry.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_entry, key, value)
    
    await db.commit()
    await db.refresh(db_entry)
    return db_entry

@app.delete("/anthropometry/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_anthropometry_entry(entry_id: int, db: AsyncSession = Depends(get_db)):
    db_entry = await db.get(AnthropometryEntry, entry_id)
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Anthropometry Entry not found")
    await db.delete(db_entry)
    await db.commit()

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

@app.get("/subjective/{entry_id}", response_model=SubjectiveEntrySchema)
async def read_subjective_entry(entry_id: int, db: AsyncSession = Depends(get_db)):
    db_entry = await db.get(SubjectiveEntry, entry_id)
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Subjective Entry not found")
    return db_entry

@app.put("/subjective/{entry_id}", response_model=SubjectiveEntrySchema)
async def update_subjective_entry(entry_id: int, entry: SubjectiveEntryUpdate, db: AsyncSession = Depends(get_db)):
    db_entry = await db.get(SubjectiveEntry, entry_id)
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Subjective Entry not found")
    
    update_data = entry.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_entry, key, value)
    
    await db.commit()
    await db.refresh(db_entry)
    return db_entry

@app.delete("/subjective/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subjective_entry(entry_id: int, db: AsyncSession = Depends(get_db)):
    db_entry = await db.get(SubjectiveEntry, entry_id)
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Subjective Entry not found")
    await db.delete(db_entry)
    await db.commit()

# --- Exam Uploads ---

@app.post("/patients/{patient_id}/exams/upload-url", status_code=status.HTTP_201_CREATED)
async def generate_upload_url(
    patient_id: int, 
    filename: str, 
    db: AsyncSession = Depends(get_db)
):
    # Verify patient exists
    db_patient = await db.get(Patient, patient_id)
    if not db_patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # 1. Create a DB record to track this upload (Traceability Start)
    # We use a timestamp to avoid overwriting files with same name
    file_key = f"patients/{patient_id}/{int(datetime.now().timestamp())}_{filename}"
    
    new_upload = ExamUpload(
        patient_id=patient_id,
        filename=filename,
        s3_key=file_key,
        status="pending_upload"
    )
    db.add(new_upload)
    await db.commit()
    await db.refresh(new_upload)
    
    # 2. Generate Presigned URL
    s3_client = boto3.client(
        's3', 
        region_name=settings.AWS_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
    )

    try:
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': settings.OCR_BUCKET, 
                'Key': file_key, 
                'ContentType': 'application/pdf'
            },
            ExpiresIn=3600
        )
    except ClientError as e:
        # In a real app, log the error
        print(f"Error generating presigned URL: {e}")
        raise HTTPException(status_code=500, detail="Could not generate upload URL")

    return {"upload_url": presigned_url, "exam_upload_id": new_upload.id}

@app.get("/exam-uploads/{upload_id}", response_model=ExamUploadSchema)
async def read_exam_upload_status(upload_id: int, db: AsyncSession = Depends(get_db)):
    db_upload = await db.get(ExamUpload, upload_id)
    if db_upload is None:
        raise HTTPException(status_code=404, detail="Exam Upload not found")
    return db_upload

@app.get("/exam-uploads/{upload_id}/results", response_model=List[ExtractedLabResultSchema])
async def read_exam_upload_results(upload_id: int, db: AsyncSession = Depends(get_db)):
    # Verify upload exists
    db_upload = await db.get(ExamUpload, upload_id)
    if db_upload is None:
        raise HTTPException(status_code=404, detail="Exam Upload not found")
        
    result = await db.execute(
        select(ExtractedLabResult)
        .where(ExtractedLabResult.exam_upload_id == upload_id)
        .options(selectinload(ExtractedLabResult.matched_definition)) 
    )
    return result.scalars().all()

@app.put("/extracted-results/{result_id}", response_model=ExtractedLabResultSchema)
async def update_extracted_result(result_id: int, result: ExtractedLabResultUpdate, db: AsyncSession = Depends(get_db)):
    db_result = await db.get(ExtractedLabResult, result_id)
    if db_result is None:
        raise HTTPException(status_code=404, detail="Extracted Result not found")
    
    update_data = result.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_result, key, value)
    
    await db.commit()
    await db.refresh(db_result)
    return db_result

@app.post("/exam-uploads/{upload_id}/approve", status_code=status.HTTP_200_OK)
async def approve_exam_upload(upload_id: int, db: AsyncSession = Depends(get_db)):
    """
    Commit the 'ExtractedLabResult' items to the permanent 'LabResult' table.
    """
    # 1. Get the upload
    db_upload = await db.get(ExamUpload, upload_id)
    if not db_upload:
        raise HTTPException(status_code=404, detail="Exam Upload not found")
        
    if db_upload.status != "ready":
        raise HTTPException(status_code=400, detail="Exam processing is not ready yet")

    # 2. Get all extracted results
    result_query = await db.execute(select(ExtractedLabResult).where(ExtractedLabResult.exam_upload_id == upload_id))
    extracted_results = result_query.scalars().all()
    
    # 3. Migrate to LabResult
    # TODO: In a real app, you might want to filter out ones with no matched_definition_id
    # or handle them as 'unknown' tests. For now, we skip them.
    
    count_created = 0
    for item in extracted_results:
        if item.matched_test_definition_id:
            new_lab_result = LabResult(
                patient_id=db_upload.patient_id,
                test_definition_id=item.matched_test_definition_id,
                collection_date=db_upload.created_at.date(), # Approximate date
                value=item.value,
                flag=None # You could recalculate flag here based on ref ranges
            )
            db.add(new_lab_result)
            count_created += 1
            
    # 4. Mark upload as 'approved'
    db_upload.status = "approved"
    
    await db.commit()
    return {"message": "Results approved and saved", "count": count_created}
