from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.product import Product, Category, LensOption, ProductVariant, ProductImage
from app.schemas.product import ProductOut, CategoryOut, LensOptionOut, ReviewOut, ReviewIn
from app.schemas.common import ApiResponse, PageResponse
from app.core.security import get_current_user_id
from app.models.review import Review
from app.models.user import User
from typing import Optional, List
from decimal import Decimal
import math, uuid

router = APIRouter(tags=["products"])


def _product_query():
    return select(Product).options(
        selectinload(Product.variants),
        selectinload(Product.images),
        selectinload(Product.category),
    )


def _to_out(p: Product) -> ProductOut:
    d = ProductOut.model_validate(p)
    d.categoryName = p.category.name if p.category else None
    return d


@router.get("/api/products")
async def get_products(
    request: Request,
    category: Optional[str] = None,
    brand: Optional[str] = None,
    # Accept both camelCase (frontend) and snake_case params
    frame_type: Optional[str] = None,
    frameType: Optional[List[str]] = Query(None),
    frame_shape: Optional[str] = None,
    frameShape: Optional[List[str]] = Query(None),
    frame_material: Optional[str] = None,
    frameMaterial: Optional[List[str]] = Query(None),
    gender: Optional[List[str]] = Query(None),
    is_featured: Optional[bool] = None,
    is_new_arrival: Optional[bool] = None,
    is_bestseller: Optional[bool] = None,
    has_blue_light: Optional[bool] = None,
    isBlueLight: Optional[bool] = None,
    min_price: Optional[Decimal] = None,
    minPrice: Optional[Decimal] = None,
    max_price: Optional[Decimal] = None,
    maxPrice: Optional[Decimal] = None,
    rating: Optional[Decimal] = None,
    search: Optional[str] = None,
    sort: str = "newest",
    direction: Optional[str] = None,
    page: int = Query(0, ge=0),
    size: int = Query(12, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    q = _product_query().where(Product.is_active == True)

    if category:
        q = q.join(Category).where(Category.slug == category)

    if brand:
        q = q.where(Product.brand.ilike(f"%{brand}%"))

    # frame_type: accept single snake_case or camelCase array
    ft_values = frameType or ([frame_type.upper()] if frame_type else None)
    if ft_values:
        q = q.where(Product.frame_type.in_([v.upper() for v in ft_values]))

    # frame_shape
    fs_values = frameShape or ([frame_shape.upper()] if frame_shape else None)
    if fs_values:
        q = q.where(Product.frame_shape.in_([v.upper() for v in fs_values]))

    # frame_material
    fm_values = frameMaterial or ([frame_material.upper()] if frame_material else None)
    if fm_values:
        q = q.where(Product.frame_material.in_([v.upper() for v in fm_values]))

    # gender: array
    if gender:
        q = q.where(Product.gender.in_([g.upper() for g in gender]))

    if is_featured is not None:
        q = q.where(Product.is_featured == is_featured)
    if is_new_arrival is not None:
        q = q.where(Product.is_new_arrival == is_new_arrival)
    if is_bestseller is not None:
        q = q.where(Product.is_bestseller == is_bestseller)

    # blue light: accept both param names
    bl = isBlueLight if isBlueLight is not None else has_blue_light
    if bl is not None:
        q = q.where(Product.has_blue_light == bl)

    # price range: accept both param names
    effective_min = minPrice if minPrice is not None else min_price
    effective_max = maxPrice if maxPrice is not None else max_price
    if effective_min is not None:
        q = q.where(Product.price >= effective_min)
    if effective_max is not None:
        q = q.where(Product.price <= effective_max)

    # rating filter
    if rating is not None:
        q = q.where(Product.average_rating >= rating)

    # search
    if search:
        q = q.where(or_(Product.name.ilike(f"%{search}%"), Product.brand.ilike(f"%{search}%")))

    # sorting: accept frontend sort field + direction, or predefined sort strings
    sort_map = {
        "price_asc": Product.price.asc(),
        "price_desc": Product.price.desc(),
        "rating": Product.average_rating.desc(),
        "popular": Product.review_count.desc(),
    }
    if sort in sort_map:
        q = q.order_by(sort_map[sort])
    elif sort in ("price", "finalPrice") and direction == "asc":
        q = q.order_by(Product.price.asc())
    elif sort in ("price", "finalPrice") and direction == "desc":
        q = q.order_by(Product.price.desc())
    elif sort == "average_rating" or sort == "rating":
        q = q.order_by(Product.average_rating.desc() if direction != "asc" else Product.average_rating.asc())
    elif sort == "review_count" or sort == "reviewCount":
        q = q.order_by(Product.review_count.desc() if direction != "asc" else Product.review_count.asc())
    elif sort == "name":
        q = q.order_by(Product.name.asc() if direction == "asc" else Product.name.desc())
    else:
        # default: newest (createdAt desc)
        q = q.order_by(Product.created_at.desc() if direction != "asc" else Product.created_at.asc())

    total = await db.scalar(select(func.count()).select_from(q.subquery()))
    products = (await db.execute(q.offset(page * size).limit(size))).scalars().all()

    return ApiResponse.ok(data=PageResponse.from_query([_to_out(p) for p in products], page, size, total))


@router.get("/api/products/search")
async def search_products(
    q: str,
    page: int = 0,
    size: int = 12,
    db: AsyncSession = Depends(get_db),
):
    query = _product_query().where(
        Product.is_active == True,
        or_(Product.name.ilike(f"%{q}%"), Product.brand.ilike(f"%{q}%"))
    ).order_by(Product.average_rating.desc())

    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    products = (await db.execute(query.offset(page * size).limit(size))).scalars().all()

    return ApiResponse.ok(data=PageResponse.from_query([_to_out(p) for p in products], page, size, total))


@router.get("/api/products/featured")
async def get_featured(limit: int = 10, db: AsyncSession = Depends(get_db)):
    products = (await db.execute(
        _product_query().where(Product.is_featured == True, Product.is_active == True).limit(limit)
    )).scalars().all()
    return ApiResponse.ok(data=[_to_out(p) for p in products])


@router.get("/api/products/slug/{slug}")
async def get_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    p = await db.scalar(_product_query().where(Product.slug == slug, Product.is_active == True))
    if not p:
        from fastapi import HTTPException
        raise HTTPException(404, f"Product not found: {slug}")
    return ApiResponse.ok(data=_to_out(p))


@router.get("/api/products/{product_id}")
async def get_by_id(product_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    p = await db.scalar(_product_query().where(Product.id == product_id, Product.is_active == True))
    if not p:
        from fastapi import HTTPException
        raise HTTPException(404, f"Product not found: {product_id}")
    return ApiResponse.ok(data=_to_out(p))


@router.get("/api/products/{product_id}/reviews")
async def get_reviews(product_id: uuid.UUID, page: int = 0, size: int = 10, db: AsyncSession = Depends(get_db)):
    q = select(Review).where(Review.product_id == product_id).order_by(Review.created_at.desc())
    total = await db.scalar(select(func.count()).select_from(q.subquery()))
    reviews = (await db.execute(q.offset(page * size).limit(size))).scalars().all()
    return ApiResponse.ok(data=PageResponse.from_query([ReviewOut.model_validate(r) for r in reviews], page, size, total))


@router.get("/api/products/{product_id}/reviews/stats")
async def review_stats(product_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    total = await db.scalar(select(func.count(Review.id)).where(Review.product_id == product_id))
    avg = await db.scalar(select(func.avg(Review.rating)).where(Review.product_id == product_id))
    return ApiResponse.ok(data={"total_reviews": total, "average_rating": round(float(avg), 1) if avg else 0})


@router.get("/api/categories")
async def get_categories(db: AsyncSession = Depends(get_db)):
    cats = (await db.execute(
        select(Category).where(Category.is_active == True).order_by(Category.display_order)
    )).scalars().all()
    return ApiResponse.ok(data=[CategoryOut.model_validate(c) for c in cats])


@router.get("/api/lens-options")
async def get_lens_options(db: AsyncSession = Depends(get_db)):
    opts = (await db.execute(
        select(LensOption).where(LensOption.is_active == True).order_by(LensOption.type, LensOption.price)
    )).scalars().all()
    return ApiResponse.ok(data=[LensOptionOut.model_validate(o) for o in opts])
