from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import User
from ..schemas import UserCreate
from ..auth import hash_password

router = APIRouter(prefix="/users")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    new_user = User(
        username=user.username,
        password=hash_password(user.password)
    )
    db.add(new_user)
    db.commit()
    return {"msg": "User created"}
