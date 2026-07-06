import { useRef, useEffect, useState, useCallback } from 'react'
import type { FaceLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision'
import { computeGlassesTransform } from '@/lib/faceGeometry'
import { loadOverlayImage } from '@/lib/imageOverlay'
import type { Product } from '@/types/product'

interface UseFaceDetectionLoopOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  landmarker: FaceLandmarker | null
  activeProduct: Product | null
  glassesScale: number
  enabled: boolean
}

export function useFaceDetectionLoop({
  videoRef,
  canvasRef,
  landmarker,
  activeProduct,
  glassesScale,
  enabled,
}: UseFaceDetectionLoopOptions) {
  const [faceDetected, setFaceDetected] = useState(false)
  const rafRef = useRef<number>(0)
  const lastDetectionRef = useRef<number>(0)
  const cachedLandmarksRef = useRef<NormalizedLandmark[] | null>(null)
  const faceLastSeenRef = useRef<number>(0)

  // Preloaded overlay image (local SVG or processed product photo)
  const overlayRef = useRef<HTMLCanvasElement | null>(null)
  const overlayProductIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!activeProduct) {
      overlayRef.current = null
      overlayProductIdRef.current = null
      return
    }

    if (activeProduct.id === overlayProductIdRef.current) return

    overlayProductIdRef.current = activeProduct.id
    overlayRef.current = null

    loadOverlayImage(activeProduct)
      .then((canvas) => {
        if (overlayProductIdRef.current === activeProduct.id) {
          overlayRef.current = canvas
        }
      })
      .catch(() => {
        // Overlay failed to load — no overlay will be shown
      })
  }, [activeProduct])

  const renderFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !landmarker || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(renderFrame)
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Match canvas resolution to video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
    }

    const now = performance.now()

    // Run detection at ~30 FPS
    if (now - lastDetectionRef.current > 33) {
      try {
        const result = landmarker.detectForVideo(video, now)
        if (result.faceLandmarks && result.faceLandmarks.length > 0) {
          cachedLandmarksRef.current = result.faceLandmarks[0]
          faceLastSeenRef.current = now
          setFaceDetected(true)
        } else {
          if (now - faceLastSeenRef.current > 500) {
            cachedLandmarksRef.current = null
            setFaceDetected(false)
          }
        }
      } catch {
        // Detection can fail on some frames
      }
      lastDetectionRef.current = now
    }

    // Draw mirrored video
    ctx.save()
    ctx.scale(-1, 1)
    ctx.translate(-canvas.width, 0)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    ctx.restore()

    // Draw glasses overlay on face
    if (cachedLandmarksRef.current && overlayRef.current) {
      const transform = computeGlassesTransform(
        cachedLandmarksRef.current,
        canvas.width,
        canvas.height,
        true,
      )

      const img = overlayRef.current
      const targetWidth = transform.width * 1.3 * glassesScale
      const aspectRatio = img.height / img.width
      const targetHeight = targetWidth * aspectRatio

      ctx.save()
      ctx.translate(transform.centerX, transform.centerY)
      ctx.rotate(transform.rotation)
      ctx.drawImage(
        img,
        -targetWidth / 2,
        -targetHeight / 2,
        targetWidth,
        targetHeight,
      )
      ctx.restore()
    }

    rafRef.current = requestAnimationFrame(renderFrame)
  }, [videoRef, canvasRef, landmarker, activeProduct, glassesScale])

  useEffect(() => {
    if (enabled && landmarker) {
      rafRef.current = requestAnimationFrame(renderFrame)
    }
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [enabled, landmarker, renderFrame])

  return { faceDetected }
}
