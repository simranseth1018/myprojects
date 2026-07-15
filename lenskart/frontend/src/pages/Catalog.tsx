import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SlidersHorizontal, Grid2X2, List, Search, X,
  ChevronDown, Loader2,
} from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'
import FilterSidebar from '@/components/product/FilterSidebar'
import { useAppSelector, useAppDispatch } from '@/store'
import { setFilters, resetFilters, setSort, setPage, setSearchQuery } from '@/store/slices/filterSlice'
import { useProducts } from '@/hooks/api/useProducts'
import { useDebounce } from '@/hooks/ui/useDebounce'
import { cn } from '@/lib/utils'

const SORT_OPTIONS = [
  { label: 'Newest First', field: 'createdAt', direction: 'desc' as const },
  { label: 'Oldest First', field: 'createdAt', direction: 'asc' as const },
  { label: 'Price: Low to High', field: 'finalPrice', direction: 'asc' as const },
  { label: 'Price: High to Low', field: 'finalPrice', direction: 'desc' as const },
  { label: 'Best Rated', field: 'rating', direction: 'desc' as const },
  { label: 'Most Popular', field: 'reviewCount', direction: 'desc' as const },
]

type ViewMode = 'grid' | 'list'

function ProductCardSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === 'list') {
    return (
      <div className="flex gap-4 bg-white rounded-2xl p-4 shadow-product">
        <div className="skeleton w-40 h-32 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3 w-16" />
          <div className="skeleton h-5 w-3/4" />
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-6 w-20" />
        </div>
      </div>
    )
  }
  return (
    <div className="rounded-2xl overflow-hidden bg-white shadow-product">
      <div className="skeleton aspect-[4/3]" />
      <div className="p-3.5 space-y-2">
        <div className="skeleton h-3 w-16 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-5 w-20 rounded" />
      </div>
    </div>
  )
}

