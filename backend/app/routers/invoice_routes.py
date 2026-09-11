from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models import Invoice, Appointment, InvoiceStatus
from app.schemas import InvoiceCreate, InvoiceOut
from app.core.deps import require_role

router = APIRouter(prefix="/invoices", tags=["billing"])


def serialize_invoice(invoice: Invoice) -> dict:
    return {
        "id": invoice.id,
        "appointment_id": invoice.appointment_id,
        "patient_name": invoice.appointment.patient.full_name if invoice.appointment and invoice.appointment.patient else None,
        "doctor_name": invoice.appointment.doctor.full_name if invoice.appointment and invoice.appointment.doctor else None,
        "amount": invoice.amount,
        "status": invoice.status,
        "created_at": invoice.created_at,
    }


@router.post("/", response_model=InvoiceOut, dependencies=[Depends(require_role("admin", "receptionist"))])
def create_invoice(invoice: InvoiceCreate, db: Session = Depends(get_db)):
    appointment = db.query(Appointment).filter(Appointment.id == invoice.appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    existing = db.query(Invoice).filter(Invoice.appointment_id == invoice.appointment_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="An invoice already exists for this appointment")

    new_invoice = Invoice(appointment_id=invoice.appointment_id, amount=invoice.amount)
    db.add(new_invoice)
    db.commit()
    db.refresh(new_invoice)
    return serialize_invoice(new_invoice)


@router.get("/", response_model=List[InvoiceOut], dependencies=[Depends(require_role("admin", "receptionist"))])
def list_invoices(db: Session = Depends(get_db)):
    invoices = db.query(Invoice).order_by(Invoice.created_at.desc()).all()
    return [serialize_invoice(i) for i in invoices]


@router.get("/{invoice_id}", response_model=InvoiceOut, dependencies=[Depends(require_role("admin", "receptionist"))])
def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return serialize_invoice(invoice)


@router.put("/{invoice_id}/pay", response_model=InvoiceOut, dependencies=[Depends(require_role("admin", "receptionist"))])
def mark_invoice_paid(invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if invoice.status == InvoiceStatus.paid:
        raise HTTPException(status_code=400, detail="Invoice is already marked as paid")
    setattr(invoice, "status", InvoiceStatus.paid)
    db.commit()
    db.refresh(invoice)
    return serialize_invoice(invoice)