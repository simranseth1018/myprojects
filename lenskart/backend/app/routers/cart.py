from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.cart import Cart, CartItem
from app.models.product import Product, ProductVariant, LensOption, ProductImage
from app.schemas.cart import AddToCartIn, UpdateCartItemIn, CartOut, CartItemOut
from app.schemas.product import ProductOut, VariantOut, LensOptionOut
from app.schemas.common import ApiResponse
from decimal import Decimal
import uuid

router = APIRouter(prefix="/api/cart", tags=["cart"])


async def _get_or_create_cart(user_id: uuid.UUID, db: AsyncSession) -> Cart:
    cart = await db.scalar(
        select(Cart).where(Cart.user_id == user_id).options(
            selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.images),
            selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.variants),
            selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.category),
            selectinload(Cart.items).selectinload(CartItem.variant),
            selectinload(Cart.items).selectinload(CartItem.lens_option),
        )
    )
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        await db.flush()
        # Re-fetch with relationships loaded
        cart = await db.scalar(
            select(Cart).where(Cart.user_id == user_id).options(
                selectinload(Cart.items),
            )
        )
    return cart


def _build_cart_out(cart: Cart) -> CartOut:
    items_out = []
    for item in cart.items:
        p = item.product
        product_out = ProductOut.model_validate(p)
        product_out.categoryName = p.category.name if p.category else None

        variant_out = None
        if item.variant:
            variant_out = VariantOut.model_validate(item.variant)

        lens_option_out = None
        if item.lens_option:
            lens_option_out = LensOptionOut.model_validate(item.lens_option)

        unit_price = float(p.final_price) + (float(item.variant.price_adjustment) if item.variant else 0)
        lens_price = float(item.lens_option.price) if item.lens_option else 0
        total = (unit_price + lens_price) * item.quantity

        items_out.append(CartItemOut(
            id=str(item.id),
            cartId=str(cart.id),
            product=product_out,
            variant=variant_out,
            lensOption=lens_option_out,
            quantity=item.quantity,
            priceAtAdd=unit_price + lens_price,
            totalPrice=total,
        ))
    subtotal = sum(i.totalPrice for i in items_out)
    return CartOut(id=str(cart.id), items=items_out, itemCount=len(items_out), subtotal=subtotal)


@router.get("")
async def get_cart(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    cart = await _get_or_create_cart(uuid.UUID(user_id), db)
    return ApiResponse.ok(data=_build_cart_out(cart))


@router.post("/items")
async def add_item(body: AddToCartIn, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    uid = uuid.UUID(user_id)
    cart = await _get_or_create_cart(uid, db)

    product_id = uuid.UUID(body.productId)
    variant_id = uuid.UUID(body.variantId) if body.variantId else None
    lens_option_id = uuid.UUID(body.lensOptionId) if body.lensOptionId else None
    prescription_id = uuid.UUID(body.prescriptionId) if body.prescriptionId else None

    product = await db.get(Product, product_id,
                           options=[selectinload(Product.images), selectinload(Product.variants)])
    if not product:
        raise HTTPException(404, "Product not found")

    # Check if already in cart
    existing = next((i for i in cart.items
                     if i.product_id == product_id and i.variant_id == variant_id), None)
    if existing:
        existing.quantity += body.quantity
    else:
        item = CartItem(
            cart_id=cart.id,
            product_id=product_id,
            variant_id=variant_id,
            lens_option_id=lens_option_id,
            prescription_id=prescription_id,
            quantity=body.quantity,
        )
        db.add(item)

    await db.flush()
    cart = await _get_or_create_cart(uid, db)
    return ApiResponse.ok(data=_build_cart_out(cart))


@router.put("/items/{item_id}")
async def update_item(item_id: uuid.UUID, body: UpdateCartItemIn,
                      user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    uid = uuid.UUID(user_id)
    item = await db.scalar(select(CartItem).join(Cart).where(CartItem.id == item_id, Cart.user_id == uid))
    if not item:
        raise HTTPException(404, "Cart item not found")

    if body.quantity <= 0:
        await db.delete(item)
    else:
        item.quantity = body.quantity
    await db.flush()

    cart = await _get_or_create_cart(uid, db)
    return ApiResponse.ok(data=_build_cart_out(cart))


@router.delete("/items/{item_id}")
async def remove_item(item_id: uuid.UUID, user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    uid = uuid.UUID(user_id)
    item = await db.scalar(select(CartItem).join(Cart).where(CartItem.id == item_id, Cart.user_id == uid))
    if item:
        await db.delete(item)
    await db.flush()
    cart = await _get_or_create_cart(uid, db)
    return ApiResponse.ok(data=_build_cart_out(cart))


@router.delete("")
async def clear_cart(user_id: str = Depends(get_current_user_id), db: AsyncSession = Depends(get_db)):
    cart = await db.scalar(select(Cart).where(Cart.user_id == uuid.UUID(user_id)))
    if cart:
        for item in await db.execute(select(CartItem).where(CartItem.cart_id == cart.id)):
            await db.delete(item[0])
    return ApiResponse.ok(message="Cart cleared")
