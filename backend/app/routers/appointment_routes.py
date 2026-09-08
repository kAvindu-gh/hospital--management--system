from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models import Appointment, AppointmentStatus, Doctor, User
from app.schemas import AppointmentCreate, AppointmentUpdate, AppointmentOut
from app.core.deps import require_role

router = APIRouter(prefix="/appointments", tags=["appointments"])


def serialize_appointment(appointment: Appointment) -> dict:
    return {
        "id": appointment.id,
        "patient_id": appointment.patient_id,
        "doctor_id": appointment.doctor_id,
        "patient_name": appointment.patient.full_name if appointment.patient else None,
        "doctor_name": appointment.doctor.full_name if appointment.doctor else None,
        "appointment_date": appointment.appointment_date,
        "reason": appointment.reason,
        "status": appointment.status,
        "created_at": appointment.created_at,
    }


@router.post("/", response_model=AppointmentOut, dependencies=[Depends(require_role("admin", "receptionist"))])
def create_appointment(appointment: AppointmentCreate, db: Session = Depends(get_db)):
    new_appointment = Appointment(**appointment.model_dump())
    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)
    return serialize_appointment(new_appointment)


@router.get("/", response_model=List[AppointmentOut], dependencies=[Depends(require_role("admin", "receptionist"))])
def list_appointments(status: Optional[AppointmentStatus] = None, db: Session = Depends(get_db)):
    query = db.query(Appointment)
    if status:
        query = query.filter(Appointment.status == status)
    appointments = query.order_by(Appointment.appointment_date.desc()).all()
    return [serialize_appointment(a) for a in appointments]


@router.get("/me", response_model=List[AppointmentOut])
def my_appointments(
    current_user: User = Depends(require_role("doctor")),
    db: Session = Depends(get_db),
):
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="No doctor profile linked to this account")
    appointments = (
        db.query(Appointment)
        .filter(Appointment.doctor_id == doctor.id)
        .order_by(Appointment.appointment_date.desc())
        .all()
    )
    return [serialize_appointment(a) for a in appointments]


@router.get("/{appointment_id}", response_model=AppointmentOut, dependencies=[Depends(require_role("admin", "receptionist", "doctor"))])
def get_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return serialize_appointment(appointment)


@router.put("/{appointment_id}", response_model=AppointmentOut, dependencies=[Depends(require_role("admin", "receptionist"))])
def update_appointment(appointment_id: int, appointment_update: AppointmentUpdate, db: Session = Depends(get_db)):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    update_data = appointment_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(appointment, field, value)

    db.commit()
    db.refresh(appointment)
    return serialize_appointment(appointment)