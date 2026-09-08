from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.session import engine, Base
from app import models  # noqa: F401 — ensures all models register before create_all
from app.routers import auth_routes
from app.routers import auth_routes, patient_routes
from app.routers import auth_routes, patient_routes, doctor_routes, appointment_routes

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Hospital Management System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(patient_routes.router)
app.include_router(doctor_routes.router)
app.include_router(appointment_routes.router)


@app.get("/")
def read_root():
    return {"message": "HMS API is running"}