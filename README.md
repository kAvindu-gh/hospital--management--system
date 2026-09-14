# Hospital Management System (HMS)

A full-stack Hospital Management System built as a pre-internship assignment, implementing core hospital operations with role-based access control.

## Overview

HMS centralizes patient registration, doctor and department management, appointment scheduling, electronic medical records, and billing into a single web portal. Access is scoped by role (Admin, Doctor, Receptionist) so each user only sees and can act on what's relevant to their job.

## Tech Stack

**Backend**
- Python + FastAPI
- PostgreSQL + SQLAlchemy (ORM)
- JWT-based authentication (`python-jose`, `passlib`/bcrypt)
- Pydantic for request/response validation

**Frontend**
- HTML, CSS, and vanilla JavaScript
- No framework — plain `fetch()` calls against the FastAPI backend

**Testing & CI**
- pytest + FastAPI `TestClient`, with an isolated in-memory SQLite database per test run
- GitHub Actions — tests run automatically against a throwaway Postgres service on every push to `main`

## Features Implemented

| Module | Description |
|---|---|
| User Management | Registration (Doctor/Receptionist self-registration; Admin is bootstrap-only), login, JWT-based sessions, role-based access control |
| Patient Management | Add, edit, search, and view patient records |
| Doctor Management | Department and doctor profile management (Admin) |
| Appointment Scheduling | Book, complete, and cancel appointments; doctors can view their own upcoming appointments |
| Electronic Medical Records | Doctors record diagnosis, prescription, and notes per appointment; full patient history view |
| Billing | Generate invoices per appointment and mark them as paid |

## Project Structure

```
Hospital Management System/
├── backend/
│   ├── app/
│   │   ├── core/          # config, security (hashing/JWT), access-control dependencies
│   │   ├── database/      # SQLAlchemy engine/session setup
│   │   ├── models/        # SQLAlchemy models, one file per entity
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   ├── routers/       # API route modules
│   │   └── main.py
│   ├── tests/              # pytest suite
│   └── requirements.txt
├── frontend/
│   ├── pages/              # HTML screens
│   ├── css/
│   └── js/
└── .github/workflows/       # CI configuration
```

## Setup

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

Create a `.env` file in `backend/` with:
```
database_url=postgresql://postgres:your_password@localhost:5432/hms_db
secret_key=your_generated_secret
algorithm=HS256
access_token_expire_minutes=480
```

Create the database in PostgreSQL:
```sql
CREATE DATABASE hms_db;
```

Run the server:
```bash
uvicorn app.main:app --reload
```
API docs available at `http://localhost:8000/docs`.

### Frontend
```bash
cd frontend
python -m http.server 5500
```
Visit `http://localhost:5500/pages/login.html`.

### Tests
```bash
cd backend
pytest -v
```

## Access Control

Three roles: **Admin**, **Doctor**, **Receptionist**. Admin accounts cannot be self-registered — they're bootstrapped directly in the database to prevent privilege escalation. Every route that touches sensitive data enforces role checks at the API layer, not just hidden in the UI.

## Deferred / Future Enhancements

Scoped out to keep the build focused within the assignment timeline: Laboratory Management, Pharmacy Management, Staff Attendance/Leave, formal report generation, document uploads on patient records, and live deployment. The underlying data model already supports most of these without schema changes.

## Author

Kavindu — Second-year Software Engineering undergraduate, Informatics Institute of Technology (IIT).