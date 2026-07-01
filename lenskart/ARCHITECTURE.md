# Lenskart-Inspired Eyewear Ecommerce Platform — Architecture

## Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript 5 |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS 3.4 + Shadcn UI |
| State | Redux Toolkit 2 |
| Server State | TanStack React Query 5 |
| Routing | React Router 6 |
| Animations | Framer Motion 11 |
| 3D/WebGL | Three.js + @react-three/fiber |
| AR/Vision | MediaPipe Face Mesh, TensorFlow.js |
| Video | WebRTC |
| Forms | React Hook Form + Zod |
| Payments | Razorpay JS SDK |
| SEO | React Helmet Async |

### Backend (Spring Boot Microservices)
| Service | Port | Responsibility |
|---|---|---|
| API Gateway | 8080 | Routing, rate limiting, auth filter |
| Auth Service | 8081 | JWT, Google OAuth2, refresh tokens |
| Product Service | 8082 | Catalog, inventory, search |
| Order Service | 8083 | Cart, checkout, order lifecycle |
| User Service | 8084 | Profiles, prescriptions, wishlist |
| Notification Service | 8085 | Email, SMS, push (async) |
| Payment Service | 8086 | Razorpay integration, webhooks |
| Eye-Test Service | 8087 | Home eye test booking |
| Admin Service | 8088 | Dashboard, analytics, CMS |

### Infrastructure
| Component | Technology |
|---|---|
| Primary DB | PostgreSQL 16 |
| Cache | Redis 7 |
| Object Storage | AWS S3 + CloudFront CDN |
| Search | Elasticsearch 8 |
| Queue | RabbitMQ |
| Container | Docker + ECS Fargate |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus + Grafana |
| APM | AWS X-Ray |

---

## Folder Structure

```
lenskart/
├── frontend/                          # React 19 application
│   ├── public/
│   │   ├── favicon.ico
│   │   └── robots.txt
│   ├── src/
│   │   ├── assets/                    # Static assets
│   │   │   ├── images/
│   │   │   ├── icons/
│   │   │   └── fonts/
│   │   ├── components/                # Reusable UI components
│   │   │   ├── ui/                    # Shadcn UI primitives
│   │   │   ├── layout/                # Header, Footer, Sidebar
│   │   │   ├── home/                  # Hero, Categories, Trending
│   │   │   ├── product/               # Cards, Gallery, Zoom, Lens
│   │   │   ├── ar/                    # Face Detection, Try-On
│   │   │   ├── cart/                  # Cart drawer, item
│   │   │   ├── checkout/              # Steps, payment
│   │   │   ├── auth/                  # Login, Register, OAuth
│   │   │   ├── dashboard/             # User & Admin dashboard
│   │   │   └── common/               # Breadcrumb, Pagination, etc
│   │   ├── pages/                     # Route-level pages
│   │   │   ├── Home.tsx
│   │   │   ├── Catalog.tsx
│   │   │   ├── ProductDetail.tsx
│   │   │   ├── VirtualTryOn.tsx
│   │   │   ├── Cart.tsx
│   │   │   ├── Checkout.tsx
│   │   │   ├── OrderTracking.tsx
│   │   │   ├── Wishlist.tsx
│   │   │   ├── Prescription.tsx
│   │   │   ├── EyeTest.tsx
│   │   │   ├── auth/
│   │   │   ├── user/
│   │   │   └── admin/
│   │   ├── store/                     # Redux Toolkit
│   │   │   ├── index.ts
│   │   │   ├── slices/
│   │   │   │   ├── authSlice.ts
│   │   │   │   ├── cartSlice.ts
│   │   │   │   ├── wishlistSlice.ts
│   │   │   │   ├── filterSlice.ts
│   │   │   │   ├── uiSlice.ts
│   │   │   │   └── tryOnSlice.ts
│   │   │   └── middleware/
│   │   ├── hooks/                     # React Query + custom hooks
│   │   │   ├── api/
│   │   │   │   ├── useProducts.ts
│   │   │   │   ├── useOrders.ts
│   │   │   │   ├── useUser.ts
│   │   │   │   ├── useCart.ts
│   │   │   │   └── useAuth.ts
│   │   │   └── ui/
│   │   │       ├── useDebounce.ts
│   │   │       ├── useIntersection.ts
│   │   │       └── useMediaQuery.ts
│   │   ├── lib/                       # Utilities & configs
│   │   │   ├── api.ts                 # Axios instance
│   │   │   ├── queryClient.ts
│   │   │   ├── razorpay.ts
│   │   │   ├── mediapipe.ts
│   │   │   ├── tensorflow.ts
│   │   │   └── utils.ts
│   │   ├── types/                     # TypeScript types
│   │   │   ├── product.ts
│   │   │   ├── order.ts
│   │   │   ├── user.ts
│   │   │   ├── auth.ts
│   │   │   └── api.ts
│   │   ├── styles/
│   │   │   └── globals.css
│   │   ├── router/
│   │   │   └── index.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
│
└── backend/                           # Spring Boot microservices
    ├── api-gateway/
    ├── auth-service/
    ├── product-service/
    ├── order-service/
    ├── user-service/
    ├── payment-service/
    ├── notification-service/
    ├── eye-test-service/
    ├── admin-service/
    └── docker-compose.yml
```

