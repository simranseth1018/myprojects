import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, Download, RotateCcw, ChevronLeft, ChevronRight,
  ImagePlus, Glasses, Sliders, Info, Check, Video, Camera, VideoOff,
} from 'lucide-react'
import { useAppDispatch } from '@/store'
import { setActiveProduct, setTryOnMode, setCapturedImage } from '@/store/slices/tryOnSlice'
import { useFeaturedProducts } from '@/hooks/api/useProducts'
import { formatPrice, cn } from '@/lib/utils'
import { drawGlasses } from '@/lib/glassesRenderer'
import WebcamTryOn from '@/components/ar/WebcamTryOn'
import type { Product } from '@/types/product'

// ─── Main component ───────────────────────────────────────────────────────────
export default function VirtualTryOn() {
  const dispatch = useAppDispatch()
  const [searchParams] = useSearchParams()
  const productIdFromUrl = searchParams.get('product')

  const { data: featured = [], isLoading } = useFeaturedProducts(20)

  const [activeProductId, setActiveProductId] = useState<string | null>(productIdFromUrl)
  const activeProduct = useMemo(
    () => featured.find((p) => p.id === activeProductId) ?? featured[0] ?? null,
    [featured, activeProductId],
  )

  useEffect(() => {
    if (activeProduct) {
      dispatch(setActiveProduct({ productId: activeProduct.id, variantId: '' }))
    }
  }, [activeProduct, dispatch])

  // Canvas refs — canvas is ALWAYS in the DOM (just hidden), so ref is never null
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef    = useRef<HTMLImageElement | null>(null)

  const [viewMode, setViewMode]       = useState<'photo' | 'webcam'>('photo')
  const [hasImage, setHasImage]       = useState(false)
  const [glassesPos, setGlassesPos]   = useState({ x: 0.5, y: 0.38 })
  const [glassesScale, setGlassesScale] = useState(1)
  const [isDragging, setIsDragging]   = useState(false)
  const dragStart = useRef<{ mx: number; my: number; gx: number; gy: number } | null>(null)
  const [downloaded, setDownloaded]   = useState(false)
  const [isDragOver, setIsDragOver]   = useState(false)

  // Product switcher
  const [productPage, setProductPage] = useState(0)
  const perPage = 4
  const totalPages = Math.ceil(featured.length / perPage)
  const visibleProducts = featured.slice(productPage * perPage, productPage * perPage + perPage)

  // ── Redraw ────────────────────────────────────────────────────────────────
  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img || canvas.width === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    if (activeProduct) {
      const cx = glassesPos.x * canvas.width
      const cy = glassesPos.y * canvas.height
      drawGlasses(ctx, cx, cy, canvas.width * 0.38 * glassesScale, activeProduct)
    }
  }, [activeProduct, glassesPos, glassesScale])

  // Redraw whenever drawing inputs change
  useEffect(() => { redraw() }, [redraw])

  // ── Load photo ────────────────────────────────────────────────────────────
  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current!   // canvas is always mounted
      const maxW = 800
      const scale = Math.min(1, maxW / img.naturalWidth)
      canvas.width  = Math.round(img.naturalWidth  * scale)
      canvas.height = Math.round(img.naturalHeight * scale)
      imgRef.current = img
      setHasImage(true)
      setGlassesPos({ x: 0.5, y: 0.38 })
      setGlassesScale(1)
      dispatch(setTryOnMode('active'))
      URL.revokeObjectURL(url)
    }
    img.src = url
  }, [dispatch])

  // Re-draw after hasImage flips (canvas dimensions + imgRef already set by then)
  useEffect(() => { if (hasImage) redraw() }, [hasImage, redraw])

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) loadFile(f)
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) loadFile(f)
  }

  // ── Drag glasses ─────────────────────────────────────────────────────────
  function canvasPoint(
    e: React.MouseEvent | React.TouchEvent,
    canvas: HTMLCanvasElement,
  ) {
    const rect = canvas.getBoundingClientRect()
    const sx = canvas.width / rect.width
    const sy = canvas.height / rect.height
    const client = 'touches' in e ? e.touches[0] : e
    return {
      mx: (client.clientX - rect.left) * sx,
      my: (client.clientY - rect.top)  * sy,
    }
  }

  const startDrag = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!hasImage) return
    const canvas = canvasRef.current!
    const { mx, my } = canvasPoint(e, canvas)
    dragStart.current = {
      mx, my,
      gx: glassesPos.x * canvas.width,
      gy: glassesPos.y * canvas.height,
    }
    setIsDragging(true)
  }

  const moveDrag = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart.current) return
    if ('touches' in e) e.preventDefault()
    const canvas = canvasRef.current!
    const { mx, my } = canvasPoint(e, canvas)
    const dx = mx - dragStart.current.mx
    const dy = my - dragStart.current.my
    setGlassesPos({
      x: Math.max(0.05, Math.min(0.95, (dragStart.current.gx + dx) / canvas.width)),
      y: Math.max(0.05, Math.min(0.95, (dragStart.current.gy + dy) / canvas.height)),
    })
  }

  const endDrag = () => { setIsDragging(false); dragStart.current = null }

  // ── Download ──────────────────────────────────────────────────────────────
  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas || !hasImage) return
    const url = canvas.toDataURL('image/png')
    dispatch(setCapturedImage(url))
    const a = document.createElement('a')
    a.href = url
    a.download = `lenskart-tryon-${activeProduct?.slug ?? 'look'}.png`
    a.click()
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 2500)
  }

  const handleReset = () => {
    setGlassesPos({ x: 0.5, y: 0.38 })
    setGlassesScale(1)
  }

  const handleNewPhoto = () => {
    imgRef.current = null
    const canvas = canvasRef.current
    if (canvas) { canvas.width = 0; canvas.height = 0 }
    setHasImage(false)
    setGlassesPos({ x: 0.5, y: 0.38 })
    setGlassesScale(1)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-gray-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Glasses className="w-5 h-5 text-brand-400" />
            <h1 className="text-lg font-semibold">Virtual Try-On</h1>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
          <Info className="w-4 h-4 flex-shrink-0" />
          {viewMode === 'photo' ? 'Upload a front-facing photo for best results' : 'Position your face in the frame'}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row" style={{ minHeight: 'calc(100vh - 65px)' }}>

        {/* ── Left: canvas area ── */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 gap-4">

          {/* Mode toggle */}
          <div className="flex items-center gap-1 p-1 bg-gray-800/80 rounded-xl">
            <button
              onClick={() => setViewMode('photo')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                viewMode === 'photo'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white',
              )}
            >
              <ImagePlus className="w-4 h-4" />
              Upload Photo
            </button>
            <button
              onClick={() => setViewMode('webcam')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                viewMode === 'webcam'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white',
              )}
            >
              <Video className="w-4 h-4" />
              Live Camera
            </button>
          </div>

          <AnimatePresence mode="wait">
            {viewMode === 'photo' ? (
              <motion.div
                key="photo"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="w-full flex flex-col items-center gap-4"
              >
                {/* Upload dropzone — shown only when no image */}
                {!hasImage && (
                  <motion.label
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      'w-full max-w-lg aspect-[3/4] border-2 border-dashed rounded-3xl',
                      'flex flex-col items-center justify-center gap-5 cursor-pointer transition-all duration-200',
                      isDragOver
                        ? 'border-brand-400 bg-brand-950/40 scale-[1.01]'
                        : 'border-gray-700 hover:border-gray-500 bg-gray-900/40',
                    )}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={onDrop}
                  >
                    <input type="file" accept="image/*" className="hidden" onChange={onFileInput} />
                    <div className={cn(
                      'w-20 h-20 rounded-full flex items-center justify-center transition-colors',
                      isDragOver ? 'bg-brand-900' : 'bg-gray-800',
                    )}>
                      <ImagePlus className="w-9 h-9 text-brand-400" />
                    </div>
                    <div className="text-center px-6">
                      <p className="text-lg font-semibold text-gray-200">Drop your photo here</p>
                      <p className="text-sm text-gray-500 mt-1">or click to browse</p>
                    </div>
                    <div className="text-center text-xs text-gray-600 space-y-1">
                      <p>JPG · PNG · WEBP supported</p>
                      <p>Use a clear, front-facing photo</p>
                    </div>
                  </motion.label>
                )}

                {/* Canvas for photo mode */}
                <div className={cn('w-full max-w-lg', !hasImage && 'hidden')}>
                  <canvas
                    ref={canvasRef}
                    className={cn(
                      'w-full rounded-2xl shadow-2xl select-none touch-none',
                      isDragging ? 'cursor-grabbing' : 'cursor-grab',
                    )}
                    onMouseDown={startDrag}
                    onMouseMove={moveDrag}
                    onMouseUp={endDrag}
                    onMouseLeave={endDrag}
                    onTouchStart={startDrag}
                    onTouchMove={moveDrag}
                    onTouchEnd={endDrag}
                  />
                  <p className="text-center text-xs text-gray-500 mt-2">
                    Drag the glasses to reposition · Use the slider to resize
                  </p>
                </div>

                {/* Photo action bar */}
                {hasImage && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap items-center justify-center gap-2"
                  >
                    <button onClick={handleNewPhoto} className="btn-secondary text-sm gap-2">
                      <Upload className="w-4 h-4" />
                      New Photo
                    </button>
                    <button onClick={handleReset} className="btn-secondary text-sm gap-2">
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </button>
                    <button
                      onClick={handleDownload}
                      className={cn(
                        'btn-primary text-sm gap-2 min-w-[140px] justify-center transition-colors',
                        downloaded && '!bg-green-600',
                      )}
                    >
                      {downloaded
                        ? <><Check className="w-4 h-4" /> Saved!</>
                        : <><Download className="w-4 h-4" /> Download Look</>
                      }
                    </button>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="webcam"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="w-full flex flex-col items-center gap-4"
              >
                <WebcamTryOn
                  activeProduct={activeProduct}
                  glassesScale={glassesScale}
                  onStopCamera={() => setViewMode('photo')}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right: controls ── */}
        <div className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-gray-800 flex flex-col">

          {/* Active product */}
          <div className="p-5 border-b border-gray-800">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Trying On
            </p>
            {activeProduct ? (
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-xl bg-gray-800 overflow-hidden flex-shrink-0">
                  {activeProduct.images[0] && (
                    <img
                      src={activeProduct.images[0].url}
                      alt={activeProduct.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-brand-400 font-semibold uppercase tracking-wide">
                    {activeProduct.brand}
                  </p>
                  <p className="text-sm font-semibold text-white line-clamp-1 mt-0.5">
                    {activeProduct.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {activeProduct.frameShape?.replace('_', ' ')} · {activeProduct.frameType?.replace('_', ' ')}
                  </p>
                  <p className="text-sm font-bold text-brand-300 mt-1">
                    {formatPrice(activeProduct.finalPrice)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <div className="w-14 h-14 rounded-xl bg-gray-800 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-800 rounded animate-pulse w-16" />
                  <div className="h-4 bg-gray-800 rounded animate-pulse w-full" />
                  <div className="h-3 bg-gray-800 rounded animate-pulse w-24" />
                </div>
              </div>
            )}
          </div>

          {/* Size slider */}
          <div className="p-5 border-b border-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <Sliders className="w-4 h-4 text-gray-400" />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Frame Size
              </p>
              <span className="ml-auto text-xs text-gray-500">{Math.round(glassesScale * 100)}%</span>
            </div>
            <input
              type="range"
              min={40} max={160} step={2}
              value={Math.round(glassesScale * 100)}
              onChange={(e) => setGlassesScale(Number(e.target.value) / 100)}
              className="w-full accent-brand-500 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>Small</span>
              <span>Large</span>
            </div>
          </div>

          {/* Product switcher */}
          <div className="p-5 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                Switch Frames
              </p>
              {totalPages > 1 && (
                <div className="flex gap-1">
                  <button
                    onClick={() => setProductPage((p) => Math.max(0, p - 1))}
                    disabled={productPage === 0}
                    className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center disabled:opacity-30 hover:bg-gray-700 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setProductPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={productPage >= totalPages - 1}
                    className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center disabled:opacity-30 hover:bg-gray-700 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="aspect-[4/3] rounded-xl bg-gray-800 animate-pulse" />
                ))}
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={productPage}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="grid grid-cols-2 gap-2"
                >
                  {visibleProducts.map((p) => {
                    const active = p.id === activeProduct?.id
                    return (
                      <button
                        key={p.id}
                        onClick={() => setActiveProductId(p.id)}
                        className={cn(
                          'rounded-xl overflow-hidden border-2 transition-all duration-200 text-left',
                          active
                            ? 'border-brand-500 ring-2 ring-brand-500/30'
                            : 'border-gray-800 hover:border-gray-600',
                        )}
                      >
                        <div className="aspect-[4/3] bg-gray-800 relative overflow-hidden">
                          {p.images[0] ? (
                            <img
                              src={p.images[0].url}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Glasses className="w-8 h-8 text-gray-600" />
                            </div>
                          )}
                          {active && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center shadow">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="p-2 bg-gray-900">
                          <p className="text-2xs font-semibold text-gray-300 truncate">{p.brand}</p>
                          <p className="text-2xs text-gray-500 truncate">{p.frameShape?.replace('_',' ')}</p>
                        </div>
                      </button>
                    )
                  })}
                </motion.div>
              </AnimatePresence>
            )}

            {activeProduct && (
              <Link
                to={`/products/${activeProduct.slug}`}
                className="mt-4 w-full btn-primary text-sm justify-center flex items-center"
              >
                Buy This Frame →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
