from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import Like

router = APIRouter(prefix="/likes")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/")
def like_post(post_id: int, user_id: int, db: Session = Depends(get_db)):
    like = Like(post_id=post_id, user_id=user_id)
    db.add(like)
    db.commit()
    return {"msg": "Post liked"}
