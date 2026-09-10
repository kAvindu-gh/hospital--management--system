from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models import AppointmentStatus, Doctor, Department, User, UserRole
from app.schemas import DoctorCreate, DoctorUpdate, DoctorOut, DepartmentCreate, DepartmentOut
from app.core.deps import require_role

router = APIRouter(tags=["doctors"])


@router.post("/departments/", response_model=DepartmentOut, dependencies=[Depends(require_role("admin"))])
def create_department(department: DepartmentCreate, db: Session = Depends(get_db)):
    existing = db.query(Department).filter(Department.name == department.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department already exists")
    new_department = Department(name=department.name)
    db.add(new_department)
    db.commit()
    db.refresh(new_department)
    return new_department


@router.get("/departments/", response_model=List[DepartmentOut], dependencies=[Depends(require_role("admin", "doctor", "receptionist"))])
def list_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()


@router.delete("/departments/{department_id}", dependencies=[Depends(require_role("admin"))])
def delete_department(department_id: int, db: Session = Depends(get_db)):
    department = db.query(Department).filter(Department.id == department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    if department.doctors:
        raise HTTPException(status_code=400, detail="Reassign or remove the doctors in this department first")

    db.delete(department)
    db.commit()
    return {"detail": "Department deleted successfully"}


@router.post("/doctors/", response_model=DoctorOut, dependencies=[Depends(require_role("admin"))])
def create_doctor(doctor: DoctorCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == doctor.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role.value != UserRole.doctor.value:
        raise HTTPException(status_code=400, detail="Selected user does not have the doctor role")
    if doctor.department_id is not None:
        department = db.query(Department).filter(Department.id == doctor.department_id).first()
        if not department:
            raise HTTPException(status_code=404, detail="Department not found")

    existing_profile = db.query(Doctor).filter(Doctor.user_id == doctor.user_id).first()
    if existing_profile:
        raise HTTPException(status_code=400, detail="This user already has a doctor profile")

    new_doctor = Doctor(**doctor.model_dump())
    db.add(new_doctor)
    db.commit()
    db.refresh(new_doctor)
    return new_doctor


@router.get("/doctors/", response_model=List[DoctorOut], dependencies=[Depends(require_role("admin", "receptionist"))])
def list_doctors(db: Session = Depends(get_db)):
    return db.query(Doctor).all()


@router.get("/doctors/{doctor_id}", response_model=DoctorOut, dependencies=[Depends(require_role("admin", "receptionist"))])
def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor


@router.put("/doctors/{doctor_id}", response_model=DoctorOut, dependencies=[Depends(require_role("admin"))])
def update_doctor(doctor_id: int, doctor_update: DoctorUpdate, db: Session = Depends(get_db)):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    update_data = doctor_update.model_dump(exclude_unset=True)
    if "department_id" in update_data and update_data["department_id"] is not None:
        department = db.query(Department).filter(Department.id == update_data["department_id"]).first()
        if not department:
            raise HTTPException(status_code=404, detail="Department not found")

    for field, value in update_data.items():
        setattr(doctor, field, value)

    db.commit()
    db.refresh(doctor)
    return doctor


@router.delete("/doctors/{doctor_id}", dependencies=[Depends(require_role("admin"))])
def delete_doctor(doctor_id: int, db: Session = Depends(get_db)):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    scheduled_appointments = [
        appointment for appointment in doctor.appointments
        if appointment.status == AppointmentStatus.scheduled
    ]
    if scheduled_appointments:
        raise HTTPException(
            status_code=400,
            detail="This doctor has scheduled appointments. Cancel or reassign them before deleting the doctor profile.",
        )

    for appointment in doctor.appointments:
        if appointment.medical_record:
            db.delete(appointment.medical_record)
        if appointment.invoice:
            db.delete(appointment.invoice)
        db.delete(appointment)

    db.delete(doctor)
    db.commit()
    return {"detail": "Doctor deleted successfully"}