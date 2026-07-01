from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from decimal import Decimal
import uuid

from app.schemas.product import ProductOut, VariantOut, LensOptionOut


class AddToCartIn(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    productId: str = Field(alias="productId")
    variantId: Optional[str] = Field(None, alias="variantId")
    lensOptionId: Optional[str] = Field(None, alias="lensOptionId")
    prescriptionId: Optional[str] = Field(None, alias="prescriptionId")
    quantity: int = 1


class UpdateCartItemIn(BaseModel):
    quantity: int


class CartItemOut(BaseModel):
    id: str
    cartId: str
    product: ProductOut
    variant: Optional[VariantOut] = None
    lensOption: Optional[LensOptionOut] = None
    quantity: int
    priceAtAdd: float
    totalPrice: float


class CartOut(BaseModel):
    id: str
    items: List[CartItemOut]
    itemCount: int
    subtotal: float
