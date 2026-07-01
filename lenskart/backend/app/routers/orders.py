from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.order import Order, OrderItem, OrderTracking, OrderStatus, PaymentStatus
from app.models.cart import Cart, CartItem
from app.models.product import Product, ProductImage
from app.models.user import User, Address
from app.schemas.order import PlaceOrderIn, PaymentVerifyIn, OrderOut, OrderItemOut, TrackingOut, ShippingAddress
from app.schemas.common import ApiResponse, PageResponse
from decimal import Decimal
from datetime import datetime, timezone, timedelta
import math, uuid, random, string, hmac, hashlib

router = APIRouter(prefix="/api/orders", tags=["orders"])


def _gen_order_number() -> str:
    return "LK" + datetime.now(timezone.utc).strftime("%y%m%d") + "".join(random.choices(string.digits, k=5))


def _to_order_out(order: Order) -> OrderOut:
    return OrderOut(
        id=order.id,
        order_number=order.order_number,
        status=order.status.value,
        payment_status=order.payment_status.value,
        payment_method=order.payment_method,
        subtotal=order.subtotal,
        shipping_fee=order.shipping_fee,
        discount_amount=order.discount_amount,
        total_amount=order.total_amount,
        coupon_code=order.coupon_code,
        shipping_address=ShippingAddress(
            name=order.shipping_name, phone=order.shipping_phone,
            address=order.shipping_address, city=order.shipping_city,
            state=order.shipping_state, pincode=order.shipping_pincode,
        ),
        items=[OrderItemOut(
            id=i.id, product_id=i.product_id, product_name=i.product_name,
            product_image_url=i.product_image_url, variant_color=i.variant_color,
            lens_option_name=i.lens_option_name, quantity=i.quantity,
            unit_price=i.unit_price, total_price=i.total_price,
        ) for i in order.items],
        tracking_history=[TrackingOut(
            status=t.status.value, message=t.message, location=t.location, timestamp=t.timestamp
        ) for t in order.tracking_history],
        estimated_delivery=order.estimated_delivery,
        created_at=order.created_at,
    )


def _order_query():
    return select(Order).options(
        selectinload(Order.items),
        selectinload(Order.tracking_history),
    )


@router.get("")
async def get_orders(page: int = 0, size: int = 10,
                     user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    from sqlalchemy import func
    uid = uuid.UUID(user_id)
    q = _order_query().where(Order.user_id == uid).order_by(Order.created_at.desc())
    total = await db.scalar(select(func.count()).select_from(select(Order).where(Order.user_id == uid).subquery()))
    orders = (await db.execute(q.offset(page * size).limit(size))).scalars().all()
    return ApiResponse.ok(data=PageResponse.from_query([_to_order_out(o) for o in orders], page, size, total))


@router.get("/{order_id}")
async def get_order(order_id: uuid.UUID, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    order = await db.scalar(_order_query().where(Order.id == order_id, Order.user_id == uuid.UUID(user_id)))
    if not order:
        raise HTTPException(404, "Order not found")
    return ApiResponse.ok(data=_to_order_out(order))


@router.post("", status_code=201)
async def place_order(body: PlaceOrderIn, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    uid = uuid.UUID(user_id)

    cart = await db.scalar(
        select(Cart).where(Cart.user_id == uid).options(
            selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.images),
            selectinload(Cart.items).selectinload(CartItem.variant),
            selectinload(Cart.items).selectinload(CartItem.lens_option),
        )
    )
    if not cart or not cart.items:
        raise HTTPException(400, "Cart is empty")

    address = await db.scalar(select(Address).where(Address.id == body.address_id, Address.user_id == uid))
    if not address:
        raise HTTPException(404, "Address not found")

    # Calculate totals
    subtotal = Decimal(0)
    order_items = []
    for ci in cart.items:
        p = ci.product
        image_url = next((i.url for i in p.images if i.is_primary), None) or \
                    (p.images[0].url if p.images else None)
        unit_price = p.final_price + (ci.variant.price_adjustment if ci.variant else Decimal(0))
        lens_price = ci.lens_option.price if ci.lens_option else Decimal(0)
        total = (unit_price + lens_price) * ci.quantity
        subtotal += total
        order_items.append((ci, p, unit_price, lens_price, total, image_url))

    shipping_fee = Decimal(0) if subtotal >= 500 else Decimal(99)
    discount = Decimal(0)
    if body.coupon_code == "LENS10":
        discount = (subtotal * Decimal("0.10")).quantize(Decimal("0.01"))
    total_amount = subtotal + shipping_fee - discount

    order = Order(
        order_number=_gen_order_number(),
        user_id=uid,
        status=OrderStatus.PENDING,
        payment_method=body.payment_method,
        payment_status=PaymentStatus.COD if body.payment_method == "COD" else PaymentStatus.PENDING,
        subtotal=subtotal,
        shipping_fee=shipping_fee,
        discount_amount=discount,
        total_amount=total_amount,
        coupon_code=body.coupon_code,
        shipping_name=address.name,
        shipping_phone=address.phone,
        shipping_address=address.address_line1 + (f", {address.address_line2}" if address.address_line2 else ""),
        shipping_city=address.city,
        shipping_state=address.state,
        shipping_pincode=address.pincode,
        estimated_delivery=datetime.now(timezone.utc) + timedelta(days=5),
    )
    db.add(order)
    await db.flush()

    for ci, p, unit_price, lens_price, total, image_url in order_items:
        db.add(OrderItem(
            order_id=order.id, product_id=p.id, product_name=p.name,
            product_image_url=image_url,
            variant_color=ci.variant.color if ci.variant else None,
            lens_option_name=ci.lens_option.name if ci.lens_option else None,
            quantity=ci.quantity, unit_price=unit_price, lens_price=lens_price, total_price=total,
        ))

    db.add(OrderTracking(order_id=order.id, status=OrderStatus.PENDING, message="Order placed successfully"))

    # Clear cart
    for ci in cart.items:
        await db.delete(ci)

    await db.flush()
    order = await db.scalar(_order_query().where(Order.id == order.id))
    return ApiResponse.ok(data=_to_order_out(order), message="Order placed successfully")


@router.post("/{order_id}/cancel")
async def cancel_order(order_id: uuid.UUID, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    order = await db.scalar(_order_query().where(Order.id == order_id, Order.user_id == uuid.UUID(user_id)))
    if not order:
        raise HTTPException(404, "Order not found")
    if order.status in (OrderStatus.SHIPPED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.DELIVERED):
        raise HTTPException(400, f"Cannot cancel order in status {order.status.value}")

    order.status = OrderStatus.CANCELLED
    order.tracking_history.append(OrderTracking(order_id=order.id, status=OrderStatus.CANCELLED, message="Cancelled by customer"))
    return ApiResponse.ok(data=_to_order_out(order))
