import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import type { Order, CheckoutFormData, EyeTestBooking } from '@/types/order'
import type { PaginatedResponse } from '@/types/api'

const ORDERS_KEY = 'orders'

export function useOrders(page = 0, size = 10) {
  return useQuery({
    queryKey: [ORDERS_KEY, 'list', page, size],
    queryFn: async () => {
      const res = await apiClient.get<{ data: PaginatedResponse<Order> }>(
        `/orders?page=${page}&size=${size}`,
      )
      return res.data.data
    },
  })
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: [ORDERS_KEY, 'detail', id],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Order }>(`/orders/${id}`)
      return res.data.data
    },
    enabled: !!id,
  })
}

export function usePlaceOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CheckoutFormData) => {
      const res = await apiClient.post<{
        data: { order: Order; razorpayOrderId: string; amount: number }
      }>('/orders', data)
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: [ORDERS_KEY] })
    },
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiClient.put(`/orders/${orderId}/cancel`)
      return res.data.data
    },
    onSuccess: (_data, orderId) => {
      queryClient.invalidateQueries({ queryKey: [ORDERS_KEY, 'detail', orderId] })
      queryClient.invalidateQueries({ queryKey: [ORDERS_KEY, 'list'] })
    },
  })
}

export function useVerifyPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      orderId: string
      razorpayOrderId: string
      razorpayPaymentId: string
      razorpaySignature: string
    }) => {
      const res = await apiClient.post('/payment/verify', data)
      return res.data.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [ORDERS_KEY, 'detail', variables.orderId],
      })
    },
  })
}

export function useVerifyPaytmPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      orderId: string
      paytmOrderId: string
      paytmTxnId: string
      paytmChecksum: string
    }) => {
      const res = await apiClient.post('/payment/paytm/verify', {
        order_id: data.orderId,
        paytm_order_id: data.paytmOrderId,
        paytm_txn_id: data.paytmTxnId,
        paytm_checksum: data.paytmChecksum,
      })
      return res.data.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [ORDERS_KEY, 'detail', variables.orderId],
      })
    },
  })
}

export function useInitiatePaytm() {
  return useMutation({
    mutationFn: async (data: { orderId: string; amount: number }) => {
      const res = await apiClient.post('/payment/paytm/initiate', {
        order_id: data.orderId,
        amount: data.amount,
      })
      return res.data.data as { txnToken: string; paytmOrderId: string; amount: string; merchantId: string }
    },
  })
}

export function useApplyCoupon() {
  return useMutation({
    mutationFn: async (data: { code: string; cartId: string }) => {
      const res = await apiClient.post('/orders/apply-coupon', data)
      return res.data.data
    },
  })
}

// Eye Test
export function useEyeTestBookings() {
  return useQuery({
    queryKey: ['eyeTest', 'bookings'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: EyeTestBooking[] }>('/eye-test/bookings')
      return res.data.data
    },
  })
}

export function useBookEyeTest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<EyeTestBooking, 'id' | 'status' | 'createdAt'>) => {
      const res = await apiClient.post('/eye-test/bookings', data)
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eyeTest', 'bookings'] })
    },
  })
}

export function useNearbyStores(pincode: string) {
  return useQuery({
    queryKey: ['stores', pincode],
    queryFn: async () => {
      const res = await apiClient.get(`/stores/nearby?pincode=${pincode}`)
      return res.data.data
    },
    enabled: /^[1-9][0-9]{5}$/.test(pincode),
    staleTime: 1000 * 60 * 30,
  })
}
