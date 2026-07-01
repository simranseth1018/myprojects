import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/store'
import { toggleFilter, setFilters, resetFilters } from '@/store/slices/filterSlice'
import { formatPrice, cn } from '@/lib/utils'
import type { FrameShape, FrameType, FrameMaterial, Gender } from '@/types/product'

const FRAME_SHAPES: { value: FrameShape; label: string }[] = [
  { value: 'ROUND', label: 'Round' },
  { value: 'SQUARE', label: 'Square' },
  { value: 'OVAL', label: 'Oval' },
  { value: 'CAT_EYE', label: 'Cat Eye' },
  { value: 'RECTANGLE', label: 'Rectangle' },
  { value: 'AVIATOR', label: 'Aviator' },
  { value: 'WAYFARER', label: 'Wayfarer' },
  { value: 'GEOMETRIC', label: 'Geometric' },
]

const FRAME_TYPES: { value: FrameType; label: string }[] = [
  { value: 'FULL_RIM', label: 'Full Rim' },
  { value: 'HALF_RIM', label: 'Half Rim' },
  { value: 'RIMLESS', label: 'Rimless' },
]

const FRAME_MATERIALS: { value: FrameMaterial; label: string }[] = [
  { value: 'METAL', label: 'Metal' },
  { value: 'PLASTIC', label: 'Plastic' },
  { value: 'TITANIUM', label: 'Titanium' },
  { value: 'TR90', label: 'TR90' },
  { value: 'ACETATE', label: 'Acetate' },
]

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'MEN', label: 'Men' },
  { value: 'WOMEN', label: 'Women' },
  { value: 'UNISEX', label: 'Unisex' },
  { value: 'KIDS', label: 'Kids' },
]

const PRICE_RANGES = [
  { label: 'Under ₹500', min: 0, max: 500 },
  { label: '₹500 - ₹1000', min: 500, max: 1000 },
  { label: '₹1000 - ₹2000', min: 1000, max: 2000 },
  { label: '₹2000 - ₹5000', min: 2000, max: 5000 },
  { label: 'Above ₹5000', min: 5000, max: undefined },
]

interface FilterSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-100 py-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="font-semibold text-sm text-gray-900">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface CheckboxFilterProps {
  label: string
  checked: boolean
  onChange: () => void
  count?: number
}

function CheckboxFilter({ label, checked, onChange, count }: CheckboxFilterProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div
        onClick={onChange}
        className={cn(
          'w-4 h-4 rounded border-2 flex items-center justify-center transition-all',
          checked
            ? 'bg-brand-600 border-brand-600'
            : 'border-gray-300 group-hover:border-brand-400',
        )}
      >
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
            <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span className="text-sm text-gray-700 group-hover:text-gray-900 flex-1">{label}</span>
      {count !== undefined && (
        <span className="text-xs text-gray-400">{count}</span>
      )}
    </label>
  )
}

interface FilterSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function FilterSidebar({ isOpen, onClose }: FilterSidebarProps) {
  const dispatch = useAppDispatch()
  const { filters } = useAppSelector((s) => s.filter)

  const isChecked = (key: keyof typeof filters, value: string) => {
    const current = filters[key] as string[] | undefined
    return Array.isArray(current) && current.includes(value)
  }

