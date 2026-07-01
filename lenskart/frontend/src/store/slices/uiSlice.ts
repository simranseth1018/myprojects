import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

type Theme = 'light' | 'dark' | 'system'

interface UIState {
  theme: Theme
  isMobileMenuOpen: boolean
  isSearchOpen: boolean
  activeModal: string | null
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' | 'warning' }>
  pageLoading: boolean
}

const initialState: UIState = {
  theme: (localStorage.getItem('theme') as Theme) || 'light',
  isMobileMenuOpen: false,
  isSearchOpen: false,
  activeModal: null,
  toasts: [],
  pageLoading: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload
      localStorage.setItem('theme', action.payload)
    },
    openMobileMenu: (state) => {
      state.isMobileMenuOpen = true
    },
    closeMobileMenu: (state) => {
      state.isMobileMenuOpen = false
    },
    openSearch: (state) => {
      state.isSearchOpen = true
    },
    closeSearch: (state) => {
      state.isSearchOpen = false
    },
    openModal: (state, action: PayloadAction<string>) => {
      state.activeModal = action.payload
    },
    closeModal: (state) => {
      state.activeModal = null
    },
    setPageLoading: (state, action: PayloadAction<boolean>) => {
      state.pageLoading = action.payload
    },
  },
})

export const {
  setTheme,
  openMobileMenu,
  closeMobileMenu,
  openSearch,
  closeSearch,
  openModal,
  closeModal,
  setPageLoading,
} = uiSlice.actions

export default uiSlice.reducer
