import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, ShoppingCart, Star, ChevronLeft, ChevronRight,
  ZoomIn, Eye, Share2, Shield, Truck, RotateCcw,
  Check, Info, ChevronDown, ChevronUp, Camera,
} from 'lucide-react'
import { useProduct } from '@/hooks/api/useProducts'
import { useProductReviews } from '@/hooks/api/useProducts'
import { useAddToCart } from '@/hooks/api/useCart'
import { useAppDispatch, useAppSelector } from '@/store'
import { toggleWishlistItem } from '@/store/slices/wishlistSlice'
import { formatPrice, cn } from '@/lib/utils'
import type { LensOption } from '@/types/product'

const LENS_OPTIONS: LensOption[] = [
  {
    id: 'zero-power',
    type: 'ZERO_POWER',
    coating: 'ANTI_GLARE',
    material: 'STANDARD',
    name: 'Zero Power (No Prescription)',
    description: 'Anti-reflective coating. Perfect for fashion use.',
    price: 0,
    isActive: true,
    recommended: false,
  },
  {
    id: 'single-vision-standard',
    type: 'SINGLE_VISION',
    coating: 'ANTI_GLARE',
    material: 'STANDARD',
    name: 'Single Vision — Standard',
    description: 'Anti-glare coating. Ideal for mild prescriptions.',
    price: 499,
    isActive: true,
  },
  {
    id: 'single-vision-thin',
    type: 'SINGLE_VISION',
    coating: 'BLUE_CUT',
    material: 'THIN',
    name: 'Single Vision — Thin + Blue Cut',
    description: 'Thinner, lighter lens with blue light protection. Best for screen use.',
    price: 899,
    isActive: true,
    recommended: true,
  },
  {
    id: 'progressive',
    type: 'PROGRESSIVE',
    coating: 'ANTI_GLARE',
    material: 'ULTRA_THIN',
    name: 'Progressive Lenses',
    description: 'Multi-focal lens for near, intermediate & far vision. Premium anti-glare.',
    price: 2499,
    isActive: true,
  },
]

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const wishlistIds = useAppSelector((s) => s.wishlist.productIds)
  const addToCart = useAddToCart()

  const { data: product, isLoading } = useProduct(slug!)
  const { data: reviews } = useProductReviews(product?.id ?? '', 0, 5)

  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0)
  const [selectedImageIdx, setSelectedImageIdx] = useState(0)
  const [selectedLens, setSelectedLens] = useState<LensOption>(LENS_OPTIONS[0])
  const [isZoomed, setIsZoomed] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>('lens')

  if (isLoading) {
    return (
      <div className="page-container py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <div className="skeleton aspect-square rounded-2xl mb-4" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton w-20 h-16 rounded-xl" />)}
            </div>
          </div>
          <div className="space-y-4">
            <div className="skeleton h-4 w-24" />
            <div className="skeleton h-8 w-3/4" />
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-8 w-28" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="page-container py-20 text-center">
        <h2 className="text-2xl font-bold mb-2">Product not found</h2>
        <Link to="/catalog" className="btn-primary">Back to Catalog</Link>
      </div>
    )
  }

  const variant = product.variants[selectedVariantIdx]
  const variantImages = product.images.filter(
    (img) => !img.variantId || img.variantId === variant?.id,
  )
  const currentImage = variantImages[selectedImageIdx]
  const isWishlisted = wishlistIds.includes(product.id)
  const totalPrice = product.finalPrice + (selectedLens?.price ?? 0)

  const handleAddToCart = () => {
    if (!variant) return
    addToCart.mutate({
      productId: product.id,
      variantId: variant.id,
      lensOptionId: selectedLens?.id,
    })
  }

  return (
    <>
      <Helmet>
        <title>{product.metaTitle || `${product.name} — Lenskart`}</title>
        <meta name="description" content={product.metaDescription || product.description.slice(0, 160)} />
        <meta property="og:title" content={product.name} />
        <meta property="og:image" content={product.images[0]?.url} />
      </Helmet>

      <div className="bg-white">
        {/* Breadcrumb */}
        <div className="border-b border-gray-100">
          <div className="page-container py-3 text-sm text-gray-500 flex items-center gap-2">
            <Link to="/" className="hover:text-brand-600">Home</Link>
            <span>/</span>
            <Link to="/catalog" className="hover:text-brand-600">Eyeglasses</Link>
            <span>/</span>
            <span className="text-gray-900 truncate">{product.name}</span>
          </div>
        </div>

        <div className="page-container py-8">
          <div className="grid lg:grid-cols-2 gap-10 xl:gap-16">
            {/* ---- Image Gallery ---- */}
            <div className="space-y-4">
              {/* Main image */}
              <div className="relative bg-gray-50 rounded-2xl overflow-hidden aspect-[4/3]">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={currentImage?.url}
                    src={currentImage?.url || '/placeholder.png'}
                    alt={currentImage?.altText || product.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>

                {/* Navigation arrows */}
                {variantImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImageIdx((i) => Math.max(0, i - 1))}
                      disabled={selectedImageIdx === 0}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center disabled:opacity-40 hover:bg-gray-50 transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setSelectedImageIdx((i) => Math.min(variantImages.length - 1, i + 1))}
                      disabled={selectedImageIdx === variantImages.length - 1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center disabled:opacity-40 hover:bg-gray-50 transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Zoom button */}
                <button
                  onClick={() => setIsZoomed(true)}
                  className="absolute bottom-3 right-3 w-9 h-9 bg-white rounded-xl shadow-md flex items-center justify-center hover:bg-gray-50 transition-all"
                >
                  <ZoomIn className="w-4 h-4 text-gray-600" />
                </button>

                {/* Try-on button */}
                <Link
                  to={`/try-on?product=${product.id}&variant=${variant?.id}`}
                  className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 transition-colors shadow-md"
                >
                  <Eye className="w-3.5 h-3.5" /> Virtual Try-On
                </Link>
              </div>

              {/* Thumbnail strip */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {variantImages.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageIdx(idx)}
                    className={cn(
                      'flex-shrink-0 w-20 h-16 rounded-xl overflow-hidden border-2 transition-all',
                      idx === selectedImageIdx
                        ? 'border-brand-500'
                        : 'border-transparent opacity-60 hover:opacity-100',
                    )}
                  >
                    <img src={img.url} alt={img.altText || ''} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              {/* Face shape detection */}
              <Link
                to="/face-shape"
                className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-100 rounded-2xl hover:bg-purple-100 transition-colors"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Camera className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-purple-900">Check if this fits your face</p>
                  <p className="text-xs text-purple-600">AI-powered face shape detection</p>
                </div>
              </Link>
            </div>

            {/* ---- Product Info ---- */}
            <div>
              {/* Brand */}
              <p className="text-brand-600 text-sm font-bold uppercase tracking-wide mb-1">
                {product.brand}
              </p>

              {/* Name & actions */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">{product.name}</h1>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => dispatch(toggleWishlistItem(product.id))}
                    className={cn(
                      'w-10 h-10 rounded-xl border flex items-center justify-center transition-all',
                      isWishlisted
                        ? 'bg-red-50 border-red-200 text-red-500'
                        : 'bg-white border-gray-200 text-gray-400 hover:text-red-400',
                    )}
                  >
                    <Heart className={cn('w-5 h-5', isWishlisted && 'fill-red-500')} />
                  </button>
                  <button className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* SKU & tags */}
              <p className="text-xs text-gray-400 mb-3">SKU: {product.sku}</p>

              {/* Rating */}
              {product.reviewCount > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-lg">
                    <Star className="w-3 h-3 fill-white" /> {product.rating.toFixed(1)}
                  </div>
                  <span className="text-sm text-gray-500">{product.reviewCount} reviews</span>
                  <a href="#reviews" className="text-sm text-brand-600 hover:underline">See all</a>
                </div>
              )}

              {/* Price */}
              <div className="flex items-end gap-3 mb-1">
                <span className="text-3xl font-bold text-gray-900">{formatPrice(product.finalPrice)}</span>
                {product.discountPercent > 0 && (
                  <>
                    <span className="text-lg text-gray-400 line-through">{formatPrice(product.basePrice)}</span>
                    <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-lg">
                      {product.discountPercent}% OFF
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-400 mb-5">Frame price only. Lens price added below.</p>

              {/* Color variants */}
              {product.variants.length > 0 && (
                <div className="mb-5">
                  <p className="text-sm font-semibold text-gray-900 mb-2">
                    Color:{' '}
                    <span className="font-normal text-gray-600">{variant?.colorName}</span>
                  </p>
                  <div className="flex gap-2">
                    {product.variants.map((v, idx) => (
                      <button
                        key={v.id}
                        title={v.colorName}
                        onClick={() => {
                          setSelectedVariantIdx(idx)
                          setSelectedImageIdx(0)
                        }}
                        className={cn(
                          'w-8 h-8 rounded-full border-2 transition-all hover:scale-110',
                          idx === selectedVariantIdx ? 'border-brand-500 scale-110 shadow-md' : 'border-gray-200',
                        )}
                        style={{ backgroundColor: v.colorHex || '#ccc' }}
                      >
                        {idx === selectedVariantIdx && (
                          <Check className="w-4 h-4 text-white mx-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Frame details */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { label: 'Shape', value: product.frameShape.replace('_', ' ') },
                  { label: 'Material', value: product.frameMaterial },
                  { label: 'Type', value: product.frameType.replace('_', ' ') },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-2.5 text-center">
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="text-xs font-bold text-gray-900">{value}</p>
                  </div>
                ))}
              </div>

              {/* Lens selection */}
              <div className="mb-5">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'lens' ? null : 'lens')}
                  className="flex items-center justify-between w-full mb-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">Select Lenses</span>
                    <span className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full font-medium">
                      {formatPrice(selectedLens.price === 0 ? 0 : selectedLens.price)} added
                    </span>
                  </div>
                  {expandedSection === 'lens'
                    ? <ChevronUp className="w-4 h-4 text-gray-400" />
                    : <ChevronDown className="w-4 h-4 text-gray-400" />
                  }
                </button>

                <AnimatePresence>
                  {expandedSection === 'lens' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2">
                        {LENS_OPTIONS.map((lens) => (
                          <button
                            key={lens.id}
                            onClick={() => setSelectedLens(lens)}
                            className={cn(
                              'w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all',
                              selectedLens.id === lens.id
                                ? 'border-brand-500 bg-brand-50'
                                : 'border-gray-200 hover:border-gray-300 bg-white',
                            )}
                          >
                            <div className={cn(
                              'w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0',
                              selectedLens.id === lens.id
                                ? 'border-brand-500 bg-brand-500'
                                : 'border-gray-300',
                            )}>
                              {selectedLens.id === lens.id && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-gray-900">{lens.name}</span>
                                {lens.recommended && (
                                  <span className="text-[10px] bg-teal-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                                    RECOMMENDED
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">{lens.description}</p>
                            </div>
                            <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                              {lens.price === 0 ? 'FREE' : `+${formatPrice(lens.price)}`}
                            </span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Total price */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-brand-50 to-teal-50 rounded-2xl mb-5 border border-brand-100">
                <div>
                  <p className="text-xs text-gray-500">Total Price (Frame + Lens)</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(totalPrice)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-teal-600 font-medium">Free delivery included</p>
                  <p className="text-xs text-gray-400">EMI from ₹{Math.round(totalPrice / 12)}/mo</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={handleAddToCart}
                  disabled={addToCart.isPending || !variant?.isAvailable}
                  className="flex-1 btn-primary gap-2 justify-center py-3"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {addToCart.isPending ? 'Adding...' : !variant?.isAvailable ? 'Out of Stock' : 'Add to Cart'}
                </button>
                <Link
                  to={`/try-on?product=${product.id}&variant=${variant?.id}`}
                  className="btn-outline gap-2 py-3"
                >
                  <Eye className="w-5 h-5" /> Try On
                </Link>
              </div>

              {/* Trust signals */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { icon: Truck, text: 'Free Delivery', sub: 'In 3-5 days' },
                  { icon: RotateCcw, text: '30-Day Return', sub: 'Hassle-free' },
                  { icon: Shield, text: '1-Year Warranty', sub: 'On frames' },
                ].map(({ icon: Icon, text, sub }) => (
                  <div key={text} className="flex flex-col items-center text-center p-2 bg-gray-50 rounded-xl">
                    <Icon className="w-4 h-4 text-brand-600 mb-1" />
                    <p className="text-xs font-semibold text-gray-900">{text}</p>
                    <p className="text-[10px] text-gray-400">{sub}</p>
                  </div>
                ))}
              </div>

              {/* Description accordion */}
              {[
                {
                  key: 'description',
                  title: 'Product Description',
                  content: product.description,
                },
                {
                  key: 'specs',
                  title: 'Frame Specifications',
                  content: `Shape: ${product.frameShape} • Material: ${product.frameMaterial} • Type: ${product.frameType} • Gender: ${product.gender}`,
                },
              ].map(({ key, title, content }) => (
                <div key={key} className="border-t border-gray-100 py-3">
                  <button
                    onClick={() => setExpandedSection(expandedSection === key ? null : key)}
                    className="flex items-center justify-between w-full text-sm font-semibold text-gray-900"
                  >
                    {title}
                    {expandedSection === key
                      ? <ChevronUp className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-400" />
                    }
                  </button>
                  <AnimatePresence>
                    {expandedSection === key && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <p className="pt-3 text-sm text-gray-600 leading-relaxed">{content}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews section */}
          {reviews && (
            <div id="reviews" className="mt-16 border-t border-gray-100 pt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Customer Reviews</h2>

              {reviews.content.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No reviews yet. Be the first to review this product!</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reviews.content.map((review) => (
                    <div
                      key={review.id}
                      className="bg-gray-50 rounded-2xl p-5 border border-gray-100"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={cn(
                                'w-4 h-4',
                                s <= review.rating ? 'star-filled' : 'star-empty',
                              )}
                            />
                          ))}
                        </div>
                        {review.isVerifiedPurchase && (
                          <span className="text-xs text-teal-600 font-medium flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Verified
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-gray-900 mb-1">{review.title}</h4>
                      <p className="text-sm text-gray-600 line-clamp-3 mb-3">{review.body}</p>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 text-xs font-bold">
                          {review.userName[0]}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-900">{review.userName}</p>
                          <p className="text-[11px] text-gray-400">{review.createdAt}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Zoom modal */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsZoomed(false)}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          >
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              src={currentImage?.url}
              alt={product.name}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
