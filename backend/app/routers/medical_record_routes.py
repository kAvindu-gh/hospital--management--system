from fastapi import APIRouter, Depends, HTTPException
from typing import cast
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models import MedicalRecord, Appointment, Doctor, User
from app.schemas import MedicalRecordCreate, MedicalRecordUpdate, MedicalRecordOut
from app.core.deps import require_role, get_current_user

router = APIRouter(tags=["medical records"])


def get_doctor_profile_or_403(current_user: User, db: Session) -> Doctor:
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="No doctor profile linked to this account")
    return doctor


def get_owned_appointment_or_403(appointment_id: int, doctor: Doctor, db: Session) -> Appointment:
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if cast(int, appointment.doctor_id) != cast(int, doctor.id):
        raise HTTPException(status_code=403, detail="You can only record for your own appointments")
    return appointment


@router.post(
    "/appointments/{appointment_id}/medical-record",
    response_model=MedicalRecordOut,
)
def create_medical_record(
    appointment_id: int,
    record: MedicalRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("doctor")),
):
    doctor = get_doctor_profile_or_403(current_user, db)
    appointment = get_owned_appointment_or_403(appointment_id, doctor, db)

    existing = db.query(MedicalRecord).filter(MedicalRecord.appointment_id == appointment_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="A record already exists for this appointment — use update instead")

    new_record = MedicalRecord(appointment_id=appointment_id, **record.model_dump())
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record


@router.put(
    "/appointments/{appointment_id}/medical-record",
    response_model=MedicalRecordOut,
)
def update_medical_record(
    appointment_id: int,
    record_update: MedicalRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("doctor")),
):
    doctor = get_doctor_profile_or_403(current_user, db)
    get_owned_appointment_or_403(appointment_id, doctor, db)

    record = db.query(MedicalRecord).filter(MedicalRecord.appointment_id == appointment_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="No record exists yet for this appointment — create one first")

    update_data = record_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)
    return record


@router.get(
    "/appointments/{appointment_id}/medical-record",
    response_model=MedicalRecordOut,
    dependencies=[Depends(require_role("admin", "doctor", "receptionist"))],
)
def get_medical_record(appointment_id: int, db: Session = Depends(get_db)):
    record = db.query(MedicalRecord).filter(MedicalRecord.appointment_id == appointment_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="No record exists for this appointment yet")
    return record


@router.get(
    "/patients/{patient_id}/history",
    response_model=list[MedicalRecordOut],
    dependencies=[Depends(require_role("admin", "doctor", "receptionist"))],
)
def get_patient_history(patient_id: int, db: Session = Depends(get_db)):
    return (
        db.query(MedicalRecord)
        .join(Appointment, Appointment.id == MedicalRecord.appointment_id)
        .filter(Appointment.patient_id == patient_id)
        .order_by(Appointment.appointment_date.desc())
        .all()
    )