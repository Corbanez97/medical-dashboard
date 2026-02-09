import random
import asyncio
from datetime import date, timedelta
from faker import Faker
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from models import Base, Patient, LabTestDefinition, LabResult, BioimpedanceEntry, SubjectiveEntry, AnthropometryEntry
from config import settings

# 1. SETUP ASYNC ENGINE
# Handle SQLite vs Postgres specific args
connect_args = {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}

engine = create_async_engine(
    settings.DATABASE_URL, 
    echo=True,
    connect_args=connect_args
)

async_session_factory = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

fake = Faker(['pt_BR'])

async def seed_matrix(session: AsyncSession):
    """Seeds the LabTestDefinition table with data derived from your Matrix.xlsx"""
    print("Seeding Matrix definitions...")
    
    # Check if definitions already exist
    existing = await session.execute(select(LabTestDefinition))
    if existing.scalars().first():
        print("Definitions already exist. Skipping.")
        return

    definitions = [
        {"name": "Hemoglobina", "unit": "g/dL", "cat": "Hemograma", "min_m": 12.5, "max_m": 17.0, "min_f": 11.5, "max_f": 15.0},
        {"name": "Glicemia em jejum", "unit": "mg/dL", "cat": "Metabólica", "min_m": 70, "max_m": 99, "min_f": 70, "max_f": 99},
        {"name": "Colesterol Total", "unit": "mg/dL", "cat": "Perfil Lipídico", "min_m": 0, "max_m": 199, "min_f": 0, "max_f": 199},
        {"name": "Triglicerídeos", "unit": "mg/dL", "cat": "Perfil Lipídico", "min_m": 0, "max_m": 150, "min_f": 0, "max_f": 150},
        {"name": "Testosterona Total", "unit": "ng/dL", "cat": "Hormônios", "min_m": 175, "max_m": 781, "min_f": 15, "max_f": 70},
        {"name": "Vitamina D", "unit": "ng/mL", "cat": "Vitaminas", "min_m": 30, "max_m": 100, "min_f": 30, "max_f": 100},
        {"name": "Creatinina", "unit": "mg/dL", "cat": "Função Renal", "min_m": 0.7, "max_m": 1.3, "min_f": 0.6, "max_f": 1.1},
        {"name": "TGO (AST)", "unit": "U/L", "cat": "Função Hepática", "min_m": 11, "max_m": 34, "min_f": 10, "max_f": 34},
    ]

    for d in definitions:
        new_test = LabTestDefinition(
            name=d["name"], category=d["cat"], unit=d["unit"],
            ref_min_male=d["min_m"], ref_max_male=d["max_m"],
            ref_min_female=d["min_f"], ref_max_female=d["max_f"]
        )
        session.add(new_test)
    await session.commit()

async def generate_patients(session: AsyncSession, count=20):
    print(f"Generating {count} patients with history...")
    result = await session.execute(select(LabTestDefinition))
    lab_defs = result.scalars().all()

    for _ in range(count):
        # Create Patient
        sex = random.choice(["Masculino", "Feminino"])
        p = Patient(
            full_name=fake.name_male() if sex == "Masculino" else fake.name_female(),
            date_of_birth=fake.date_of_birth(minimum_age=25, maximum_age=65),
            gender=sex,
            height_cm=random.randint(165, 190) if sex == "Masculino" else random.randint(155, 175)
        )
        session.add(p)
        await session.flush() # flush to get p.id

        # Simulate 6 monthly visits for more history
        base_weight = random.uniform(55, 100)
        start_date = date.today() - timedelta(days=180)

        for i in range(6):
            visit_date = start_date + timedelta(days=i*30)
            
            # 1. Bioimpedance
            curr_weight = base_weight + random.uniform(-2.0, 1.0) # Fluctuating weight
            bmi = curr_weight / ((p.height_cm/100)**2)
            
            # Male/Female difference in body fat
            if sex == "Masculino":
                fat_pct = random.uniform(15, 25)
            else:
                fat_pct = random.uniform(22, 32)
                
            fat_mass = curr_weight * (fat_pct / 100.0)
            muscle_mass = curr_weight * (0.4 if sex == "Masculino" else 0.35)
            
            session.add(BioimpedanceEntry(
                patient_id=p.id, date=visit_date,
                weight_kg=round(curr_weight, 2), bmi=round(bmi, 1),
                body_fat_percent=round(fat_pct, 1),
                fat_mass_kg=round(fat_mass, 1),
                muscle_mass_kg=round(muscle_mass, 1),
                visceral_fat_level=random.randint(3, 10),
                basal_metabolic_rate_kcal=int(curr_weight * 22)
            ))
            
            # 2. Anthropometry (New!)
            session.add(AnthropometryEntry(
                patient_id=p.id, date=visit_date,
                waist_cm=random.uniform(70, 100),
                abdomen_cm=random.uniform(75, 105),
                hips_cm=random.uniform(90, 110),
                right_arm_cm=random.uniform(25, 35),
                left_arm_cm=random.uniform(25, 35),
                right_thigh_cm=random.uniform(45, 60),
                left_thigh_cm=random.uniform(45, 60)
            ))

            # 3. Lab Results (Random subset)
            tests = random.sample(lab_defs, k=5)
            for t in tests:
                # Logic to determine flag
                min_ref = t.ref_min_male if sex == "Masculino" else t.ref_min_female
                max_ref = t.ref_max_male if sex == "Masculino" else t.ref_max_female
                
                # Handling null refs for some tests
                if min_ref is None: min_ref = 0
                if max_ref is None: max_ref = 100

                # 85% chance normal, 15% abnormal
                if random.random() < 0.85:
                    val = random.uniform(min_ref, max_ref)
                    flag = "Normal"
                else:
                    # Randomly high or low
                    if random.random() < 0.5:
                        val = max_ref * random.uniform(1.05, 1.2)
                        flag = "Alto"
                    else:
                        val = min_ref * random.uniform(0.8, 0.95)
                        flag = "Baixo"
                
                session.add(LabResult(
                    patient_id=p.id, test_definition_id=t.id,
                    collection_date=visit_date, value=round(val, 2), flag=flag
                ))

            # 4. Subjective Data (Weekly logs for that month)
            for w in range(4):
                log_date = visit_date + timedelta(days=w*7)
                session.add(SubjectiveEntry(patient_id=p.id, date=log_date, metric_name="Sono", score=random.randint(4, 9)))
                session.add(SubjectiveEntry(patient_id=p.id, date=log_date, metric_name="Energia", score=random.randint(5, 10)))
                session.add(SubjectiveEntry(patient_id=p.id, date=log_date, metric_name="Humor", score=random.randint(5, 10)))

    await session.commit()
    print("Success! Database populated.")

async def main():
    # 2. CREATE TABLES (Dropping all to be safe for a seed script)
    print("Resetting database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    # 3. RUN SEED
    async with async_session_factory() as session:
        await seed_matrix(session)
        await generate_patients(session, count=15) # Generating 15 diverse patients

if __name__ == "__main__":
    asyncio.run(main())