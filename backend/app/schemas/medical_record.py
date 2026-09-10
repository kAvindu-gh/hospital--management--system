from typing import Optional
from pydantic import BaseModel


class MedicalRecordCreate(BaseModel):
    diagnosis: Optional[str] = None
    prescription: Optional[str] = None
    notes: Optional[str] = None


class MedicalRecordUpdate(BaseModel):
    diagnosis: Optional[str] = None
    prescription: Optional[str] = None
    notes: Optional[str] = None


class MedicalRecordOut(BaseModel):
    id: int
    appointment_id: int
    diagnosis: Optional[str] = None
    prescription: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True