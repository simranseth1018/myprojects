export interface Category {
  id: string
  name: string
  slug: string
  parentId?: string
  imageUrl?: string
  description?: string
  displayOrder: number
  isActive: boolean
  children?: Category[]
}

export type FrameType = 'FULL_RIM' | 'HALF_RIM' | 'RIMLESS'
export type FrameShape = 'ROUND' | 'SQUARE' | 'OVAL' | 'CAT_EYE' | 'RECTANGLE' | 'AVIATOR' | 'WAYFARER' | 'GEOMETRIC'
export type FrameMaterial = 'METAL' | 'PLASTIC' | 'TITANIUM' | 'TR90' | 'ACETATE' | 'WOOD'
export type Gender = 'MEN' | 'WOMEN' | 'UNISEX' | 'KIDS'
export type ViewType = 'FRONT' | 'SIDE' | 'ANGLE' | 'ON_FACE' | 'AR_OVERLAY'

export interface ProductImage {
  id: string
  productId: string
  variantId?: string
  url: string
  altText?: string
  displayOrder: number
  isPrimary: boolean
  viewType?: ViewType
}

export interface ProductVariant {
  id: string
  productId: string
  colorName: string
  colorHex?: string
  colorImageUrl?: string
  stockQty: number
  isAvailable: boolean
  images?: ProductImage[]
}

export type LensType = 'SINGLE_VISION' | 'BIFOCAL' | 'PROGRESSIVE' | 'ZERO_POWER'
export type LensCoating = 'ANTI_GLARE' | 'BLUE_CUT' | 'PHOTOCHROMIC' | 'TRANSITIONS' | 'NONE'
export type LensMaterial = 'STANDARD' | 'THIN' | 'ULTRA_THIN' | 'TRIVEX'

export interface LensOption {
  id: string
  type: LensType
  coating: LensCoating
  material: LensMaterial
  name: string
  description: string
  price: number
  isActive: boolean
  recommended?: boolean
}

export interface Product {
  id: string
  sku: string
  name: string
  slug: string
  description: string
  category: Category
  brand: string
  frameType: FrameType
  frameShape: FrameShape
  frameMaterial: FrameMaterial
  gender: Gender
  isPrescription: boolean
  isSunglasses: boolean
  isBlueLight: boolean
  basePrice: number
  discountPercent: number
  finalPrice: number
  rating: number
  reviewCount: number
  isActive: boolean
  isFeatured: boolean
  tags: string[]
  variants: ProductVariant[]
  images: ProductImage[]
  metaTitle?: string
  metaDescription?: string
  createdAt: string
  updatedAt: string
}

export interface ProductListResponse {
  content: Product[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
}

export interface ProductFilters {
  category?: string
  brand?: string[]
  minPrice?: number
  maxPrice?: number
  frameType?: FrameType[]
  frameShape?: FrameShape[]
  frameMaterial?: FrameMaterial[]
  gender?: Gender[]
  rating?: number
  isPrescription?: boolean
  isSunglasses?: boolean
  isBlueLight?: boolean
  tags?: string[]
  inStock?: boolean
}

export interface ProductSortOption {
  label: string
  value: string
  field: string
  direction: 'asc' | 'desc'
}

export interface Review {
  id: string
  productId: string
  userId: string
  userName: string
  userAvatar?: string
  rating: number
  title: string
  body: string
  images: string[]
  isVerifiedPurchase: boolean
  helpfulCount: number
  isApproved: boolean
  createdAt: string
}

export interface ReviewStats {
  average: number
  total: number
  distribution: Record<number, number>
}
