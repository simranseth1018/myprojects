import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'
import type { User, Address, Prescription } from '@/types/user'
import { updateUser } from '@/store/slices/authSlice'
import { setWishlist } from '@/store/slices/wishlistSlice'
import { useAppDispatch } from '@/store'
import { toast } from 'sonner'

const USER_KEY = 'user'

export function useCurrentUser() {
  return useQuery({
    queryKey: [USER_KEY, 'me'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: User }>('/users/me')
      return res.data.data
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const dispatch = useAppDispatch()

  return useMutation({
    mutationFn: async (data: Partial<User>) => {
      const res = await apiClient.put<{ data: User }>('/users/me', data)
      return res.data.data
    },
    onSuccess: (user) => {
      dispatch(updateUser(user))
      queryClient.setQueryData([USER_KEY, 'me'], user)
      toast.success('Profile updated!')
    },
  })
}

// ---- Addresses ----
export function useAddresses() {
  return useQuery({
    queryKey: [USER_KEY, 'addresses'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Address[] }>('/users/me/addresses')
      return res.data.data
    },
  })
}

export function useAddAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Omit<Address, 'id' | 'userId'>) => {
      const res = await apiClient.post('/users/me/addresses', data)
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USER_KEY, 'addresses'] })
      toast.success('Address saved!')
    },
  })
}

export function useUpdateAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Address> }) => {
      const res = await apiClient.put(`/users/me/addresses/${id}`, data)
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USER_KEY, 'addresses'] })
    },
  })
}

export function useDeleteAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/users/me/addresses/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USER_KEY, 'addresses'] })
      toast.success('Address deleted')
    },
  })
}

// ---- Prescriptions ----
export function usePrescriptions() {
  return useQuery({
    queryKey: [USER_KEY, 'prescriptions'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Prescription[] }>('/users/me/prescriptions')
      return res.data.data
    },
  })
}

export function useUploadPrescription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: FormData | Partial<Prescription>) => {
      const isFile = data instanceof FormData
      const res = await apiClient.post('/users/me/prescriptions', data, {
        headers: isFile ? { 'Content-Type': 'multipart/form-data' } : undefined,
      })
      return res.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USER_KEY, 'prescriptions'] })
      toast.success('Prescription saved!')
    },
  })
}

export function useDeletePrescription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/users/me/prescriptions/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USER_KEY, 'prescriptions'] })
    },
  })
}

// ---- Wishlist ----
export function useWishlist() {
  const dispatch = useAppDispatch()

  return useQuery({
    queryKey: [USER_KEY, 'wishlist'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: string[] }>('/users/me/wishlist')
      dispatch(setWishlist(res.data.data))
      return res.data.data
    },
  })
}

export function useToggleWishlist() {
  const queryClient = useQueryClient()
  const dispatch = useAppDispatch()

  return useMutation({
    mutationFn: async ({ productId, inWishlist }: { productId: string; inWishlist: boolean }) => {
      if (inWishlist) {
        await apiClient.delete(`/users/me/wishlist/${productId}`)
        return false
      } else {
        await apiClient.post('/users/me/wishlist', { productId })
        return true
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USER_KEY, 'wishlist'] })
    },
  })
}
