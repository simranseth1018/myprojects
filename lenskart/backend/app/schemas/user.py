from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
import uuid
from datetime import datetime, date


class UpdateProfileIn(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class AddressIn(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(alias="fullName")
    phone: str
    address_line1: str = Field(alias="line1")
    address_line2: Optional[str] = Field(None, alias="line2")
    city: str
    state: str
    pincode: str
    type: Optional[str] = "HOME"
    is_default: Optional[bool] = Field(False, alias="isDefault")


class AddressOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    fullName: str = Field(validation_alias="name")
    phone: str
    line1: str = Field(validation_alias="address_line1")
    line2: Optional[str] = Field(None, validation_alias="address_line2")
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    type: str
    isDefault: bool = Field(validation_alias="is_default")


class PrescriptionIn(BaseModel):
    label: Optional[str] = None
    right_sph: Optional[float] = None
    right_cyl: Optional[float] = None
    right_axis: Optional[int] = None
    right_add: Optional[float] = None
    left_sph: Optional[float] = None
    left_cyl: Optional[float] = None
    left_axis: Optional[int] = None
    left_add: Optional[float] = None
    pd: Optional[float] = None
    file_url: Optional[str] = None
    expiry_date: Optional[date] = None


class PrescriptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    label: Optional[str]
    right_sph: Optional[float]
    right_cyl: Optional[float]
    right_axis: Optional[int]
    left_sph: Optional[float]
    left_cyl: Optional[float]
    left_axis: Optional[int]
    pd: Optional[float]
    expiry_date: Optional[date]
    created_at: datetime


class EyeTestBookingIn(BaseModel):
    name: str
    phone: str
    address: str
    pincode: Optional[str] = None
    booking_date: date
    booking_time: str
    notes: Optional[str] = None


class EyeTestBookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    phone: str
    address: str
    booking_date: date
    booking_time: str
    status: str
    created_at: datetime


class WishlistToggleIn(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    product_id: uuid.UUID
