from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models import AppointmentStatus


class AppointmentCreate(BaseModel):
    patient_id: int
    doctor_id: int
    appointment_date: datetime
    reason: Optional[str] = None


class AppointmentUpdate(BaseModel):
    appointment_date: Optional[datetime] = None
    reason: Optional[str] = None
    status: Optional[AppointmentStatus] = None


class AppointmentOut(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    appointment_date: datetime
    reason: Optional[str] = None
    status: AppointmentStatus
    created_at: datetime

    class Config:
        from_attributes = True