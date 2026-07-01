import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'
import { useFeaturedProducts } from '@/hooks/api/useProducts'
import { cn } from '@/lib/utils'

function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white shadow-product flex-shrink-0 w-56 sm:w-64">
      <div className="skeleton aspect-[4/3]" />
      <div className="p-3.5 space-y-2">
        <div className="skeleton h-3 w-16 rounded" />
        <div className="skeleton h-4 w-40 rounded" />
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-5 w-20 rounded" />
      </div>
    </div>
  )
}

export default function TrendingProducts() {
  const { data, isLoading } = useFeaturedProducts(10)
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return
    const amount = dir === 'left' ? -280 : 280
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' })
  }

  return (
    <section className="py-12 md:py-16 bg-gray-50">
      <div className="page-container">
        <div className="section-header">
          <div>
            <p className="text-brand-600 text-sm font-semibold uppercase tracking-wider mb-1">
              Editor's Pick
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Trending Right Now
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex gap-2">
              <button
                onClick={() => scroll('left')}
                className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <Link
              to="/catalog?featured=true"
              className="flex items-center gap-1 text-sm text-brand-600 font-semibold hover:gap-2 transition-all"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto no-scrollbar pb-2"
        >
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            : data?.map((product) => (
                <div
                  key={product.id}
                  className="flex-shrink-0 w-56 sm:w-64"
                >
                  <ProductCard product={product} />
                </div>
              ))}
        </div>
      </div>
    </section>
  )
}
