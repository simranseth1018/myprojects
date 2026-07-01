export type UserRole = 'CUSTOMER' | 'ADMIN' | 'OPTICIAN'

export interface User {
  id: string
  email: string
  fullName: string
  phone?: string
  avatarUrl?: string
  googleId?: string
  role: UserRole
  emailVerified: boolean
  isActive: boolean
  createdAt: string
}

export interface Address {
  id: string
  userId: string
  type: 'HOME' | 'WORK' | 'OTHER'
  fullName: string
  phone: string
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  isDefault: boolean
}

export interface Prescription {
  id: string
  userId: string
  name: string
  rightSph?: number
  rightCyl?: number
  rightAxis?: number
  rightAdd?: number
  leftSph?: number
  leftCyl?: number
  leftAxis?: number
  leftAdd?: number
  pdRight?: number
  pdLeft?: number
  fileUrl?: string
  isVerified: boolean
  expiresAt?: string
  createdAt: string
}

export type FaceShape = 'OVAL' | 'ROUND' | 'SQUARE' | 'HEART' | 'DIAMOND' | 'OBLONG' | 'TRIANGLE'

export interface FaceAnalysisResult {
  shape: FaceShape
  confidence: number
  recommendations: string[]
  suitableFrameShapes: string[]
}
