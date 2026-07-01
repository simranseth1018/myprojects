import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface WishlistState {
  productIds: string[]
}

// Persisted in localStorage for guests, synced to server for logged-in users
const stored = localStorage.getItem('wishlist')
const initialState: WishlistState = {
  productIds: stored ? JSON.parse(stored) : [],
}

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    setWishlist: (state, action: PayloadAction<string[]>) => {
      state.productIds = action.payload
      localStorage.setItem('wishlist', JSON.stringify(action.payload))
    },
    toggleWishlistItem: (state, action: PayloadAction<string>) => {
      const idx = state.productIds.indexOf(action.payload)
      if (idx === -1) {
        state.productIds.push(action.payload)
      } else {
        state.productIds.splice(idx, 1)
      }
      localStorage.setItem('wishlist', JSON.stringify(state.productIds))
    },
    addToWishlist: (state, action: PayloadAction<string>) => {
      if (!state.productIds.includes(action.payload)) {
        state.productIds.push(action.payload)
        localStorage.setItem('wishlist', JSON.stringify(state.productIds))
      }
    },
    removeFromWishlist: (state, action: PayloadAction<string>) => {
      state.productIds = state.productIds.filter((id) => id !== action.payload)
      localStorage.setItem('wishlist', JSON.stringify(state.productIds))
    },
    clearWishlist: (state) => {
      state.productIds = []
      localStorage.removeItem('wishlist')
    },
  },
})

export const {
  setWishlist,
  toggleWishlistItem,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
} = wishlistSlice.actions

export default wishlistSlice.reducer
