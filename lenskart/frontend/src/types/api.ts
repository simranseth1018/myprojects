export interface ApiResponse<T = unknown> {
  data: T
  message: string
  success: boolean
  timestamp: string
}

export interface ApiError {
  message: string
  code: string
  status: number
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  currentPage: number
  pageSize: number
  first: boolean
  last: boolean
}

export interface PageRequest {
  page?: number
  size?: number
  sort?: string
  direction?: 'asc' | 'desc'
}
