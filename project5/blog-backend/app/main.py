from fastapi import FastAPI

from app.database import Base, engine
from app.routes import auth, post, comment
from app import models  # 👈 IMPORTANT (registers models)

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(post.router, prefix="/posts", tags=["Posts"])
app.include_router(comment.router, prefix="/comments", tags=["Comments"])
