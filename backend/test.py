import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from api import app
from database import get_db
from models import Base

# Setup in-memory database
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def override_get_db():
    async with TestingSessionLocal() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
async def client():
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    
    # Drop tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.mark.asyncio
async def test_docs_endpoint(client):
    """Validate the existence of the documentation endpoint."""
    response = await client.get("/docs")
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_create_patient(client):
    response = await client.post("/patients/", json={
        "full_name": "Test Patient",
        "date_of_birth": "1990-01-01",
        "gender": "Masculino",
        "height_cm": 180.0
    })
    assert response.status_code == 201
    data = response.json()
    assert data["full_name"] == "Test Patient"
    assert "id" in data
    return data["id"]

@pytest.mark.asyncio
async def test_read_patients(client):
    # Seed a patient first
    await client.post("/patients/", json={
        "full_name": "Read Test Patient",
        "date_of_birth": "1980-01-01",
        "gender": "Feminino",
        "height_cm": 165.0
    })
    
    response = await client.get("/patients/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0

@pytest.mark.asyncio
async def test_create_lab_definition(client):
    response = await client.post("/lab-definitions/", json={
        "name": "Test Lab",
        "category": "Test Category",
        "unit": "mg/dL",
        "ref_min_male": 10.0,
        "ref_max_male": 100.0
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Lab"
    return data["id"]

@pytest.mark.asyncio
async def test_create_lab_result(client):
    
    p_resp = await client.post("/patients/", json={
        "full_name": "Lab Patient",
        "date_of_birth": "1990-01-01",
        "gender": "Feminino",
        "height_cm": 160.0
    })
    patient_id = p_resp.json()["id"]

    d_resp = await client.post("/lab-definitions/", json={
        "name": "Lab Result Test",
        "category": "Test",
        "unit": "g",
    })
    def_id = d_resp.json()["id"]

    response = await client.post("/lab-results/", json={
        "patient_id": patient_id,
        "test_definition_id": def_id,
        "collection_date": "2023-01-01",
        "value": 50.0
    })
    assert response.status_code == 201
    return patient_id

@pytest.mark.asyncio
async def test_create_bioimpedance(client):
    p_resp = await client.post("/patients/", json={
        "full_name": "Bio Patient",
        "date_of_birth": "1990-01-01",
        "gender": "Masculino",
        "height_cm": 180.0
    })
    patient_id = p_resp.json()["id"]

    response = await client.post("/bioimpedance/", json={
        "patient_id": patient_id,
        "date": "2023-01-01",
        "weight_kg": 80.0,
        "bmi": 24.7,
        "body_fat_percent": 15.0,
        "fat_mass_kg": 12.0,
        "muscle_mass_kg": 60.0,
        "visceral_fat_level": 5.0,
        "basal_metabolic_rate_kcal": 1800,
        "hydration_percent": 60.0
    })
    assert response.status_code == 201

@pytest.mark.asyncio
async def test_create_anthropometry(client):
    p_resp = await client.post("/patients/", json={
        "full_name": "Anthro Patient",
        "date_of_birth": "1990-01-01",
        "gender": "Masculino",
        "height_cm": 180.0
    })
    patient_id = p_resp.json()["id"]

    response = await client.post("/anthropometry/", json={
        "patient_id": patient_id,
        "date": "2023-01-01",
        "waist_cm": 90.0
    })
    assert response.status_code == 201

@pytest.mark.asyncio
async def test_create_subjective(client):
    p_resp = await client.post("/patients/", json={
        "full_name": "Subj Patient",
        "date_of_birth": "1990-01-01",
        "gender": "Masculino",
        "height_cm": 180.0
    })
    patient_id = p_resp.json()["id"]

    response = await client.post("/subjective/", json={
        "patient_id": patient_id,
        "date": "2023-01-01",
        "metric_name": "Sleep",
        "score": 8,
        "notes": "Good sleep"
    })
    assert response.status_code == 201

@pytest.mark.asyncio
async def test_read_patient(client):
    # Create a patient
    create_resp = await client.post("/patients/", json={
        "full_name": "Read Specific Patient",
        "date_of_birth": "1995-05-05",
        "gender": "Feminino",
        "height_cm": 170.0
    })
    patient_id = create_resp.json()["id"]

    # Read the patient
    response = await client.get(f"/patients/{patient_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Read Specific Patient"
    assert data["id"] == patient_id

@pytest.mark.asyncio
async def test_update_patient(client):
    # Create a patient
    create_resp = await client.post("/patients/", json={
        "full_name": "Update Patient",
        "date_of_birth": "1992-02-02",
        "gender": "Masculino",
        "height_cm": 175.0
    })
    patient_id = create_resp.json()["id"]

    # Update the patient
    response = await client.put(f"/patients/{patient_id}", json={
        "full_name": "Updated Patient Name",
        "height_cm": 176.0
    })
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Updated Patient Name"
    assert data["height_cm"] == 176.0

    # Verify update persist
    get_resp = await client.get(f"/patients/{patient_id}")
    assert get_resp.json()["full_name"] == "Updated Patient Name"

@pytest.mark.asyncio
async def test_delete_patient(client):
    # Create a patient
    create_resp = await client.post("/patients/", json={
        "full_name": "Delete Patient",
        "date_of_birth": "1993-03-03",
        "gender": "Feminino",
        "height_cm": 160.0
    })
    patient_id = create_resp.json()["id"]

    # Delete the patient
    response = await client.delete(f"/patients/{patient_id}")
    assert response.status_code == 204

    # Verify deletion
    get_resp = await client.get(f"/patients/{patient_id}")
    assert get_resp.status_code == 404

@pytest.mark.asyncio
async def test_read_lab_definitions(client):
    # Create a lab definition
    await client.post("/lab-definitions/", json={
        "name": "List Test Lab",
        "category": "List Category",
        "unit": "mg/L"
    })
    
    response = await client.get("/lab-definitions/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    names = [item["name"] for item in data]
    assert "List Test Lab" in names

@pytest.mark.asyncio
async def test_read_patient_lab_results(client):
    # Setup patient and lab def
    p_resp = await client.post("/patients/", json={
        "full_name": "Lab Results List Patient",
        "date_of_birth": "1990-01-01",
        "gender": "Masculino",
        "height_cm": 180.0
    })
    patient_id = p_resp.json()["id"]

    d_resp = await client.post("/lab-definitions/", json={
        "name": "Lab Result List Test",
        "category": "Test",
        "unit": "g"
    })
    def_id = d_resp.json()["id"]

    # Create result
    await client.post("/lab-results/", json={
        "patient_id": patient_id,
        "test_definition_id": def_id,
        "collection_date": "2023-01-01",
        "value": 50.0
    })

    response = await client.get(f"/patients/{patient_id}/lab-results/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["value"] == 50.0

@pytest.mark.asyncio
async def test_read_patient_bioimpedance(client):
    # Setup patient
    p_resp = await client.post("/patients/", json={
        "full_name": "Bio List Patient",
        "date_of_birth": "1990-01-01",
        "gender": "Feminino",
        "height_cm": 165.0
    })
    patient_id = p_resp.json()["id"]

    # Create bioimpedance entry
    await client.post("/bioimpedance/", json={
        "patient_id": patient_id,
        "date": "2023-01-01",
        "weight_kg": 60.0,
        "bmi": 22.0,
        "body_fat_percent": 20.0,
        "fat_mass_kg": 12.0,
        "muscle_mass_kg": 40.0
    })

    response = await client.get(f"/patients/{patient_id}/bioimpedance/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["weight_kg"] == 60.0

@pytest.mark.asyncio
async def test_read_patient_anthropometry(client):
    # Setup patient
    p_resp = await client.post("/patients/", json={
        "full_name": "Anthro List Patient",
        "date_of_birth": "1990-01-01",
        "gender": "Masculino",
        "height_cm": 180.0
    })
    patient_id = p_resp.json()["id"]

    # Create anthropometry entry
    await client.post("/anthropometry/", json={
        "patient_id": patient_id,
        "date": "2023-01-01",
        "waist_cm": 85.0
    })

    response = await client.get(f"/patients/{patient_id}/anthropometry/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["waist_cm"] == 85.0

@pytest.mark.asyncio
async def test_read_patient_subjective(client):
    # Setup patient
    p_resp = await client.post("/patients/", json={
        "full_name": "Subj List Patient",
        "date_of_birth": "1990-01-01",
        "gender": "Feminino",
        "height_cm": 160.0
    })
    patient_id = p_resp.json()["id"]

    # Create subjective entry
    await client.post("/subjective/", json={
        "patient_id": patient_id,
        "date": "2023-01-01",
        "metric_name": "Energy",
        "score": 9
    })

    response = await client.get(f"/patients/{patient_id}/subjective/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["metric_name"] == "Energy"

