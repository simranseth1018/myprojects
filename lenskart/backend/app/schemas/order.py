from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal
import uuid
from datetime import datetime


class PlaceOrderIn(BaseModel):
    address_id: uuid.UUID
    payment_method: str
    coupon_code: Optional[str] = None


class PaymentVerifyIn(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class TrackingOut(BaseModel):
    status: str
    message: Optional[str]
    location: Optional[str]
    timestamp: datetime


class OrderItemOut(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    product_image_url: Optional[str]
    variant_color: Optional[str]
    lens_option_name: Optional[str]
    quantity: int
    unit_price: Decimal
    total_price: Decimal


class ShippingAddress(BaseModel):
    name: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    pincode: Optional[str]


class OrderOut(BaseModel):
    id: uuid.UUID
    order_number: str
    status: str
    payment_status: str
    payment_method: Optional[str]
    subtotal: Decimal
    shipping_fee: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    coupon_code: Optional[str]
    shipping_address: ShippingAddress
    items: List[OrderItemOut]
    tracking_history: List[TrackingOut]
    estimated_delivery: Optional[datetime]
    created_at: datetime
