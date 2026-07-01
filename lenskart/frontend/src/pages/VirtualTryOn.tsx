import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, Download, RotateCcw, ChevronLeft, ChevronRight,
  ImagePlus, Glasses, Sliders, Info, Check,
} from 'lucide-react'
import { useAppDispatch } from '@/store'
import { setActiveProduct, setTryOnMode, setCapturedImage } from '@/store/slices/tryOnSlice'
import { useFeaturedProducts } from '@/hooks/api/useProducts'
import { formatPrice, cn } from '@/lib/utils'
import type { Product } from '@/types/product'

// ─── Frame color palette ──────────────────────────────────────────────────────
const MATERIAL_COLOR: Record<string, string> = {
  ACETATE:  '#5C3317',
  METAL:    '#7A8B8B',
  TITANIUM: '#4A5568',
  TR90:     '#1A1A2E',
  WOOD:     '#6B3A2A',
  MIXED:    '#4A4A4A',
}

function frameColor(product: Product): string {
  return MATERIAL_COLOR[product.frameMaterial ?? ''] ?? '#222222'
}

// ─── Canvas helpers ───────────────────────────────────────────────────────────
function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  ctx.lineTo(x + radius, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

function drawLensPath(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, w: number, h: number,
  shape: string,
) {
  ctx.beginPath()
  switch (shape) {
    case 'ROUND':
      ctx.ellipse(cx, cy, w / 2, w / 2, 0, 0, Math.PI * 2)
      break
    case 'OVAL':
      ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2)
      break
    case 'SQUARE':
      roundedRect(ctx, cx - w / 2, cy - h / 2, w, h, 3)
      break
    case 'RECTANGLE':
      roundedRect(ctx, cx - w / 2, cy - h / 2, w, h, 8)
      break
    case 'AVIATOR': {
      // Teardrop: narrower top, wider bottom
      const rx = w / 2
      const ryTop = h * 0.35
      const ryBot = h * 0.65
      ctx.moveTo(cx, cy - ryTop)
      ctx.bezierCurveTo(cx + rx * 1.1, cy - ryTop, cx + rx, cy + ryBot * 0.6, cx, cy + ryBot)
      ctx.bezierCurveTo(cx - rx, cy + ryBot * 0.6, cx - rx * 1.1, cy - ryTop, cx, cy - ryTop)
      break
    }
    case 'CAT_EYE': {
      const lx = cx - w / 2, rx = cx + w / 2
      const top = cy - h / 2, bot = cy + h / 2
      const lift = h * 0.28
      ctx.moveTo(lx + w * 0.15, bot)
      ctx.quadraticCurveTo(lx, bot, lx, cy)
      ctx.quadraticCurveTo(lx, top + 4, lx + w * 0.35, top)
      ctx.bezierCurveTo(rx - w * 0.2, top, rx, top - lift, rx, cy - h * 0.1)
      ctx.quadraticCurveTo(rx, bot, lx + w * 0.15, bot)
      break
    }
    case 'WAYFARER': {
      const lx = cx - w / 2, rx = cx + w / 2
      const top = cy - h / 2, bot = cy + h / 2
      ctx.moveTo(lx + 8, top)
      ctx.lineTo(rx - 5, top - 4)
      ctx.quadraticCurveTo(rx, top - 4, rx, top + 5)
      ctx.lineTo(rx, bot - 7)
      ctx.quadraticCurveTo(rx, bot, rx - 7, bot)
      ctx.lineTo(lx + 7, bot)
      ctx.quadraticCurveTo(lx, bot, lx, bot - 7)
      ctx.lineTo(lx, top + 6)
      ctx.quadraticCurveTo(lx, top, lx + 8, top)
      break
    }
    case 'GEOMETRIC': {
      // Hexagon
      const r = Math.min(w, h) * 0.48
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6
        if (i === 0) ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
        else ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
      }
      ctx.closePath()
      break
    }
    default:
      roundedRect(ctx, cx - w / 2, cy - h / 2, w, h, 8)
  }
}

