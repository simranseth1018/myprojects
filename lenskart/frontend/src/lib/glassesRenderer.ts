import type { Product } from '@/types/product'

// ─── Frame color palette ──────────────────────────────────────────────────────
export const MATERIAL_COLOR: Record<string, string> = {
  ACETATE:  '#5C3317',
  METAL:    '#7A8B8B',
  TITANIUM: '#4A5568',
  TR90:     '#1A1A2E',
  WOOD:     '#6B3A2A',
  MIXED:    '#4A4A4A',
}

export function frameColor(product: Product): string {
  return MATERIAL_COLOR[product.frameMaterial ?? ''] ?? '#222222'
}

// ─── Canvas helpers ───────────────────────────────────────────────────────────
export function roundedRect(
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

export function drawLensPath(
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

export function drawGlasses(
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
  const lensAlpha = shape === 'AVIATOR' || product.isFeatured ? 0.18 : 0.12
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

  // Bridge
  ctx.beginPath()
  ctx.moveTo(leftCx + lensW / 2, cy - lensH * 0.10)
  ctx.quadraticCurveTo(cx, cy - lensH * 0.32, rightCx - lensW / 2, cy - lensH * 0.10)
  ctx.strokeStyle = color
  ctx.lineWidth = rimW
  ctx.stroke()

  // Nose pads
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
