"""Seed the database with sample categories, products, lens options, and stores."""
import asyncio
import uuid
from decimal import Decimal

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://lenskart:lenskart123@localhost:5432/lenskart"

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# ── Product images (public CDN URLs) ─────────────────────────────────────────
# Using Unsplash with specific photo IDs that consistently show eyewear/fashion.
# Format: https://images.unsplash.com/photo-{id}?w=600&q=80&auto=format&fit=crop
IMGS = {
    # Eyeglasses — front-facing product shots on clean backgrounds
    "vc-acetate-classic":       "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&q=80&auto=format&fit=crop",
    "lk-air-rimless-oval":      "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=600&q=80&auto=format&fit=crop",
    "jj-hexagonal-metal":       "https://images.unsplash.com/photo-1574169208507-84376144848b?w=600&q=80&auto=format&fit=crop",
    "lk-hustlr-half-rim":       "https://images.unsplash.com/photo-1577803645773-f96470509666?w=600&q=80&auto=format&fit=crop",
    "lk-air-cat-eye":           "https://images.unsplash.com/photo-1606471191009-63994c53433b?w=600&q=80&auto=format&fit=crop",
    "jj-round-acetate":         "https://images.unsplash.com/photo-1511499767150-a4d1dc0769b8?w=600&q=80&auto=format&fit=crop",
    "vc-square-titanium":       "https://images.unsplash.com/photo-1592503254549-d83d24a4dfab?w=600&q=80&auto=format&fit=crop",
    "lk-air-geometric":         "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&q=80&auto=format&fit=crop",
    "jj-cat-eye-acetate":       "https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?w=600&q=80&auto=format&fit=crop",
    "vc-oval-rimless":          "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=600&q=80&auto=format&fit=crop",
    # Sunglasses — Chashmah oversize golden-black sunglasses
    "vc-aviator-classic":       "https://chashmah.com/wp-content/uploads/2024/01/IMG20240115190554.webp",
    "jj-wayfarer-bold":         "https://chashmah.com/wp-content/uploads/2024/01/IMG20240115190554.webp",
    "lk-air-round-retro":       "https://chashmah.com/wp-content/uploads/2024/01/IMG20240115190554.webp",
    "vc-cat-eye-sunglass":      "https://chashmah.com/wp-content/uploads/2024/01/IMG20240115190554.webp",
    "jj-square-sunglass":       "https://chashmah.com/wp-content/uploads/2024/01/IMG20240115190554.webp",
    "lk-sport-wraparound":      "https://chashmah.com/wp-content/uploads/2024/01/IMG20240115190554.webp",
    # Computer glasses
    "lk-blu-rectangle":         "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&q=80&auto=format&fit=crop",
    "lk-blu-round":             "https://images.unsplash.com/photo-1511499767150-a4d1dc0769b8?w=600&q=80&auto=format&fit=crop",
    "jj-blu-oval":              "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=600&q=80&auto=format&fit=crop",
    # Kids
    "lk-junior-flex":           "https://images.unsplash.com/photo-1577803645773-f96470509666?w=600&q=80&auto=format&fit=crop",
    "lk-junior-round":          "https://images.unsplash.com/photo-1511499767150-a4d1dc0769b8?w=600&q=80&auto=format&fit=crop",
    "jj-junior-rectangle":      "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&q=80&auto=format&fit=crop",
    # Premium
    "jj-premium-titanium":      "https://images.unsplash.com/photo-1592503254549-d83d24a4dfab?w=600&q=80&auto=format&fit=crop",
    "vc-premium-wood":          "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&q=80&auto=format&fit=crop",
    "lk-air-ultra-thin":        "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=600&q=80&auto=format&fit=crop",
    "vc-gradient-aviator":      "https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=600&q=80&auto=format&fit=crop",
    "jj-oversized-square":      "https://images.unsplash.com/photo-1592503254549-d83d24a4dfab?w=600&q=80&auto=format&fit=crop",
    "lk-clip-on-magnet":        "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80&auto=format&fit=crop",
    "vc-retro-browline":        "https://images.unsplash.com/photo-1577803645773-f96470509666?w=600&q=80&auto=format&fit=crop",
    "jj-slim-rectangle":        "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&q=80&auto=format&fit=crop",
}

