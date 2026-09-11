from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel
from app.models import InvoiceStatus


class InvoiceCreate(BaseModel):
    appointment_id: int
    amount: Decimal


class InvoiceOut(BaseModel):
    id: int
    appointment_id: int
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    amount: Decimal
    status: InvoiceStatus
    created_at: datetime

    class Config:
        from_attributes = True