import type { Product, ProductVariant, LensOption } from './product'
import type { Address, Prescription } from './user'

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED'

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'
export type PaymentMethod = 'RAZORPAY' | 'COD' | 'WALLET' | 'UPI'

export interface CartItem {
  id: string
  cartId: string
  product: Product
  variant?: ProductVariant
  lensOption?: LensOption
  prescription?: Prescription
  quantity: number
  priceAtAdd: number
  totalPrice: number
}

export interface Cart {
  id: string
  userId?: string
  sessionId?: string
  items: CartItem[]
  subtotal: number
  itemCount: number
  updatedAt: string
}

export interface OrderItem {
  id: string
  orderId: string
  product: Product
  variant: ProductVariant
  lensOption?: LensOption
  prescription?: Prescription
  quantity: number
  unitPrice: number
  lensPrice: number
  totalPrice: number
  productSnapshot: Partial<Product>
}

export interface OrderTracking {
  id: string
  orderId: string
  status: OrderStatus
  description: string
  location?: string
  trackingNumber?: string
  createdAt: string
}

export interface Order {
  id: string
  orderNumber: string
  userId: string
  address: Address
  status: OrderStatus
  subtotal: number
  discountAmount: number
  shippingAmount: number
  totalAmount: number
  couponCode?: string
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  razorpayOrderId?: string
  razorpayPaymentId?: string
  notes?: string
  items: OrderItem[]
  tracking: OrderTracking[]
  createdAt: string
  updatedAt: string
}

export interface CheckoutFormData {
  addressId?: string
  newAddress?: {
    fullName: string
    phone: string
    line1: string
    line2?: string
    city: string
    state: string
    pincode: string
    type: 'HOME' | 'WORK' | 'OTHER'
  }
  paymentMethod: PaymentMethod
  couponCode?: string
  notes?: string
}

export interface ApplyCouponResponse {
  valid: boolean
  discountAmount: number
  discountPercent?: number
  message: string
}

export interface EyeTestBooking {
  id: string
  userId?: string
  name: string
  phone: string
  email?: string
  address: string
  city: string
  pincode: string
  preferredDate: string
  preferredSlot: string
  status: 'BOOKED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  notes?: string
  createdAt: string
}

export interface Store {
  id: string
  name: string
  address: string
  city: string
  state: string
  pincode: string
  phone?: string
  latitude?: number
  longitude?: number
  timings: Record<string, string>
  services: string[]
  isActive: boolean
  distance?: number
}
