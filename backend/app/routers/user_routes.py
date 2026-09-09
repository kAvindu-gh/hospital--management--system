from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models import User, UserRole
from app.schemas import UserOut
from app.core.deps import require_role

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=List[UserOut], dependencies=[Depends(require_role("admin"))])
def list_users(role: Optional[UserRole] = None, db: Session = Depends(get_db)):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.all()