  const handleToggle = (key: Parameters<typeof toggleFilter>[0]['key'], value: string) => {
    dispatch(toggleFilter({ key, value }))
  }

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  const content = (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-brand-600" />
          <span className="font-bold text-gray-900">Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 bg-brand-600 text-white text-xs rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {activeFilterCount > 0 && (
            <button
              onClick={() => dispatch(resetFilters())}
              className="text-xs text-brand-600 font-semibold hover:text-brand-700"
            >
              Clear All
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter groups */}
      <div className="flex-1 overflow-y-auto px-4">
        {/* Gender */}
        <FilterSection title="Gender">
          <div className="space-y-2">
            {GENDERS.map(({ value, label }) => (
              <CheckboxFilter
                key={value}
                label={label}
                checked={isChecked('gender', value)}
                onChange={() => handleToggle('gender', value)}
              />
            ))}
          </div>
        </FilterSection>

        {/* Price Range */}
        <FilterSection title="Price Range">
          <div className="space-y-2">
            {PRICE_RANGES.map(({ label, min, max }) => (
              <CheckboxFilter
                key={label}
                label={label}
                checked={
                  filters.minPrice === min && filters.maxPrice === max
                }
                onChange={() =>
                  dispatch(setFilters({ minPrice: min, maxPrice: max }))
                }
              />
            ))}
          </div>
        </FilterSection>

        {/* Frame Shape */}
        <FilterSection title="Frame Shape">
          <div className="grid grid-cols-2 gap-1.5">
            {FRAME_SHAPES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleToggle('frameShape', value)}
                className={cn(
                  'px-3 py-2 rounded-lg text-xs font-medium border transition-all',
                  isChecked('frameShape', value)
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-brand-400 hover:text-brand-600',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Frame Type */}
        <FilterSection title="Frame Type">
          <div className="space-y-2">
            {FRAME_TYPES.map(({ value, label }) => (
              <CheckboxFilter
                key={value}
                label={label}
                checked={isChecked('frameType', value)}
                onChange={() => handleToggle('frameType', value)}
              />
            ))}
          </div>
        </FilterSection>

        {/* Frame Material */}
        <FilterSection title="Frame Material" defaultOpen={false}>
          <div className="space-y-2">
            {FRAME_MATERIALS.map(({ value, label }) => (
              <CheckboxFilter
                key={value}
                label={label}
                checked={isChecked('frameMaterial', value)}
                onChange={() => handleToggle('frameMaterial', value)}
              />
            ))}
          </div>
        </FilterSection>

        {/* Special Features */}
        <FilterSection title="Features" defaultOpen={false}>
          <div className="space-y-2">
            {[
              { key: 'isBlueLight' as const, label: 'Blue Light Blocking' },
              { key: 'isPrescription' as const, label: 'Prescription Ready' },
              { key: 'isSunglasses' as const, label: 'Sunglasses' },
              { key: 'inStock' as const, label: 'In Stock Only' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer group">
                <div
                  onClick={() => dispatch(setFilters({ [key]: !filters[key] }))}
                  className={cn(
                    'w-4 h-4 rounded border-2 flex items-center justify-center transition-all',
                    filters[key]
                      ? 'bg-brand-600 border-brand-600'
                      : 'border-gray-300 group-hover:border-brand-400',
                  )}
                >
                  {filters[key] && (
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                      <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Rating */}
        <FilterSection title="Minimum Rating" defaultOpen={false}>
          <div className="space-y-2">
            {[4, 3, 2].map((r) => (
              <button
                key={r}
                onClick={() => dispatch(setFilters({ rating: filters.rating === r ? undefined : r }))}
                className={cn(
                  'flex items-center gap-2 text-sm w-full text-left px-2 py-1 rounded-lg transition-colors',
                  filters.rating === r ? 'bg-brand-50 text-brand-600' : 'hover:bg-gray-50',
                )}
              >
                <span className="text-gold-400">{'★'.repeat(r)}</span>
                <span className="text-gray-400">{'★'.repeat(5 - r)}</span>
                <span className="text-gray-600">& above</span>
              </button>
            ))}
          </div>
        </FilterSection>
      </div>
    </div>
  )

  // Desktop sidebar
  if (isOpen === undefined) {
    return (
      <div className="w-64 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24 max-h-[calc(100vh-7rem)]">
        {content}
      </div>
    )
  }

  // Mobile drawer
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed inset-y-0 left-0 w-80 bg-white z-50 overflow-hidden"
          >
            {content}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
