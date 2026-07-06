from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from decimal import Decimal
import uuid
from datetime import datetime


class PlaceOrderIn(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    address_id: uuid.UUID = Field(alias="addressId")
    payment_method: str = Field(alias="paymentMethod")
    coupon_code: Optional[str] = Field(None, alias="couponCode")


class PaymentVerifyIn(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    razorpay_order_id: str = Field(alias="razorpayOrderId")
    razorpay_payment_id: str = Field(alias="razorpayPaymentId")
    razorpay_signature: str = Field(alias="razorpaySignature")


class TrackingOut(BaseModel):
    status: str
    message: Optional[str] = None
    location: Optional[str] = None
    timestamp: datetime


class OrderItemOut(BaseModel):
    id: uuid.UUID
    productId: uuid.UUID
    productName: str
    productImageUrl: Optional[str] = None
    variantColor: Optional[str] = None
    lensOptionName: Optional[str] = None
    quantity: int
    unitPrice: Decimal
    totalPrice: Decimal


class ShippingAddress(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None


class OrderOut(BaseModel):
    id: uuid.UUID
    orderNumber: str
    status: str
    paymentStatus: str
    paymentMethod: Optional[str] = None
    subtotal: Decimal
    shippingFee: Decimal
    discountAmount: Decimal
    totalAmount: Decimal
    couponCode: Optional[str] = None
    shippingAddress: ShippingAddress
    items: List[OrderItemOut]
    trackingHistory: List[TrackingOut]
    estimatedDelivery: Optional[datetime] = None
    createdAt: datetime
