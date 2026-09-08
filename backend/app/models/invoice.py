import enum
from datetime import datetime
from sqlalchemy import Column, Integer, ForeignKey, Enum, Numeric, DateTime
from sqlalchemy.orm import relationship

from app.database.session import Base


class InvoiceStatus(str, enum.Enum):
    unpaid = "unpaid"
    paid = "paid"


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), unique=True, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.unpaid)
    created_at = Column(DateTime, default=datetime.utcnow)

    appointment = relationship("Appointment", back_populates="invoice")