from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from decimal import Decimal
import uuid
from datetime import datetime


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    imageUrl: Optional[str] = Field(None, validation_alias='image_url')
    displayOrder: int = Field(validation_alias='display_order')
    isActive: bool = Field(validation_alias='is_active')


class VariantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    colorName: str = Field(validation_alias='color')
    colorHex: Optional[str] = Field(None, validation_alias='color_hex')
    stockQty: int = Field(validation_alias='stock_qty')
    priceAdjustment: Decimal = Field(validation_alias='price_adjustment')
    isDefault: bool = Field(validation_alias='is_default')


class ImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    url: str
    altText: Optional[str] = Field(None, validation_alias='alt_text')
    displayOrder: int = Field(validation_alias='display_order')
    isPrimary: bool = Field(validation_alias='is_primary')


class LensOptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    type: str
    price: Decimal
    features: Optional[str] = None
    isRecommended: bool = Field(validation_alias='is_recommended')


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    slug: str
    brand: Optional[str] = None
    description: Optional[str] = None
    categoryId: Optional[uuid.UUID] = Field(None, validation_alias='category_id')
    categoryName: Optional[str] = None
    basePrice: Decimal = Field(validation_alias='price')
    finalPrice: Decimal = Field(Decimal('0'), validation_alias='final_price')
    discountPercent: int = Field(validation_alias='discount_percent')
    frameType: Optional[str] = Field(None, validation_alias='frame_type')
    frameShape: Optional[str] = Field(None, validation_alias='frame_shape')
    frameMaterial: Optional[str] = Field(None, validation_alias='frame_material')
    gender: Optional[str] = None
    isFeatured: bool = Field(validation_alias='is_featured')
    isNewArrival: bool = Field(validation_alias='is_new_arrival')
    isBestseller: bool = Field(validation_alias='is_bestseller')
    isBlueLight: bool = Field(validation_alias='has_blue_light')
    rating: Decimal = Field(validation_alias='average_rating')
    reviewCount: int = Field(validation_alias='review_count')
    variants: List[VariantOut] = []
    images: List[ImageOut] = []
    createdAt: datetime = Field(validation_alias='created_at')


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    userName: str = Field(validation_alias='user_name')
    rating: int
    title: Optional[str] = None
    body: Optional[str] = None
    isVerifiedPurchase: bool = Field(validation_alias='is_verified_purchase')
    helpfulCount: int = Field(validation_alias='helpful_count')
    createdAt: datetime = Field(validation_alias='created_at')


class ReviewIn(BaseModel):
    product_id: uuid.UUID
    rating: int
    title: Optional[str] = None
    body: Optional[str] = None