PRODUCTS = [
    # ── Eyeglasses ──────────────────────────────────────────────────────────
    {
        "slug": "vc-acetate-classic", "category": "eyeglasses",
        "name": "Vincent Chase Acetate Classic",
        "brand": "Vincent Chase",
        "description": "Timeless acetate frame with a classic rectangular silhouette. Lightweight and durable.",
        "price": Decimal("2499"), "discount": Decimal("10"),
        "frame_type": "FULL_RIM", "frame_shape": "RECTANGLE", "frame_material": "ACETATE",
        "gender": "UNISEX", "featured": True, "new_arrival": False, "bestseller": True, "blue_light": True,
        "rating": Decimal("4.5"), "reviews": 128,
    },
    {
        "slug": "lk-air-rimless-oval", "category": "eyeglasses",
        "name": "Lenskart Air Rimless Oval",
        "brand": "Lenskart Air",
        "description": "Ultra-lightweight rimless frame. Barely-there feel with maximum style.",
        "price": Decimal("1999"), "discount": Decimal("15"),
        "frame_type": "RIMLESS", "frame_shape": "OVAL", "frame_material": "TITANIUM",
        "gender": "WOMEN", "featured": True, "new_arrival": True, "bestseller": False, "blue_light": False,
        "rating": Decimal("4.3"), "reviews": 74,
    },
    {
        "slug": "jj-hexagonal-metal", "category": "eyeglasses",
        "name": "John Jacobs Hexagonal Metal",
        "brand": "John Jacobs",
        "description": "Bold hexagonal metal frames for the modern trendsetter.",
        "price": Decimal("3499"), "discount": Decimal("20"),
        "frame_type": "FULL_RIM", "frame_shape": "GEOMETRIC", "frame_material": "METAL",
        "gender": "MEN", "featured": False, "new_arrival": True, "bestseller": False, "blue_light": True,
        "rating": Decimal("4.6"), "reviews": 56,
    },
    {
        "slug": "lk-hustlr-half-rim", "category": "eyeglasses",
        "name": "Lenskart Hustlr Half-Rim",
        "brand": "Lenskart Hustlr",
        "description": "Half-rim frame with a confident executive look. Perfect for the office.",
        "price": Decimal("2999"), "discount": Decimal("5"),
        "frame_type": "HALF_RIM", "frame_shape": "RECTANGLE", "frame_material": "METAL",
        "gender": "MEN", "featured": True, "new_arrival": False, "bestseller": True, "blue_light": False,
        "rating": Decimal("4.4"), "reviews": 92,
    },
    {
        "slug": "lk-air-cat-eye", "category": "eyeglasses",
        "name": "Lenskart Air Cat-Eye",
        "brand": "Lenskart Air",
        "description": "Elegant cat-eye frame with a modern feminine flair. Ultra lightweight.",
        "price": Decimal("2199"), "discount": Decimal("12"),
        "frame_type": "FULL_RIM", "frame_shape": "CAT_EYE", "frame_material": "ACETATE",
        "gender": "WOMEN", "featured": True, "new_arrival": True, "bestseller": False, "blue_light": False,
        "rating": Decimal("4.3"), "reviews": 61,
    },
    {
        "slug": "jj-round-acetate", "category": "eyeglasses",
        "name": "John Jacobs Round Classic",
        "brand": "John Jacobs",
        "description": "Retro-inspired round acetate frames that complement any face shape.",
        "price": Decimal("2799"), "discount": Decimal("10"),
        "frame_type": "FULL_RIM", "frame_shape": "ROUND", "frame_material": "ACETATE",
        "gender": "UNISEX", "featured": True, "new_arrival": False, "bestseller": True, "blue_light": True,
        "rating": Decimal("4.5"), "reviews": 103,
    },
    {
        "slug": "vc-square-titanium", "category": "eyeglasses",
        "name": "Vincent Chase Square Titanium",
        "brand": "Vincent Chase",
        "description": "Premium titanium square frame — feather-light at just 8g.",
        "price": Decimal("3999"), "discount": Decimal("0"),
        "frame_type": "FULL_RIM", "frame_shape": "SQUARE", "frame_material": "TITANIUM",
        "gender": "MEN", "featured": False, "new_arrival": True, "bestseller": False, "blue_light": False,
        "rating": Decimal("4.7"), "reviews": 38,
    },
    {
        "slug": "lk-air-geometric", "category": "eyeglasses",
        "name": "Lenskart Air Geometric",
        "brand": "Lenskart Air",
        "description": "Hexagonal geometric frame that makes a bold statement.",
        "price": Decimal("2399"), "discount": Decimal("8"),
        "frame_type": "FULL_RIM", "frame_shape": "GEOMETRIC", "frame_material": "METAL",
        "gender": "UNISEX", "featured": False, "new_arrival": True, "bestseller": False, "blue_light": True,
        "rating": Decimal("4.2"), "reviews": 29,
    },
    {
        "slug": "jj-cat-eye-acetate", "category": "eyeglasses",
        "name": "John Jacobs Cat-Eye Bold",
        "brand": "John Jacobs",
        "description": "Dramatic cat-eye silhouette in rich tortoiseshell acetate.",
        "price": Decimal("3299"), "discount": Decimal("15"),
        "frame_type": "FULL_RIM", "frame_shape": "CAT_EYE", "frame_material": "ACETATE",
        "gender": "WOMEN", "featured": True, "new_arrival": False, "bestseller": True, "blue_light": False,
        "rating": Decimal("4.6"), "reviews": 84,
    },
    {
        "slug": "vc-oval-rimless", "category": "eyeglasses",
        "name": "Vincent Chase Oval Rimless",
        "brand": "Vincent Chase",
        "description": "Minimalist rimless oval frame. Maximum comfort, zero compromise on style.",
        "price": Decimal("1799"), "discount": Decimal("0"),
        "frame_type": "RIMLESS", "frame_shape": "OVAL", "frame_material": "TITANIUM",
        "gender": "UNISEX", "featured": False, "new_arrival": False, "bestseller": True, "blue_light": False,
        "rating": Decimal("4.4"), "reviews": 67,
    },
    # ── Sunglasses ───────────────────────────────────────────────────────────
    {
        "slug": "vc-aviator-classic", "category": "sunglasses",
        "name": "Vincent Chase Aviator Classic",
        "brand": "Vincent Chase",
        "description": "Iconic aviator shape with UV400 polarized lenses. Gold metal frame.",
        "price": Decimal("1799"), "discount": Decimal("25"),
        "frame_type": "FULL_RIM", "frame_shape": "AVIATOR", "frame_material": "METAL",
        "gender": "UNISEX", "featured": True, "new_arrival": False, "bestseller": True, "blue_light": False,
        "rating": Decimal("4.7"), "reviews": 214,
    },
    {
        "slug": "jj-wayfarer-bold", "category": "sunglasses",
        "name": "John Jacobs Wayfarer Bold",
        "brand": "John Jacobs",
        "description": "Thick acetate wayfarer. UV protection with a fashion-forward look.",
        "price": Decimal("2299"), "discount": Decimal("10"),
        "frame_type": "FULL_RIM", "frame_shape": "WAYFARER", "frame_material": "ACETATE",
        "gender": "UNISEX", "featured": True, "new_arrival": True, "bestseller": False, "blue_light": False,
        "rating": Decimal("4.5"), "reviews": 103,
    },
    {
        "slug": "lk-air-round-retro", "category": "sunglasses",
        "name": "Lenskart Air Round Retro",
        "brand": "Lenskart Air",
        "description": "Retro round sunglasses with gradient tinted lenses.",
        "price": Decimal("1499"), "discount": Decimal("30"),
        "frame_type": "FULL_RIM", "frame_shape": "ROUND", "frame_material": "METAL",
        "gender": "WOMEN", "featured": False, "new_arrival": True, "bestseller": False, "blue_light": False,
        "rating": Decimal("4.2"), "reviews": 48,
    },
    {
        "slug": "vc-cat-eye-sunglass", "category": "sunglasses",
        "name": "Vincent Chase Cat-Eye Sunnies",
        "brand": "Vincent Chase",
        "description": "Oversized cat-eye sunglasses with polarized gradient lenses.",
        "price": Decimal("1999"), "discount": Decimal("20"),
        "frame_type": "FULL_RIM", "frame_shape": "CAT_EYE", "frame_material": "ACETATE",
        "gender": "WOMEN", "featured": True, "new_arrival": True, "bestseller": False, "blue_light": False,
        "rating": Decimal("4.4"), "reviews": 71,
    },
    {
        "slug": "jj-square-sunglass", "category": "sunglasses",
        "name": "John Jacobs Square Shield",
        "brand": "John Jacobs",
        "description": "Bold square frame with dark smoke lenses. The power look.",
        "price": Decimal("2599"), "discount": Decimal("0"),
        "frame_type": "FULL_RIM", "frame_shape": "SQUARE", "frame_material": "ACETATE",
        "gender": "MEN", "featured": True, "new_arrival": False, "bestseller": True, "blue_light": False,
        "rating": Decimal("4.6"), "reviews": 89,
    },
    {
        "slug": "lk-sport-wraparound", "category": "sunglasses",
        "name": "Lenskart Sport Wraparound",
        "brand": "Lenskart Sport",
        "description": "TR90 sport wraparound. Designed for outdoor activities.",
        "price": Decimal("1299"), "discount": Decimal("5"),
        "frame_type": "FULL_RIM", "frame_shape": "GEOMETRIC", "frame_material": "TR90",
        "gender": "UNISEX", "featured": False, "new_arrival": True, "bestseller": False, "blue_light": False,
        "rating": Decimal("4.3"), "reviews": 52,
    },
    # ── Computer Glasses ─────────────────────────────────────────────────────
    {
        "slug": "lk-blu-rectangle", "category": "computer-glasses",
        "name": "Lenskart BLU Rectangle",
        "brand": "Lenskart BLU",
        "description": "Blue light blocking computer glasses to reduce digital eye strain. Zero power.",
        "price": Decimal("1299"), "discount": Decimal("0"),
        "frame_type": "FULL_RIM", "frame_shape": "RECTANGLE", "frame_material": "TR90",
        "gender": "UNISEX", "featured": True, "new_arrival": False, "bestseller": True, "blue_light": True,
        "rating": Decimal("4.6"), "reviews": 189,
    },
    {
        "slug": "lk-blu-round", "category": "computer-glasses",
        "name": "Lenskart BLU Round",
        "brand": "Lenskart BLU",
        "description": "Stylish round blue light glasses. Work from home in style.",
        "price": Decimal("1499"), "discount": Decimal("10"),
        "frame_type": "FULL_RIM", "frame_shape": "ROUND", "frame_material": "ACETATE",
        "gender": "UNISEX", "featured": False, "new_arrival": True, "bestseller": False, "blue_light": True,
        "rating": Decimal("4.4"), "reviews": 96,
    },
    {
        "slug": "jj-blu-oval", "category": "computer-glasses",
        "name": "John Jacobs BLU Oval",
        "brand": "John Jacobs",
        "description": "Oval blue light filter glasses with premium anti-reflective coating.",
        "price": Decimal("1799"), "discount": Decimal("15"),
        "frame_type": "FULL_RIM", "frame_shape": "OVAL", "frame_material": "METAL",
        "gender": "WOMEN", "featured": False, "new_arrival": False, "bestseller": True, "blue_light": True,
        "rating": Decimal("4.5"), "reviews": 77,
    },
    # ── Kids Glasses ─────────────────────────────────────────────────────────
    {
        "slug": "lk-junior-flex", "category": "kids-glasses",
        "name": "Lenskart Junior Flex",
        "brand": "Lenskart Junior",
        "description": "Flexible TR90 kids frame. Unbreakable and feather-light for active kids.",
        "price": Decimal("999"), "discount": Decimal("0"),
        "frame_type": "FULL_RIM", "frame_shape": "RECTANGLE", "frame_material": "TR90",
        "gender": "KIDS", "featured": False, "new_arrival": True, "bestseller": False, "blue_light": True,
        "rating": Decimal("4.4"), "reviews": 37,
    },
    {
        "slug": "lk-junior-round", "category": "kids-glasses",
        "name": "Lenskart Junior Round",
        "brand": "Lenskart Junior",
        "description": "Cute round frame in vibrant colours. Perfect for school.",
        "price": Decimal("899"), "discount": Decimal("0"),
        "frame_type": "FULL_RIM", "frame_shape": "ROUND", "frame_material": "TR90",
        "gender": "KIDS", "featured": False, "new_arrival": False, "bestseller": True, "blue_light": True,
        "rating": Decimal("4.5"), "reviews": 62,
    },
    {
        "slug": "jj-junior-rectangle", "category": "kids-glasses",
        "name": "John Jacobs Junior Rectangle",
        "brand": "John Jacobs",
        "description": "Lightweight metal rectangle for older kids. Slim temples for comfort.",
        "price": Decimal("1199"), "discount": Decimal("10"),
        "frame_type": "FULL_RIM", "frame_shape": "RECTANGLE", "frame_material": "METAL",
        "gender": "KIDS", "featured": False, "new_arrival": True, "bestseller": False, "blue_light": False,
        "rating": Decimal("4.3"), "reviews": 28,
    },
    # ── Premium Collection ────────────────────────────────────────────────────
    {
        "slug": "jj-premium-titanium", "category": "eyeglasses",
        "name": "John Jacobs Titan Premium",
        "brand": "John Jacobs",
        "description": "Handcrafted titanium frame with spring hinges. Less than 10g. A lifetime companion.",
        "price": Decimal("5999"), "discount": Decimal("0"),
        "frame_type": "FULL_RIM", "frame_shape": "RECTANGLE", "frame_material": "TITANIUM",
        "gender": "MEN", "featured": True, "new_arrival": False, "bestseller": False, "blue_light": False,
        "rating": Decimal("4.8"), "reviews": 43,
    },
    {
        "slug": "vc-premium-wood", "category": "eyeglasses",
        "name": "Vincent Chase Wood Series",
        "brand": "Vincent Chase",
        "description": "Handcrafted bamboo-wood frame. Eco-friendly, one-of-a-kind grain pattern.",
        "price": Decimal("4999"), "discount": Decimal("10"),
        "frame_type": "FULL_RIM", "frame_shape": "SQUARE", "frame_material": "WOOD",
        "gender": "UNISEX", "featured": True, "new_arrival": True, "bestseller": False, "blue_light": False,
        "rating": Decimal("4.7"), "reviews": 31,
    },
    {
        "slug": "lk-air-ultra-thin", "category": "eyeglasses",
        "name": "Lenskart Air Ultra-Thin",
        "brand": "Lenskart Air",
        "description": "0.3mm titanium temples. Our thinnest frame ever — the invisible eyewear.",
        "price": Decimal("4499"), "discount": Decimal("5"),
        "frame_type": "RIMLESS", "frame_shape": "OVAL", "frame_material": "TITANIUM",
        "gender": "UNISEX", "featured": True, "new_arrival": True, "bestseller": False, "blue_light": False,
        "rating": Decimal("4.6"), "reviews": 22,
    },
    {
        "slug": "vc-gradient-aviator", "category": "sunglasses",
        "name": "Vincent Chase Gradient Aviator",
        "brand": "Vincent Chase",
        "description": "Gradient grey-to-clear polarized lenses in a classic gold aviator.",
        "price": Decimal("2199"), "discount": Decimal("15"),
        "frame_type": "FULL_RIM", "frame_shape": "AVIATOR", "frame_material": "METAL",
        "gender": "UNISEX", "featured": True, "new_arrival": False, "bestseller": True, "blue_light": False,
        "rating": Decimal("4.6"), "reviews": 157,
    },
    {
        "slug": "jj-oversized-square", "category": "sunglasses",
        "name": "John Jacobs Oversized Square",
        "brand": "John Jacobs",
        "description": "Statement oversized square frame with UV400 lenses. Pure runway energy.",
        "price": Decimal("2899"), "discount": Decimal("20"),
        "frame_type": "FULL_RIM", "frame_shape": "SQUARE", "frame_material": "ACETATE",
        "gender": "WOMEN", "featured": True, "new_arrival": True, "bestseller": False, "blue_light": False,
        "rating": Decimal("4.4"), "reviews": 68,
    },
    {
        "slug": "lk-clip-on-magnet", "category": "eyeglasses",
        "name": "Lenskart Clip-On Magnetic",
        "brand": "Lenskart",
        "description": "2-in-1 frame with magnetic clip-on polarized sunglass lenses.",
        "price": Decimal("2699"), "discount": Decimal("10"),
        "frame_type": "FULL_RIM", "frame_shape": "RECTANGLE", "frame_material": "METAL",
        "gender": "UNISEX", "featured": False, "new_arrival": True, "bestseller": False, "blue_light": True,
        "rating": Decimal("4.3"), "reviews": 45,
    },
    {
        "slug": "vc-retro-browline", "category": "eyeglasses",
        "name": "Vincent Chase Retro Browline",
        "brand": "Vincent Chase",
        "description": "Classic browline (clubmaster) design in mixed acetate and metal.",
        "price": Decimal("1999"), "discount": Decimal("0"),
        "frame_type": "HALF_RIM", "frame_shape": "RECTANGLE", "frame_material": "MIXED",
        "gender": "UNISEX", "featured": True, "new_arrival": False, "bestseller": True, "blue_light": False,
        "rating": Decimal("4.5"), "reviews": 118,
    },
    {
        "slug": "jj-slim-rectangle", "category": "eyeglasses",
        "name": "John Jacobs Slim Rectangle",
        "brand": "John Jacobs",
        "description": "Super-slim rectangular metal frame. Minimal weight, maximum elegance.",
        "price": Decimal("2499"), "discount": Decimal("8"),
        "frame_type": "FULL_RIM", "frame_shape": "RECTANGLE", "frame_material": "METAL",
        "gender": "MEN", "featured": False, "new_arrival": False, "bestseller": True, "blue_light": False,
        "rating": Decimal("4.4"), "reviews": 93,
    },
]


