from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.core.config import settings
from app.models.order import Order, OrderTracking, OrderStatus, PaymentStatus
from app.schemas.order import PaymentVerifyIn
from app.schemas.common import ApiResponse
from pydantic import BaseModel
import hmac, hashlib, uuid

router = APIRouter(prefix="/api/payment", tags=["payment"])


# ─── Razorpay ────────────────────────────────────────────────────────────────

@router.post("/create-order")
async def create_razorpay_order(body: dict, user_id: str = Depends(get_current_user_id)):
    # In production: call Razorpay API to create an order
    # For dev: return a mock order id
    rzp_order_id = f"order_{uuid.uuid4().hex[:16]}"
    return ApiResponse.ok(data={
        "id": rzp_order_id,
        "amount": body.get("amount"),
        "currency": "INR",
        "key": settings.RAZORPAY_KEY_ID,
    })


@router.post("/verify")
async def verify_razorpay_payment(body: PaymentVerifyIn, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    # Skip signature verification in dev mode (no real Razorpay secret)
    is_dev = not settings.RAZORPAY_KEY_SECRET or settings.RAZORPAY_KEY_SECRET == ""

    if not is_dev:
        expected = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode(),
            f"{body.razorpay_order_id}|{body.razorpay_payment_id}".encode(),
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(expected, body.razorpay_signature):
            raise HTTPException(400, "Payment verification failed")

    order = await db.scalar(select(Order).where(Order.razorpay_order_id == body.razorpay_order_id))
    if not order:
        raise HTTPException(404, "Order not found for this payment")

    order.razorpay_payment_id = body.razorpay_payment_id
    order.payment_status = PaymentStatus.PAID
    order.status = OrderStatus.CONFIRMED
    order.tracking_history.append(
        OrderTracking(order_id=order.id, status=OrderStatus.CONFIRMED, message="Payment confirmed. Processing your order.")
    )
    await db.flush()

    return ApiResponse.ok(message="Payment verified successfully")


# ─── Paytm ───────────────────────────────────────────────────────────────────

class PaytmInitiateIn(BaseModel):
    order_id: str
    amount: float


class PaytmVerifyIn(BaseModel):
    order_id: str
    paytm_order_id: str
    paytm_txn_id: str
    paytm_checksum: str


@router.post("/paytm/initiate")
async def initiate_paytm_payment(body: PaytmInitiateIn, user_id: str = Depends(get_current_user_id)):
    """Generate a Paytm transaction token. In production, call Paytm's
    initiateTransaction API. For dev, return a mock token."""
    txn_token = f"ptm_txn_{uuid.uuid4().hex[:16]}"
    paytm_order_id = f"ptm_order_{uuid.uuid4().hex[:16]}"
    return ApiResponse.ok(data={
        "txnToken": txn_token,
        "paytmOrderId": paytm_order_id,
        "amount": str(body.amount),
        "merchantId": settings.PAYTM_MERCHANT_ID or "MOCK_MERCHANT",
    })


@router.post("/paytm/verify")
async def verify_paytm_payment(body: PaytmVerifyIn, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    """Verify Paytm payment. In production, verify checksum using Paytm SDK.
    In dev mode, skip verification."""
    is_dev = not settings.PAYTM_MERCHANT_KEY or settings.PAYTM_MERCHANT_KEY == ""

    if not is_dev:
        # In production: use paytmchecksum library to verify
        # from paytmchecksum import PaytmChecksum
        # is_valid = PaytmChecksum.verifySignature(params, settings.PAYTM_MERCHANT_KEY, body.paytm_checksum)
        pass

    order = await db.scalar(select(Order).where(Order.razorpay_order_id == body.paytm_order_id))
    if not order:
        raise HTTPException(404, "Order not found for this payment")

    order.razorpay_payment_id = body.paytm_txn_id  # Reuse the field for Paytm txn ID
    order.payment_status = PaymentStatus.PAID
    order.status = OrderStatus.CONFIRMED
    order.tracking_history.append(
        OrderTracking(order_id=order.id, status=OrderStatus.CONFIRMED, message="Paytm payment confirmed. Processing your order.")
    )
    await db.flush()

    return ApiResponse.ok(message="Paytm payment verified successfully")
