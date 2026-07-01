import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import type { Product, ProductFilters, LensOption, Review, ReviewStats } from '@/types/product'
import type { PaginatedResponse, PageRequest } from '@/types/api'
import { buildSearchParams } from '@/lib/utils'

const PRODUCTS_KEY = 'products'
const CATEGORIES_KEY = 'categories'

// ---- Fetch all products with filters ----
export function useProducts(
  filters: ProductFilters,
  page: PageRequest,
  enabled = true,
) {
  const params = buildSearchParams({
    ...filters,
    page: page.page ?? 0,
    size: page.size ?? 24,
    sort: page.sort ?? 'createdAt',
    direction: page.direction ?? 'desc',
  })

  return useQuery({
    queryKey: [PRODUCTS_KEY, 'list', params.toString()],
    queryFn: async () => {
      const res = await apiClient.get<{ data: PaginatedResponse<Product> }>(
        `/products?${params.toString()}`,
      )
      return res.data.data
    },
    enabled,
    placeholderData: (prev) => prev,
  })
}

// ---- Infinite scroll products ----
export function useInfiniteProducts(filters: ProductFilters, size = 24) {
  const baseParams = buildSearchParams({ ...filters, size })

  return useInfiniteQuery({
    queryKey: [PRODUCTS_KEY, 'infinite', baseParams.toString()],
    queryFn: async ({ pageParam = 0 }) => {
      const params = new URLSearchParams(baseParams)
      params.set('page', String(pageParam))
      const res = await apiClient.get<{ data: PaginatedResponse<Product> }>(
        `/products?${params.toString()}`,
      )
      return res.data.data
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.last) return undefined
      return lastPage.currentPage + 1
    },
  })
}

// ---- Single product by slug ----
export function useProduct(slug: string) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, 'detail', slug],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Product }>(`/products/slug/${slug}`)
      return res.data.data
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 10,
  })
}

// ---- Product by ID ----
export function useProductById(id: string) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, 'detail', 'id', id],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Product }>(`/products/${id}`)
      return res.data.data
    },
    enabled: !!id,
  })
}

// ---- Search ----
export function useProductSearch(query: string, size = 10) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, 'search', query],
    queryFn: async () => {
      const res = await apiClient.get<{ data: PaginatedResponse<Product> }>(
        `/products/search?q=${encodeURIComponent(query)}&size=${size}`,
      )
      return res.data.data
    },
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 2,
  })
}

// ---- Featured products ----
export function useFeaturedProducts(limit = 8) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, 'featured', limit],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Product[] }>(
        `/products/featured?limit=${limit}`,
      )
      return res.data.data
    },
    staleTime: 1000 * 60 * 15,
  })
}

// ---- Categories ----
export function useCategories() {
  return useQuery({
    queryKey: [CATEGORIES_KEY],
    queryFn: async () => {
      const res = await apiClient.get<{ data: import('@/types/product').Category[] }>('/categories')
      return res.data.data
    },
    staleTime: 1000 * 60 * 30,
  })
}

// ---- Lens options ----
export function useLensOptions() {
  return useQuery({
    queryKey: ['lensOptions'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: LensOption[] }>('/lens-options')
      return res.data.data
    },
    staleTime: 1000 * 60 * 60,
  })
}

// ---- Product reviews ----
export function useProductReviews(productId: string, page = 0, size = 10) {
  return useQuery({
    queryKey: ['reviews', productId, page, size],
    queryFn: async () => {
      const res = await apiClient.get<{ data: PaginatedResponse<Review> }>(
        `/products/${productId}/reviews?page=${page}&size=${size}`,
      )
      return res.data.data
    },
    enabled: !!productId,
  })
}

export function useReviewStats(productId: string) {
  return useQuery({
    queryKey: ['reviewStats', productId],
    queryFn: async () => {
      const res = await apiClient.get<{ data: ReviewStats }>(
        `/products/${productId}/reviews/stats`,
      )
      return res.data.data
    },
    enabled: !!productId,
  })
}

// ---- Submit review ----
export function useSubmitReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      productId: string
      rating: number
      title: string
      body: string
    }) => {
      const res = await apiClient.post(`/products/${data.productId}/reviews`, data)
      return res.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.productId] })
      queryClient.invalidateQueries({ queryKey: ['reviewStats', variables.productId] })
    },
  })
}

// ---- Admin: create/update/delete ----
export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Product>) => {
      const res = await apiClient.post('/admin/products', data)
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Product> }) => {
      const res = await apiClient.put(`/admin/products/${id}`, data)
      return res.data.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY, 'detail', variables.id] })
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY, 'list'] })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/admin/products/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
    },
  })
}