async def seed():
    async with AsyncSessionLocal() as db:
        # ── Categories ────────────────────────────────────────────────────────
        cats = [
            (str(uuid.uuid4()), "Eyeglasses",       "eyeglasses",       1),
            (str(uuid.uuid4()), "Sunglasses",        "sunglasses",       2),
            (str(uuid.uuid4()), "Computer Glasses",  "computer-glasses", 3),
            (str(uuid.uuid4()), "Kids Glasses",      "kids-glasses",     4),
            (str(uuid.uuid4()), "Contact Lenses",    "contact-lenses",   5),
        ]
        await db.execute(text("""
            INSERT INTO categories (id, name, slug, display_order, is_active)
            VALUES (:id, :name, :slug, :order, true)
            ON CONFLICT (slug) DO NOTHING
        """), [{"id": c[0], "name": c[1], "slug": c[2], "order": c[3]} for c in cats])

        rows = (await db.execute(text("SELECT id, slug FROM categories"))).fetchall()
        cat_id = {r.slug: str(r.id) for r in rows}

        # ── Lens options ──────────────────────────────────────────────────────
        lens_opts = [
            (str(uuid.uuid4()), "TYPE",    "Single Vision",           "Standard prescription for near or far",       Decimal("0")),
            (str(uuid.uuid4()), "TYPE",    "Thin & Light (1.6)",      "Thinner lenses for higher prescriptions",     Decimal("999")),
            (str(uuid.uuid4()), "TYPE",    "Progressive",             "Seamless transition for multiple distances",  Decimal("2999")),
            (str(uuid.uuid4()), "TYPE",    "Bifocal",                 "Two distinct optical zones",                  Decimal("1499")),
            (str(uuid.uuid4()), "COATING", "Blue Light Filter",       "Reduces digital eye strain",                  Decimal("499")),
            (str(uuid.uuid4()), "COATING", "Anti-Glare Coating",      "Reduces reflections for night driving",       Decimal("299")),
            (str(uuid.uuid4()), "TINT",    "Photochromic (Transitions)","Auto-darkens in sunlight",                  Decimal("1299")),
            (str(uuid.uuid4()), "TINT",    "Polarized",               "Eliminates glare for outdoor use",            Decimal("799")),
        ]
        await db.execute(text("""
            INSERT INTO lens_options (id, type, name, description, price, is_recommended, is_active)
            VALUES (:id, :type, :name, :desc, :price, false, true)
            ON CONFLICT DO NOTHING
        """), [{"id": o[0], "type": o[1], "name": o[2], "desc": o[3], "price": o[4]} for o in lens_opts])

        # ── Products ──────────────────────────────────────────────────────────
        inserted = 0
        for p in PRODUCTS:
            cid = cat_id.get(p["category"])
            if not cid:
                continue
            result = await db.execute(text("""
                INSERT INTO products (
                    id, category_id, name, slug, brand, description,
                    price, discount_percent,
                    frame_type, frame_shape, frame_material, gender,
                    is_active, is_featured, is_new_arrival, is_bestseller,
                    has_blue_light, average_rating, review_count, created_at, updated_at
                ) VALUES (
                    :id, :cid, :name, :slug, :brand, :desc,
                    :price, :discount,
                    :frame_type, :frame_shape, :frame_material, :gender,
                    true, :featured, :new_arrival, :bestseller,
                    :blue_light, :rating, :reviews, now(), now()
                ) ON CONFLICT (slug) DO NOTHING
            """), {
                "id": str(uuid.uuid4()), "cid": cid,
                "name": p["name"], "slug": p["slug"],
                "brand": p["brand"], "desc": p["description"],
                "price": p["price"], "discount": int(p["discount"]),
                "frame_type": p["frame_type"], "frame_shape": p["frame_shape"],
                "frame_material": p["frame_material"], "gender": p["gender"],
                "featured": p["featured"], "new_arrival": p["new_arrival"],
                "bestseller": p["bestseller"], "blue_light": p["blue_light"],
                "rating": p["rating"], "reviews": p["reviews"],
            })
            inserted += result.rowcount

        # ── Product images ────────────────────────────────────────────────────
        prod_rows = (await db.execute(text("SELECT id, slug FROM products"))).fetchall()
        img_inserted = 0
        for row in prod_rows:
            img_url = IMGS.get(row.slug)
            if not img_url:
                continue
            result = await db.execute(text("""
                INSERT INTO product_images (id, product_id, url, alt_text, is_primary, display_order)
                VALUES (:id, :pid, :url, :alt, true, 0)
                ON CONFLICT DO NOTHING
            """), {
                "id": str(uuid.uuid4()), "pid": str(row.id),
                "url": img_url, "alt": f"{row.slug} eyewear",
            })
            img_inserted += result.rowcount

        # ── Product variants ──────────────────────────────────────────────────
        VARIANT_COLORS = [
            ("Black",          "#1a1a1a"),
            ("Tortoise Brown", "#8B4513"),
            ("Navy Blue",      "#1a237e"),
            ("Gun Metal",      "#5c5c5c"),
            ("Rose Gold",      "#b76e79"),
            ("Crystal Clear",  "#e8e8e8"),
            ("Dark Green",     "#1b5e20"),
            ("Wine Red",       "#722f37"),
        ]
        variant_inserted = 0
        for row in prod_rows:
            import random
            random.seed(row.slug)
            num_variants = random.randint(2, 4)
            chosen = random.sample(VARIANT_COLORS, num_variants)
            for idx, (color, hex_val) in enumerate(chosen):
                result = await db.execute(text("""
                    INSERT INTO product_variants (id, product_id, color, color_hex, stock_qty, price_adjustment, is_default)
                    VALUES (:id, :pid, :color, :hex, :stock, 0, :is_default)
                    ON CONFLICT DO NOTHING
                """), {
                    "id": str(uuid.uuid4()), "pid": str(row.id),
                    "color": color, "hex": hex_val,
                    "stock": random.randint(5, 50),
                    "is_default": idx == 0,
                })
                variant_inserted += result.rowcount

        # ── Stores ────────────────────────────────────────────────────────────
        stores = [
            ("Lenskart - Connaught Place", "Connaught Place, New Delhi", "Delhi",     "Delhi",       "110001", 28.6315,  77.2167),
            ("Lenskart - Bandra West",     "LJ Road, Bandra West",      "Mumbai",    "Maharashtra", "400050", 19.0596,  72.8295),
            ("Lenskart - Koramangala",     "80 Feet Rd, Koramangala",   "Bengaluru", "Karnataka",   "560034", 12.9352,  77.6245),
            ("Lenskart - Anna Nagar",      "2nd Avenue, Anna Nagar",    "Chennai",   "Tamil Nadu",  "600040", 13.0850,  80.2100),
            ("Lenskart - Banjara Hills",   "Road No 12, Banjara Hills", "Hyderabad", "Telangana",   "500034", 17.4126,  78.4483),
            ("Lenskart - Salt Lake",       "Sector V, Salt Lake",       "Kolkata",   "West Bengal", "700091", 22.5726,  88.4312),
            ("Lenskart - FC Road",         "FC Road, Shivajinagar",     "Pune",      "Maharashtra", "411004", 18.5204,  73.8567),
        ]
        for s in stores:
            await db.execute(text("""
                INSERT INTO stores (id, name, address, city, state, pincode, latitude, longitude, is_active)
                VALUES (:id, :name, :address, :city, :state, :pincode, :lat, :lng, true)
                ON CONFLICT DO NOTHING
            """), {
                "id": str(uuid.uuid4()), "name": s[0], "address": s[1],
                "city": s[2], "state": s[3], "pincode": s[4],
                "lat": s[5], "lng": s[6],
            })

        await db.commit()
        print("✅ Seed complete!")
        print(f"  Categories : {len(cats)}")
        print(f"  Lens opts  : {len(lens_opts)}")
        print(f"  Products   : {inserted} new (of {len(PRODUCTS)} total)")
        print(f"  Images     : {img_inserted} new")
        print(f"  Variants   : {variant_inserted} new")
        print(f"  Stores     : {len(stores)}")


asyncio.run(seed())
