import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'
import apiClient from '@/lib/api'
import type { Cart } from '@/types/order'
import { setCart, openCart, updateItemQuantity, removeItem } from '@/store/slices/cartSlice'
import { toast } from 'sonner'

const CART_KEY = 'cart'

export function useCart() {
  const dispatch = useDispatch()

  return useQuery({
    queryKey: [CART_KEY],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Cart }>('/cart')
      dispatch(setCart(res.data.data))
      return res.data.data
    },
    staleTime: 1000 * 60 * 2,
  })
}

export function useAddToCart() {
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  return useMutation({
    mutationFn: async (data: {
      productId: string
      variantId?: string
      lensOptionId?: string
      prescriptionId?: string
      quantity?: number
    }) => {
      const res = await apiClient.post<{ data: Cart }>('/cart/items', {
        productId: data.productId,
        variantId: data.variantId || null,
        lensOptionId: data.lensOptionId || null,
        prescriptionId: data.prescriptionId || null,
        quantity: data.quantity ?? 1,
      })
      return res.data.data
    },
    onSuccess: (cart) => {
      dispatch(setCart(cart))
      dispatch(openCart())
      queryClient.setQueryData([CART_KEY], cart)
      toast.success('Added to cart!')
    },
  })
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  return useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const res = await apiClient.put<{ data: Cart }>(`/cart/items/${itemId}`, { quantity })
      return res.data.data
    },
    onMutate: ({ itemId, quantity }) => {
      dispatch(updateItemQuantity({ itemId, quantity }))
    },
    onSuccess: (cart) => {
      dispatch(setCart(cart))
      queryClient.setQueryData([CART_KEY], cart)
    },
  })
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient()
  const dispatch = useDispatch()

  return useMutation({
    mutationFn: async (itemId: string) => {
      const res = await apiClient.delete<{ data: Cart }>(`/cart/items/${itemId}`)
      return res.data.data
    },
    onMutate: (itemId) => {
      dispatch(removeItem(itemId))
    },
    onSuccess: (cart) => {
      dispatch(setCart(cart))
      queryClient.setQueryData([CART_KEY], cart)
      toast.success('Item removed')
    },
  })
}

export function useClearCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await apiClient.delete('/cart')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CART_KEY] })
    },
  })
}