---

## Database Schema (PostgreSQL)

### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  google_id VARCHAR(255),
  role VARCHAR(20) DEFAULT 'CUSTOMER',  -- CUSTOMER, ADMIN, OPTICIAN
  email_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### addresses
```sql
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) DEFAULT 'HOME',  -- HOME, WORK, OTHER
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  line1 VARCHAR(500) NOT NULL,
  line2 VARCHAR(500),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### categories
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  parent_id UUID REFERENCES categories(id),
  image_url TEXT,
  description TEXT,
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);
```

### products
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id),
  brand VARCHAR(100),
  frame_type VARCHAR(50),     -- FULL_RIM, HALF_RIM, RIMLESS
  frame_shape VARCHAR(50),    -- ROUND, SQUARE, OVAL, CAT_EYE, etc
  frame_material VARCHAR(50), -- METAL, PLASTIC, TITANIUM, TR90
  gender VARCHAR(20),         -- MEN, WOMEN, UNISEX, KIDS
  is_prescription BOOLEAN DEFAULT TRUE,
  is_sunglasses BOOLEAN DEFAULT FALSE,
  is_blue_light BOOLEAN DEFAULT FALSE,
  base_price DECIMAL(10,2) NOT NULL,
  discount_percent INT DEFAULT 0,
  final_price DECIMAL(10,2) GENERATED ALWAYS AS (base_price * (1 - discount_percent::DECIMAL/100)) STORED,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  tags TEXT[],
  meta_title VARCHAR(255),
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_price ON products(final_price);
```

### product_variants
```sql
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  color_name VARCHAR(100) NOT NULL,
  color_hex VARCHAR(7),
  color_image_url TEXT,
  stock_qty INT DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE
);
```

### product_images
```sql
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id),
  url TEXT NOT NULL,
  alt_text VARCHAR(255),
  display_order INT DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  view_type VARCHAR(30)  -- FRONT, SIDE, ANGLE, ON_FACE, AR_OVERLAY
);
```

### lens_options
```sql
CREATE TABLE lens_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,    -- SINGLE_VISION, BIFOCAL, PROGRESSIVE
  coating VARCHAR(50),          -- ANTI_GLARE, BLUE_CUT, PHOTOCHROMIC
  material VARCHAR(50),         -- STANDARD, THIN, ULTRA_THIN
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);
```

### prescriptions
```sql
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  right_sph DECIMAL(5,2),
  right_cyl DECIMAL(5,2),
  right_axis INT,
  right_add DECIMAL(5,2),
  left_sph DECIMAL(5,2),
  left_cyl DECIMAL(5,2),
  left_axis INT,
  left_add DECIMAL(5,2),
  pd_right DECIMAL(5,2),
  pd_left DECIMAL(5,2),
  file_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  expires_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### carts
```sql
CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE,
  session_id VARCHAR(255),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  lens_option_id UUID REFERENCES lens_options(id),
  prescription_id UUID REFERENCES prescriptions(id),
  quantity INT DEFAULT 1,
  price_at_add DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### orders
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  address_id UUID REFERENCES addresses(id),
  status VARCHAR(30) DEFAULT 'PENDING',
  -- PENDING, CONFIRMED, PROCESSING, DISPATCHED, DELIVERED, CANCELLED, RETURNED
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  shipping_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  coupon_code VARCHAR(50),
  payment_method VARCHAR(30),
  payment_status VARCHAR(20) DEFAULT 'PENDING',
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  lens_option_id UUID REFERENCES lens_options(id),
  prescription_id UUID REFERENCES prescriptions(id),
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  lens_price DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL,
  product_snapshot JSONB   -- snapshot of product at time of order
);

CREATE TABLE order_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  tracking_number VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### wishlists
```sql
CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  variant_id UUID REFERENCES product_variants(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);
```

### reviews
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  order_item_id UUID REFERENCES order_items(id),
  rating INT CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(255),
  body TEXT,
  images TEXT[],
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_count INT DEFAULT 0,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### eye_test_bookings
```sql
CREATE TABLE eye_test_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_slot VARCHAR(50) NOT NULL,
  status VARCHAR(30) DEFAULT 'BOOKED',
  -- BOOKED, CONFIRMED, COMPLETED, CANCELLED
  optician_id UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### stores
