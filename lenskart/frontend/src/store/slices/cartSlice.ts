import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Cart, CartItem } from '@/types/order'

interface CartState {
  cart: Cart | null
  isOpen: boolean
  isLoading: boolean
}

const initialState: CartState = {
  cart: null,
  isOpen: false,
  isLoading: false,
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCart: (state, action: PayloadAction<Cart>) => {
      state.cart = action.payload
    },
    clearCart: (state) => {
      state.cart = null
    },
    openCart: (state) => {
      state.isOpen = true
    },
    closeCart: (state) => {
      state.isOpen = false
    },
    toggleCart: (state) => {
      state.isOpen = !state.isOpen
    },
    setCartLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    updateItemQuantity: (state, action: PayloadAction<{ itemId: string; quantity: number }>) => {
      if (state.cart) {
        const item = state.cart.items.find((i) => i.id === action.payload.itemId)
        if (item) {
          item.quantity = action.payload.quantity
          item.totalPrice = item.priceAtAdd * action.payload.quantity
          state.cart.subtotal = state.cart.items.reduce((s, i) => s + i.totalPrice, 0)
          state.cart.itemCount = state.cart.items.reduce((s, i) => s + i.quantity, 0)
        }
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      if (state.cart) {
        state.cart.items = state.cart.items.filter((i) => i.id !== action.payload)
        state.cart.subtotal = state.cart.items.reduce((s, i) => s + i.totalPrice, 0)
        state.cart.itemCount = state.cart.items.reduce((s, i) => s + i.quantity, 0)
      }
    },
    addItemOptimistic: (state, action: PayloadAction<CartItem>) => {
      if (state.cart) {
        const existing = state.cart.items.find(
          (i) =>
            i.product.id === action.payload.product.id &&
            i.variant?.id === action.payload.variant?.id,
        )
        if (existing) {
          existing.quantity += action.payload.quantity
          existing.totalPrice = existing.priceAtAdd * existing.quantity
        } else {
          state.cart.items.push(action.payload)
        }
        state.cart.subtotal = state.cart.items.reduce((s, i) => s + i.totalPrice, 0)
        state.cart.itemCount = state.cart.items.reduce((s, i) => s + i.quantity, 0)
      }
    },
  },
})

export const {
  setCart,
  clearCart,
  openCart,
  closeCart,
  toggleCart,
  setCartLoading,
  updateItemQuantity,
  removeItem,
  addItemOptimistic,
} = cartSlice.actions

export default cartSlice.reducer
