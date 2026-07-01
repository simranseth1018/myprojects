import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, ShoppingCart, Star, Eye, Zap } from 'lucide-react'
import { useAppSelector, useAppDispatch } from '@/store'
import { toggleWishlistItem } from '@/store/slices/wishlistSlice'
import { useAddToCart } from '@/hooks/api/useCart'
import { formatPrice, cn } from '@/lib/utils'
import type { Product } from '@/types/product'

interface ProductCardProps {
  product: Product
  showActions?: boolean
  className?: string
}

export default function ProductCard({
  product,
  showActions = true,
  className,
}: ProductCardProps) {
  const dispatch = useAppDispatch()
  const wishlistIds = useAppSelector((s) => s.wishlist.productIds)
  const isWishlisted = wishlistIds.includes(product.id)
  const addToCart = useAddToCart()

  const [selectedVariant, setSelectedVariant] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  const variant = product.variants[selectedVariant]
  const primaryImage = product.images.find((img) => img.isPrimary && img.variantId === variant?.id)
    ?? product.images[0]
  const secondaryImage = product.images.find(
    (img) => img.variantId === variant?.id && !img.isPrimary && img.viewType === 'ANGLE',
  )

  const discount = product.discountPercent

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart.mutate({ productId: product.id, variantId: variant?.id ?? '' })
  }

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dispatch(toggleWishlistItem(product.id))
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.4 }}
      className={cn('product-card group', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/products/${product.slug}`} className="block">
        {/* Image container */}
        <div className="relative overflow-hidden bg-gray-50 aspect-[4/3]">
          {/* Primary image */}
          <img
            src={primaryImage?.url || '/placeholder.png'}
            alt={product.name}
            className={cn(
              'w-full h-full object-cover transition-all duration-500',
              secondaryImage && isHovered ? 'opacity-0 scale-105' : 'opacity-100 scale-100',
            )}
          />
          {/* Secondary/hover image */}
          {secondaryImage && (
            <img
              src={secondaryImage.url}
              alt={`${product.name} - Angle view`}
              className={cn(
                'absolute inset-0 w-full h-full object-cover transition-all duration-500',
                isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-105',
              )}
            />
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {discount > 0 && (
              <span className="badge bg-red-500 text-white">
                -{discount}%
              </span>
            )}
            {product.isFeatured && (
              <span className="badge bg-brand-600 text-white">
                <Zap className="w-2.5 h-2.5 mr-0.5" /> Trending
              </span>
            )}
            {product.isBlueLight && (
              <span className="badge bg-purple-600 text-white">
                Blue Light
              </span>
            )}
          </div>

          {/* Wishlist button */}
          <button
            onClick={handleToggleWishlist}
            className={cn(
              'absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200',
              'bg-white shadow-md hover:scale-110',
              isWishlisted ? 'text-red-500' : 'text-gray-400 hover:text-red-400',
            )}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={cn('w-4 h-4', isWishlisted && 'fill-red-500')} />
          </button>

          {/* Quick actions */}
          {showActions && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 8 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-3 left-3 right-3 flex gap-2"
            >
              <button
                onClick={handleAddToCart}
                disabled={addToCart.isPending}
                className="flex-1 btn-primary py-2 text-xs gap-1.5 rounded-xl"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                {addToCart.isPending ? 'Adding...' : 'Add to Cart'}
              </button>
              <Link
                to={`/try-on?product=${product.id}&variant=${variant?.id}`}
                onClick={(e) => e.stopPropagation()}
                className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-md hover:bg-gray-50 transition-colors"
                aria-label="Virtual try-on"
              >
                <Eye className="w-4 h-4 text-brand-600" />
              </Link>
            </motion.div>
          )}
        </div>

        {/* Details */}
        <div className="p-3.5">
          {/* Brand */}
          <p className="text-xs text-brand-600 font-semibold uppercase tracking-wide mb-0.5">
            {product.brand}
          </p>

          {/* Name */}
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-2 group-hover:text-brand-600 transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          {product.reviewCount > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'w-3 h-3',
                      star <= Math.round(product.rating)
                        ? 'star-filled'
                        : 'star-empty',
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">({product.reviewCount})</span>
            </div>
          )}

          {/* Color variants */}
          {product.variants.length > 1 && (
            <div className="flex items-center gap-1.5 mb-2.5">
              {product.variants.slice(0, 5).map((v, idx) => (
                <button
                  key={v.id}
                  title={v.colorName}
                  onClick={(e) => { e.preventDefault(); setSelectedVariant(idx) }}
                  className={cn(
                    'w-4 h-4 rounded-full border-2 transition-transform hover:scale-110',
                    idx === selectedVariant
                      ? 'border-brand-500 scale-110'
                      : 'border-transparent',
                  )}
                  style={{ backgroundColor: v.colorHex || '#ccc' }}
                />
              ))}
              {product.variants.length > 5 && (
                <span className="text-xs text-gray-400">+{product.variants.length - 5}</span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-gray-900">
              {formatPrice(product.finalPrice)}
            </span>
            {discount > 0 && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.basePrice)}
              </span>
            )}
          </div>

          {/* Frame info */}
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-2xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {product.frameShape.replace('_', ' ')}
            </span>
            <span className="text-2xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {product.frameType.replace('_', ' ')}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
