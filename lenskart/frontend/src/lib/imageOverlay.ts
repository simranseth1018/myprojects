/**
 * Maps products to local transparent overlay images.
 * Sunglasses use the real chashmah product photo (background removed + auto-cropped).
 * Eyeglasses use shape-matched SVG frames.
 */
import type { Product } from '@/types/product'

const SHAPE_OVERLAY: Record<string, string> = {
  RECTANGLE: '/overlays/rectangle.svg',
  ROUND:     '/overlays/round.svg',
  OVAL:      '/overlays/oval.svg',
  SQUARE:    '/overlays/square.svg',
  AVIATOR:   '/overlays/aviator.svg',
  CAT_EYE:   '/overlays/cat-eye.svg',
  WAYFARER:  '/overlays/wayfarer.svg',
  GEOMETRIC: '/overlays/geometric.svg',
}

const SUNGLASSES_OVERLAY = '/overlays/golden-black-sunglasses.webp'
const SPECTACLES_OVERLAY = '/overlays/spectacles.webp'

const imageCache = new Map<string, HTMLImageElement>()
const processingCache = new Map<string, HTMLCanvasElement>()

function isSunglassesProduct(product: Product): boolean {
  if (product.isSunglasses) return true
  const cat = (product as any).categoryName ?? product.category?.name ?? ''
  if (cat.toLowerCase().includes('sunglass')) return true
  const slug = product.category?.slug ?? ''
  if (slug.includes('sunglass')) return true
  return false
}

export function getOverlayPath(product: Product): string {
  if (isSunglassesProduct(product)) {
    return SUNGLASSES_OVERLAY
  }
  // Use the real spectacles product image for all eyeglasses
  return SPECTACLES_OVERLAY
}

export function loadOverlayImage(product: Product): Promise<HTMLCanvasElement> {
  const path = getOverlayPath(product)
  const cacheKey = path + ':processed'

  const cached = processingCache.get(cacheKey)
  if (cached) return Promise.resolve(cached)

  return new Promise((resolve, reject) => {
    const existing = imageCache.get(path)
    if (existing && existing.complete) {
      const result = processImage(existing, true)
      processingCache.set(cacheKey, result)
      resolve(result)
      return
    }

    const img = new Image()
    img.onload = () => {
      imageCache.set(path, img)
      const result = processImage(img, true)
      processingCache.set(cacheKey, result)
      resolve(result)
    }
    img.onerror = () => reject(new Error(`Failed to load overlay: ${path}`))
    img.src = path
  })
}

function processImage(img: HTMLImageElement, removeBackground: boolean): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  if (!removeBackground) return canvas

  try {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    const w = canvas.width
    const h = canvas.height

    // Step 1: Detect background color from edge pixels
    const samples: [number, number, number][] = []
    for (let i = 0; i < 30; i++) {
      samples.push(getPixel(data, w, Math.floor((w / 30) * i), 1))
      samples.push(getPixel(data, w, Math.floor((w / 30) * i), h - 2))
      samples.push(getPixel(data, w, 1, Math.floor((h / 30) * i)))
      samples.push(getPixel(data, w, w - 2, Math.floor((h / 30) * i)))
    }
    samples.sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]))
    const mid = Math.floor(samples.length / 2)
    const bgR = samples[mid][0], bgG = samples[mid][1], bgB = samples[mid][2]

    // Step 2: Remove background pixels
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2]
      const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2)
      const brightness = (r + g + b) / 3

      if (dist < 40 || brightness > 235) {
        data[i + 3] = 0
      } else if (dist < 80 || brightness > 200) {
        const factor = dist < 80
          ? Math.max(0, (dist - 40) / 40)
          : Math.max(0, 1 - (brightness - 200) / 35)
        data[i + 3] = Math.round(255 * factor)
      }
    }
    ctx.putImageData(imageData, 0, 0)

    // Step 3: Auto-crop to the non-transparent bounding box
    const cropped = autoCrop(ctx, w, h)

    // Step 4: Auto-level (detect tilt of the glasses and correct it)
    return autoLevel(cropped)
  } catch {
    return canvas
  }
}

/** Crop a canvas to its non-transparent bounding box */
function autoCrop(ctx: CanvasRenderingContext2D, w: number, h: number): HTMLCanvasElement {
  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data

  let top = h, left = w, bottom = 0, right = 0

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const alpha = data[(y * w + x) * 4 + 3]
      if (alpha > 20) {
        if (y < top) top = y
        if (y > bottom) bottom = y
        if (x < left) left = x
        if (x > right) right = x
      }
    }
  }

  if (bottom <= top || right <= left) {
    // Nothing visible — return the original
    return ctx.canvas
  }

  // Add a small padding
  const pad = 4
  top = Math.max(0, top - pad)
  left = Math.max(0, left - pad)
  bottom = Math.min(h - 1, bottom + pad)
  right = Math.min(w - 1, right + pad)

  const cropW = right - left + 1
  const cropH = bottom - top + 1

  const cropped = document.createElement('canvas')
  cropped.width = cropW
  cropped.height = cropH
  const cropCtx = cropped.getContext('2d')!
  cropCtx.drawImage(ctx.canvas, left, top, cropW, cropH, 0, 0, cropW, cropH)

  return cropped
}

/**
 * Auto-level the glasses image:
 * Finds the dominant horizontal line of the frame and rotates to make it level.
 * Uses the center of mass of opaque pixels on left vs right half to detect tilt.
 */
function autoLevel(source: HTMLCanvasElement): HTMLCanvasElement {
  const w = source.width
  const h = source.height
  const ctx = source.getContext('2d')!
  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data

  // Find center of mass of opaque pixels on left and right halves
  let leftSumY = 0, leftCount = 0
  let rightSumY = 0, rightCount = 0
  const midX = Math.floor(w / 2)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const alpha = data[(y * w + x) * 4 + 3]
      if (alpha > 100) {
        if (x < midX) {
          leftSumY += y
          leftCount++
        } else {
          rightSumY += y
          rightCount++
        }
      }
    }
  }

  if (leftCount === 0 || rightCount === 0) return source

  const leftCenterY = leftSumY / leftCount
  const rightCenterY = rightSumY / rightCount

  // Calculate tilt angle
  const angle = Math.atan2(rightCenterY - leftCenterY, w)

  // Only correct if tilt is noticeable (> 0.5 degrees) but not crazy (< 15 degrees)
  if (Math.abs(angle) < 0.009 || Math.abs(angle) > 0.26) return source

  // Rotate to level
  const result = document.createElement('canvas')
  // Increase canvas slightly to avoid clipping during rotation
  const diagonal = Math.sqrt(w * w + h * h)
  result.width = Math.ceil(diagonal)
  result.height = Math.ceil(diagonal)
  const rCtx = result.getContext('2d')!

  rCtx.translate(result.width / 2, result.height / 2)
  rCtx.rotate(-angle)
  rCtx.drawImage(source, -w / 2, -h / 2)

  // Re-crop to remove extra space
  return autoCrop(rCtx, result.width, result.height)
}

function getPixel(data: Uint8ClampedArray, width: number, x: number, y: number): [number, number, number] {
  const i = (y * width + x) * 4
  return [data[i], data[i + 1], data[i + 2]]
}
