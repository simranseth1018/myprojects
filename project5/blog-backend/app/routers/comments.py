from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import SessionLocal
from ..models import Comment
from ..schemas import CommentCreate

router = APIRouter(prefix="/comments")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/")
def add_comment(comment: CommentCreate, post_id: int, user_id: int, db: Session = Depends(get_db)):
    c = Comment(text=comment.text, post_id=post_id, user_id=user_id)
    db.add(c)
    db.commit()
    return c
