import random
from datetime import date, timedelta
from faker import Faker
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from models import Base, Patient, LabTestDefinition, LabResult, BioimpedanceEntry, SubjectiveEntry

# 1. SETUP SQLITE ENGINE
SQLITE_URL = "sqlite:///./local_medical.db"
engine = create_engine(SQLITE_URL)

# 2. CREATE TABLES
Base.metadata.drop_all(engine) # Reset DB for clean state
Base.metadata.create_all(engine)

fake = Faker(['pt_BR'])

def seed_matrix(session: Session):
    """Seeds the LabTestDefinition table with data derived from your Matrix.xlsx"""
    print("Seeding Matrix definitions...")
    
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
    session.commit()

def generate_patients(session: Session, count=5):
    print(f"Generating {count} patients with history...")
    lab_defs = session.scalars(select(LabTestDefinition)).all()

    for _ in range(count):
        # Create Patient
        sex = random.choice(["Masculino", "Feminino"])
        p = Patient(
            full_name=fake.name_male() if sex == "Masculino" else fake.name_female(),
            date_of_birth=fake.date_of_birth(minimum_age=25, maximum_age=55),
            gender=sex,
            height_cm=random.randint(165, 190) if sex == "Masculino" else random.randint(155, 175)
        )
        session.add(p)
        session.flush()

        # Simulate 3 monthly visits
        base_weight = random.uniform(60, 95)
        start_date = date.today() - timedelta(days=90)

        for i in range(3):
            visit_date = start_date + timedelta(days=i*30)
            
            # 1. Bioimpedance
            curr_weight = base_weight + random.uniform(-1.5, 0.5) # Losing weight slightly
            bmi = curr_weight / ((p.height_cm/100)**2)
            fat_pct = random.uniform(18, 28)
            fat_mass = curr_weight * (fat_pct / 100.0)
            
            session.add(BioimpedanceEntry(
                patient_id=p.id, date=visit_date,
                weight_kg=round(curr_weight, 2), bmi=round(bmi, 1),
                body_fat_percent=round(fat_pct, 1),
                fat_mass_kg=round(fat_mass, 1),
                muscle_mass_kg=round(curr_weight * 0.4, 1),
                visceral_fat_level=random.randint(3, 10),
                basal_metabolic_rate_kcal=int(curr_weight * 22)
            ))

            # 2. Lab Results (Random subset)
            tests = random.sample(lab_defs, k=4)
            for t in tests:
                # Logic to determine flag
                min_ref = t.ref_min_male if sex == "Masculino" else t.ref_min_female
                max_ref = t.ref_max_male if sex == "Masculino" else t.ref_max_female
                
                # 80% chance normal, 20% abnormal
                if random.random() < 0.8:
                    val = random.uniform(min_ref, max_ref)
                    flag = "Normal"
                else:
                    val = max_ref * random.uniform(1.05, 1.3)
                    flag = "Alto"
                
                session.add(LabResult(
                    patient_id=p.id, test_definition_id=t.id,
                    collection_date=visit_date, value=round(val, 2), flag=flag
                ))

            # 3. Subjective Data (Weekly logs for that month)
            for w in range(4):
                log_date = visit_date + timedelta(days=w*7)
                session.add(SubjectiveEntry(patient_id=p.id, date=log_date, metric_name="Sono", score=random.randint(5, 9)))
                session.add(SubjectiveEntry(patient_id=p.id, date=log_date, metric_name="Energia", score=random.randint(4, 8)))

    session.commit()
    print("Success! Database 'local_medical.db' created.")

if __name__ == "__main__":
    with Session(engine) as session:
        seed_matrix(session)
        generate_patients(session)