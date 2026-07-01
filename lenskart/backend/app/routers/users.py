from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.user import User, Address, Prescription, AddressType
from app.models.wishlist import Wishlist
from app.models.product import Product
from app.models.review import Review
from app.models.store import EyeTestBooking, BookingStatus
from app.schemas.auth import UserOut
from app.schemas.user import UpdateProfileIn, AddressIn, AddressOut, PrescriptionIn, PrescriptionOut, EyeTestBookingIn, EyeTestBookingOut
from app.schemas.product import ReviewIn, ReviewOut
from app.schemas.common import ApiResponse
from datetime import datetime, time
import uuid

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me")
async def get_profile(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    user = await db.get(User, uuid.UUID(user_id))
    if not user:
        raise HTTPException(404, "User not found")
    return ApiResponse.ok(data=UserOut.model_validate(user))


@router.put("/me")
async def update_profile(body: UpdateProfileIn, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    user = await db.get(User, uuid.UUID(user_id))
    if body.full_name: user.full_name = body.full_name
    if body.phone: user.phone = body.phone
    if body.avatar_url: user.avatar_url = body.avatar_url
    return ApiResponse.ok(data=UserOut.model_validate(user))


@router.get("/me/addresses")
async def get_addresses(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    addrs = (await db.execute(select(Address).where(Address.user_id == uuid.UUID(user_id)))).scalars().all()
    return ApiResponse.ok(data=[AddressOut.model_validate(a) for a in addrs])


@router.post("/me/addresses")
async def add_address(body: AddressIn, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    uid = uuid.UUID(user_id)
    if body.is_default:
        existing = (await db.execute(select(Address).where(Address.user_id == uid))).scalars().all()
        for a in existing:
            a.is_default = False

    addr = Address(
        user_id=uid, name=body.name, phone=body.phone,
        address_line1=body.address_line1, address_line2=body.address_line2,
        city=body.city, state=body.state, pincode=body.pincode,
        type=AddressType(body.type.upper()) if body.type else AddressType.HOME,
        is_default=bool(body.is_default),
    )
    db.add(addr)
    await db.flush()
    return ApiResponse.ok(data=AddressOut.model_validate(addr))


@router.put("/me/addresses/{address_id}")
async def update_address(address_id: uuid.UUID, body: AddressIn,
                         user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    uid = uuid.UUID(user_id)
    addr = await db.scalar(select(Address).where(Address.id == address_id, Address.user_id == uid))
    if not addr:
        raise HTTPException(404, "Address not found")
    for field, val in body.model_dump(exclude_none=True).items():
        setattr(addr, field, val)
    return ApiResponse.ok(data=AddressOut.model_validate(addr))


@router.delete("/me/addresses/{address_id}")
async def delete_address(address_id: uuid.UUID, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    uid = uuid.UUID(user_id)
    await db.execute(delete(Address).where(Address.id == address_id, Address.user_id == uid))
    return ApiResponse.ok(message="Address deleted")


@router.get("/me/wishlist")
async def get_wishlist(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import selectinload
    items = (await db.execute(
        select(Wishlist).where(Wishlist.user_id == uuid.UUID(user_id))
        .options(selectinload(Wishlist.product))
    )).scalars().all()
    return ApiResponse.ok(data=[{"id": str(w.id), "product_id": str(w.product_id), "created_at": w.created_at} for w in items])


@router.post("/me/wishlist/toggle")
async def toggle_wishlist(body: dict, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    uid = uuid.UUID(user_id)
    product_id = uuid.UUID(body["productId"])
    existing = await db.scalar(select(Wishlist).where(Wishlist.user_id == uid, Wishlist.product_id == product_id))
    if existing:
        await db.delete(existing)
        return ApiResponse.ok(data={"added": False})
    else:
        db.add(Wishlist(user_id=uid, product_id=product_id))
        return ApiResponse.ok(data={"added": True})


@router.get("/me/prescriptions")
async def get_prescriptions(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    rxs = (await db.execute(
        select(Prescription).where(Prescription.user_id == uuid.UUID(user_id)).order_by(Prescription.created_at.desc())
    )).scalars().all()
    return ApiResponse.ok(data=[PrescriptionOut.model_validate(r) for r in rxs])


@router.post("/me/prescriptions")
async def add_prescription(body: PrescriptionIn, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    rx = Prescription(user_id=uuid.UUID(user_id), **body.model_dump(exclude_none=True))
    db.add(rx)
    await db.flush()
    return ApiResponse.ok(data=PrescriptionOut.model_validate(rx))


@router.delete("/me/prescriptions/{rx_id}")
async def delete_prescription(rx_id: uuid.UUID, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    await db.execute(delete(Prescription).where(Prescription.id == rx_id, Prescription.user_id == uuid.UUID(user_id)))
    return ApiResponse.ok(message="Prescription deleted")


@router.post("/me/reviews")
async def submit_review(body: ReviewIn, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    uid = uuid.UUID(user_id)
    existing = await db.scalar(select(Review).where(Review.product_id == body.product_id, Review.user_id == uid))
    if existing:
        raise HTTPException(400, "You have already reviewed this product")
    user = await db.get(User, uid)
    review = Review(product_id=body.product_id, user_id=uid, user_name=user.full_name,
                    rating=body.rating, title=body.title, body=body.body)
    db.add(review)
    await db.flush()
    return ApiResponse.ok(data=ReviewOut.model_validate(review))