function drawGlasses(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  baseSize: number,
  product: Product,
) {
  const shape = product.frameShape ?? 'RECTANGLE'
  const type  = product.frameType  ?? 'FULL_RIM'
  const color = frameColor(product)

  const lensW     = baseSize * 0.42
  const lensH     = shape === 'ROUND'    ? lensW * 0.82
                  : shape === 'AVIATOR'  ? lensW * 0.88
                  : shape === 'CAT_EYE'  ? lensW * 0.65
                  : shape === 'OVAL'     ? lensW * 0.72
                  : lensW * 0.60

  const bridge    = baseSize * 0.10
  const templeLen = baseSize * 0.58
  const rimW      = type === 'FULL_RIM' ? 3.5 : type === 'HALF_RIM' ? 2.5 : 1.5

  const leftCx  = cx - bridge / 2 - lensW / 2
  const rightCx = cx + bridge / 2 + lensW / 2

  ctx.save()

  // Lens tint fill
  const lensAlpha = shape === 'AVIATOR' || product.isBestseller ? 0.18 : 0.12
  ctx.fillStyle = `rgba(180,210,240,${lensAlpha})`

  for (const lcx of [leftCx, rightCx]) {
    drawLensPath(ctx, lcx, cy, lensW, lensH, shape)
    ctx.fill()
  }

  // Rim stroke
  ctx.strokeStyle = color
  ctx.lineWidth = rimW
  ctx.lineJoin = 'round'
  ctx.lineCap  = 'round'

  if (type === 'FULL_RIM') {
    for (const lcx of [leftCx, rightCx]) {
      drawLensPath(ctx, lcx, cy, lensW, lensH, shape)
      ctx.stroke()
    }
  } else if (type === 'HALF_RIM') {
    // Only bottom half
    ctx.save()
    for (const lcx of [leftCx, rightCx]) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(lcx - lensW, cy, lensW * 2, lensH * 2)
      ctx.clip()
      drawLensPath(ctx, lcx, cy, lensW, lensH, shape)
      ctx.stroke()
      ctx.restore()
    }
    ctx.restore()
  }
  // RIMLESS: no lens stroke

  // Bridge
  ctx.beginPath()
  ctx.moveTo(leftCx + lensW / 2, cy - lensH * 0.10)
  ctx.quadraticCurveTo(cx, cy - lensH * 0.32, rightCx - lensW / 2, cy - lensH * 0.10)
  ctx.strokeStyle = color
  ctx.lineWidth = rimW
  ctx.stroke()

  // Nose pads (metal / rimless frames)
  if (type === 'RIMLESS' || product.frameMaterial === 'METAL' || product.frameMaterial === 'TITANIUM') {
    for (const [padX, padY] of [
      [leftCx + lensW * 0.2, cy + lensH * 0.10],
      [rightCx - lensW * 0.2, cy + lensH * 0.10],
    ] as [number, number][]) {
      ctx.beginPath()
      ctx.ellipse(padX, padY, 4, 6, Math.PI / 8, 0, Math.PI * 2)
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
  }

  // Temples
  ctx.strokeStyle = color
  ctx.lineWidth = rimW * 0.9
  ctx.beginPath()
  ctx.moveTo(leftCx - lensW / 2, cy - lensH * 0.05)
  ctx.lineTo(leftCx - lensW / 2 - templeLen, cy + lensH * 0.05)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(rightCx + lensW / 2, cy - lensH * 0.05)
  ctx.lineTo(rightCx + lensW / 2 + templeLen, cy + lensH * 0.05)
  ctx.stroke()

  ctx.restore()
}

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
          Upload a front-facing photo for best results
        </div>
      </div>

      <div className="flex flex-col lg:flex-row" style={{ minHeight: 'calc(100vh - 65px)' }}>

        {/* ── Left: canvas area ── */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 gap-4">

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

          {/*
            Canvas is ALWAYS in the DOM so canvasRef is never null.
            We just hide it with CSS until a photo is loaded.
          */}
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

          {/* Action bar */}
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
