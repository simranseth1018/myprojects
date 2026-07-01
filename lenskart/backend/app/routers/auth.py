from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token, get_current_user_id
from app.core.config import settings
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, RegisterRequest, GoogleLoginRequest, RefreshRequest, AuthResponse, UserOut
from app.schemas.common import ApiResponse
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests
import uuid

router = APIRouter(prefix="/api/auth", tags=["auth"])

EXPIRES_IN = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60


def _build_auth_response(user: User, access: str, refresh: str) -> AuthResponse:
    return AuthResponse(
        accessToken=access,
        refreshToken=refresh,
        expiresIn=EXPIRES_IN,
        user=UserOut.model_validate(user),
    )


def _create_tokens(user: User):
    access = create_access_token(str(user.id), user.role.value)
    refresh = create_refresh_token(str(user.id))
    return access, refresh


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.scalar(select(User).where(User.email == body.email))
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        full_name=body.full_name,
        phone=body.phone,
        role=UserRole.CUSTOMER,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    access, refresh = _create_tokens(user)
    user.refresh_token = refresh
    await db.flush()
    return ApiResponse.ok(data=_build_auth_response(user, access, refresh), message="Account created successfully")


@router.post("/login")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.email == body.email))
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access, refresh = _create_tokens(user)
    user.refresh_token = refresh
    await db.flush()
    return ApiResponse.ok(data=_build_auth_response(user, access, refresh))


@router.post("/google")
async def google_login(body: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        info = google_id_token.verify_oauth2_token(
            body.id_token, google_requests.Request(), settings.GOOGLE_CLIENT_ID
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    google_id = info["sub"]
    email = info.get("email", "")
    name = info.get("name", "")
    picture = info.get("picture")

    user = await db.scalar(select(User).where(User.google_id == google_id))
    if not user:
        user = await db.scalar(select(User).where(User.email == email))
        if user:
            user.google_id = google_id
            if not user.avatar_url:
                user.avatar_url = picture
            await db.flush()
        else:
            user = User(email=email, full_name=name, google_id=google_id,
                        avatar_url=picture, email_verified=True, role=UserRole.CUSTOMER)
            db.add(user)
            await db.flush()
            await db.refresh(user)

    access, refresh = _create_tokens(user)
    user.refresh_token = refresh
    await db.flush()
    return ApiResponse.ok(data=_build_auth_response(user, access, refresh))


@router.post("/refresh")
async def refresh_token(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(body.refresh_token)
    user = await db.get(User, uuid.UUID(payload["sub"]))
    if not user or user.refresh_token != body.refresh_token:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    access, refresh = _create_tokens(user)
    user.refresh_token = refresh
    await db.flush()
    return ApiResponse.ok(data=_build_auth_response(user, access, refresh))


@router.post("/logout")
async def logout(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    user = await db.get(User, uuid.UUID(user_id))
    if user:
        user.refresh_token = None
        await db.flush()
    return ApiResponse.ok(message="Logged out")
