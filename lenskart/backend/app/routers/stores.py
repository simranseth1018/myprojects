from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.store import Store, EyeTestBooking, BookingStatus
from app.schemas.user import EyeTestBookingIn, EyeTestBookingOut
from app.schemas.common import ApiResponse
from datetime import time
import uuid

router = APIRouter(tags=["stores"])


@router.get("/api/stores/nearby")
async def nearby_stores(pincode: str = Query(...), db: AsyncSession = Depends(get_db)):
    stores = (await db.execute(
        select(Store).where(Store.pincode == pincode, Store.is_active == True)
    )).scalars().all()

    return ApiResponse.ok(data=[{
        "id": str(s.id),
        "name": s.name,
        "address": s.address,
        "city": s.city or "",
        "state": s.state or "",
        "pincode": s.pincode or "",
        "phone": s.phone or "",
        "latitude": s.latitude or 0.0,
        "longitude": s.longitude or 0.0,
        "services": s.services.split(",") if s.services else [],
    } for s in stores])


@router.get("/api/eye-test/bookings")
async def get_bookings(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    bookings = (await db.execute(
        select(EyeTestBooking).where(EyeTestBooking.user_id == uuid.UUID(user_id))
        .order_by(EyeTestBooking.created_at.desc())
    )).scalars().all()
    return ApiResponse.ok(data=[EyeTestBookingOut.model_validate(b) for b in bookings])


@router.post("/api/eye-test/bookings", status_code=201)
async def create_booking(body: EyeTestBookingIn, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    booking_time = time.fromisoformat(body.booking_time) if isinstance(body.booking_time, str) else body.booking_time
    booking = EyeTestBooking(
        user_id=uuid.UUID(user_id),
        name=body.name, phone=body.phone, address=body.address,
        pincode=body.pincode, booking_date=body.booking_date,
        booking_time=booking_time, notes=body.notes,
        status=BookingStatus.PENDING,
    )
    db.add(booking)
    await db.flush()
    return ApiResponse.ok(data=EyeTestBookingOut.model_validate(booking), message="Booking confirmed")