export default function Catalog() {
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()
  const { filters, sortBy, sortDirection, page, pageSize, searchQuery } = useAppSelector((s) => s.filter)

  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
  const [isSortOpen, setIsSortOpen] = useState(false)
  const [localSearch, setLocalSearch] = useState(searchQuery)
  const debouncedSearch = useDebounce(localSearch, 400)

  // Sync URL params to filters
  useEffect(() => {
    const category = searchParams.get('category')
    const gender = searchParams.get('gender')
    const blueLight = searchParams.get('blueLight')
    const q = searchParams.get('q')

    dispatch(resetFilters())

    const newFilters: Record<string, unknown> = {}
    if (category) newFilters.category = category
    if (gender) newFilters.gender = [gender as 'MEN' | 'WOMEN' | 'UNISEX' | 'KIDS']
    if (blueLight === 'true') newFilters.isBlueLight = true

    if (Object.keys(newFilters).length > 0) dispatch(setFilters(newFilters))
    if (q) { setLocalSearch(q); dispatch(setSearchQuery(q)) }
    else { setLocalSearch(''); dispatch(setSearchQuery('')) }
    dispatch(setPage(0))
  }, [searchParams])

  useEffect(() => {
    dispatch(setSearchQuery(debouncedSearch))
  }, [debouncedSearch])

  const { data, isLoading, isFetching } = useProducts(
    { ...filters, ...(searchQuery ? { search: searchQuery } : {}) } as typeof filters,
    { page, size: pageSize, sort: sortBy, direction: sortDirection },
  )

  const activeSort = SORT_OPTIONS.find(
    (o) => o.field === sortBy && o.direction === sortDirection,
  )

  const totalPages = data?.totalPages ?? 0
  const totalElements = data?.totalElements ?? 0

  return (
    <>
      <Helmet>
        <title>Eyeglasses & Sunglasses | Lenskart</title>
        <meta name="description" content="Browse 5000+ eyeglasses, sunglasses & contact lenses. Filter by shape, material, price & more." />
      </Helmet>

      <div className="bg-gray-50 min-h-screen">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-100">
          <div className="page-container py-3 text-sm text-gray-500">
            <span>Home</span> <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">
              {filters.category ? filters.category.charAt(0).toUpperCase() + filters.category.slice(1) : 'All Products'}
            </span>
          </div>
        </div>

        <div className="page-container py-6">
          {/* Top bar */}
          <div className="flex items-center gap-3 mb-6">
            {/* Search */}
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="input-field pl-9 pr-8"
              />
              {localSearch && (
                <button
                  onClick={() => { setLocalSearch(''); dispatch(setSearchQuery('')) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Mobile filter toggle */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden btn-outline gap-2 py-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>

            {/* Sort */}
            <div className="relative ml-auto">
              <button
                onClick={() => setIsSortOpen((o) => !o)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium hover:border-gray-300 transition-all"
              >
                <span className="hidden sm:inline text-gray-500">Sort:</span>
                <span>{activeSort?.label || 'Newest First'}</span>
                <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', isSortOpen && 'rotate-180')} />
              </button>

              <AnimatePresence>
                {isSortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => {
                          dispatch(setSort({ field: opt.field, direction: opt.direction }))
                          setIsSortOpen(false)
                        }}
                        className={cn(
                          'w-full text-left px-4 py-2 text-sm transition-colors',
                          opt.field === sortBy && opt.direction === sortDirection
                            ? 'text-brand-600 bg-brand-50 font-semibold'
                            : 'text-gray-700 hover:bg-gray-50',
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* View mode */}
            <div className="hidden sm:flex border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2.5 transition-colors',
                  viewMode === 'grid' ? 'bg-brand-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50',
                )}
              >
                <Grid2X2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2.5 transition-colors',
                  viewMode === 'list' ? 'bg-brand-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50',
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-6">
            {/* Desktop filter sidebar */}
            <div className="hidden lg:block">
              <FilterSidebar />
            </div>

            {/* Mobile filter */}
            <FilterSidebar
              isOpen={isMobileFilterOpen}
              onClose={() => setIsMobileFilterOpen(false)}
            />

            {/* Product grid */}
            <div className="flex-1 min-w-0">
              {/* Count & loading */}
              <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
                <span>
                  {isLoading ? 'Loading...' : `${totalElements.toLocaleString()} products found`}
                </span>
                {isFetching && !isLoading && (
                  <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                )}
              </div>

              {/* Products */}
              {isLoading ? (
                <div className={cn(
                  'grid gap-4',
                  viewMode === 'grid'
                    ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4'
                    : 'grid-cols-1',
                )}>
                  {Array.from({ length: pageSize }).map((_, i) => (
                    <ProductCardSkeleton key={i} viewMode={viewMode} />
                  ))}
                </div>
              ) : data?.content.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">No products found</h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Try adjusting your filters or search term.
                  </p>
                  <button
                    onClick={() => dispatch(setFilters({}))}
                    className="btn-outline"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className={cn(
                  'grid gap-4',
                  viewMode === 'grid'
                    ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4'
                    : 'grid-cols-1',
                )}>
                  {data?.content.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    disabled={page === 0}
                    onClick={() => dispatch(setPage(page - 1))}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:border-brand-400 hover:text-brand-600 transition-all"
                  >
                    Previous
                  </button>

                  {Array.from({ length: Math.min(totalPages, 7) }).map((_, idx) => {
                    const pageNum = idx
                    return (
                      <button
                        key={pageNum}
                        onClick={() => dispatch(setPage(pageNum))}
                        className={cn(
                          'w-9 h-9 rounded-xl text-sm font-medium transition-all',
                          page === pageNum
                            ? 'bg-brand-600 text-white shadow-md'
                            : 'border border-gray-200 hover:border-brand-400 hover:text-brand-600',
                        )}
                      >
                        {pageNum + 1}
                      </button>
                    )
                  })}

                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => dispatch(setPage(page + 1))}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:border-brand-400 hover:text-brand-600 transition-all"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
