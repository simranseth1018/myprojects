from pydantic import BaseModel

class UserCreate(BaseModel):
    username: str
    password: str

class PostCreate(BaseModel):
    title: str
    content: str

class CommentCreate(BaseModel):
    text: str
