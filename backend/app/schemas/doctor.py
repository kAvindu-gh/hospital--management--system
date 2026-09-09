from typing import Optional
from pydantic import BaseModel


class DepartmentCreate(BaseModel):
    name: str


class DepartmentOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class DoctorCreate(BaseModel):
    user_id: int
    department_id: Optional[int] = None
    full_name: str
    specialization: Optional[str] = None


class DoctorUpdate(BaseModel):
    department_id: Optional[int] = None
    full_name: Optional[str] = None
    specialization: Optional[str] = None


class DoctorOut(BaseModel):
    id: int
    user_id: int
    department_id: Optional[int] = None
    full_name: str
    specialization: Optional[str] = None

    class Config:
        from_attributes = True