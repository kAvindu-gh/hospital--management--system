from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models import Patient
from app.schemas import PatientCreate, PatientUpdate, PatientOut
from app.core.deps import require_role

router = APIRouter(prefix="/patients", tags=["patients"])


@router.post("/", response_model=PatientOut, dependencies=[Depends(require_role("admin", "receptionist"))])
def create_patient(patient: PatientCreate, db: Session = Depends(get_db)):
    new_patient = Patient(**patient.model_dump())
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    return new_patient


@router.get("/", response_model=List[PatientOut], dependencies=[Depends(require_role("admin", "receptionist"))])
def list_patients(search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Patient)
    if search:
        query = query.filter(Patient.full_name.ilike(f"%{search}%"))
    return query.order_by(Patient.created_at.desc()).all()


@router.get("/{patient_id}", response_model=PatientOut, dependencies=[Depends(require_role("admin", "receptionist"))])
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.put("/{patient_id}", response_model=PatientOut, dependencies=[Depends(require_role("admin", "receptionist"))])
def update_patient(patient_id: int, patient_update: PatientUpdate, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    update_data = patient_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(patient, field, value)

    db.commit()
    db.refresh(patient)
    return patient


@router.delete("/{patient_id}", dependencies=[Depends(require_role("admin"))])
def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.delete(patient)
    db.commit()
    return {"detail": "Patient deleted successfully"}