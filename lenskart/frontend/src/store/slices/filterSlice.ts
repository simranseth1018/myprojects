import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ProductFilters } from '@/types/product'

interface FilterState {
  filters: ProductFilters
  sortBy: string
  sortDirection: 'asc' | 'desc'
  page: number
  pageSize: number
  searchQuery: string
}

const initialState: FilterState = {
  filters: {},
  sortBy: 'createdAt',
  sortDirection: 'desc',
  page: 0,
  pageSize: 24,
  searchQuery: '',
}

const filterSlice = createSlice({
  name: 'filter',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<ProductFilters>>) => {
      state.filters = { ...state.filters, ...action.payload }
      state.page = 0
    },
    resetFilters: (state) => {
      state.filters = {}
      state.page = 0
      state.searchQuery = ''
    },
    setSort: (state, action: PayloadAction<{ field: string; direction: 'asc' | 'desc' }>) => {
      state.sortBy = action.payload.field
      state.sortDirection = action.payload.direction
      state.page = 0
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload
      state.page = 0
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
      state.page = 0
    },
    toggleFilter: (
      state,
      action: PayloadAction<{ key: keyof ProductFilters; value: string }>,
    ) => {
      const { key, value } = action.payload
      const current = state.filters[key] as string[] | undefined
      if (Array.isArray(current)) {
        const idx = current.indexOf(value)
        if (idx === -1) {
          (state.filters[key] as string[]) = [...current, value]
        } else {
          (state.filters[key] as string[]) = current.filter((v) => v !== value)
        }
      } else {
        (state.filters[key] as string[]) = [value]
      }
      state.page = 0
    },
  },
})

export const {
  setFilters,
  resetFilters,
  setSort,
  setPage,
  setPageSize,
  setSearchQuery,
  toggleFilter,
} = filterSlice.actions

export default filterSlice.reducer