```sql
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  phone VARCHAR(20),
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  timings JSONB,
  services TEXT[],
  is_active BOOLEAN DEFAULT TRUE
);
```

---

## API Contracts

### Auth Service (8081)
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/oauth2/google
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/verify-email
```

### Product Service (8082)
```
GET  /api/products                  # list with filters
GET  /api/products/:id              # detail
GET  /api/products/slug/:slug       # by slug
GET  /api/products/search?q=        # search
GET  /api/categories                # tree
GET  /api/categories/:slug          # by slug
GET  /api/lens-options              # lens configs
POST /api/admin/products            # create
PUT  /api/admin/products/:id        # update
DEL  /api/admin/products/:id        # delete
```

### Order Service (8083)
```
GET  /api/cart                      # get cart
POST /api/cart/items                # add item
PUT  /api/cart/items/:id            # update quantity
DEL  /api/cart/items/:id            # remove item
DEL  /api/cart                      # clear cart
POST /api/orders                    # place order
GET  /api/orders                    # user orders
GET  /api/orders/:id                # order detail
PUT  /api/orders/:id/cancel         # cancel order
GET  /api/orders/:id/tracking       # tracking info
```

### Payment Service (8086)
```
POST /api/payment/create-order      # create Razorpay order
POST /api/payment/verify            # verify signature
POST /api/payment/webhook           # Razorpay webhook
```

### User Service (8084)
```
GET  /api/users/me                  # profile
PUT  /api/users/me                  # update profile
GET  /api/users/me/addresses        # addresses
POST /api/users/me/addresses        # add address
PUT  /api/users/me/addresses/:id    # update address
DEL  /api/users/me/addresses/:id    # delete address
GET  /api/users/me/prescriptions    # prescriptions
POST /api/users/me/prescriptions    # upload
DEL  /api/users/me/prescriptions/:id
GET  /api/users/me/wishlist         # wishlist
POST /api/users/me/wishlist         # add to wishlist
DEL  /api/users/me/wishlist/:id     # remove from wishlist
```

### Eye-Test Service (8087)
```
GET  /api/eye-test/slots            # available slots
POST /api/eye-test/bookings         # book
GET  /api/eye-test/bookings         # user bookings
PUT  /api/eye-test/bookings/:id/cancel
```

---

## AWS Deployment

```
┌─────────────────────────────────────────────────────────┐
│                     Route 53 (DNS)                       │
└─────────────────────┬───────────────────────────────────┘
                      │
              ┌───────▼────────┐
              │  CloudFront     │  CDN + WAF
              │  (S3 Frontend) │
              └───────┬────────┘
                      │
              ┌───────▼────────┐
              │  ALB (HTTPS)   │  Application Load Balancer
              └───────┬────────┘
                      │
        ┌─────────────▼──────────────┐
        │      ECS Fargate Cluster    │
        │  ┌──────────────────────┐   │
        │  │  API Gateway Service  │   │
        │  └──────────────────────┘   │
        │  ┌────────┐ ┌────────────┐  │
        │  │  Auth  │ │  Product   │  │
        │  └────────┘ └────────────┘  │
        │  ┌────────┐ ┌────────────┐  │
        │  │ Order  │ │  Payment   │  │
        │  └────────┘ └────────────┘  │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │         Data Layer           │
        │  ┌──────┐ ┌───────────────┐ │
        │  │ RDS  │ │ ElastiCache   │ │
        │  │ PG16 │ │ Redis         │ │
        │  └──────┘ └───────────────┘ │
        │  ┌────────────────────────┐  │
        │  │    S3 + CloudFront     │  │
        │  │  (Images, Assets)      │  │
        │  └────────────────────────┘  │
        └──────────────────────────────┘
```
