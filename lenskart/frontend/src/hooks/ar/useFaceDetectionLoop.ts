import { useRef, useEffect, useState, useCallback } from 'react'
import type { FaceLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision'
import { computeGlassesTransform } from '@/lib/faceGeometry'
import { drawGlasses } from '@/lib/glassesRenderer'
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
          // Keep cached landmarks for 500ms to avoid flicker
          if (now - faceLastSeenRef.current > 500) {
            cachedLandmarksRef.current = null
            setFaceDetected(false)
          }
        }
      } catch {
        // Detection can fail on some frames, just skip
      }
      lastDetectionRef.current = now
    }

    // Draw mirrored video
    ctx.save()
    ctx.scale(-1, 1)
    ctx.translate(-canvas.width, 0)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    ctx.restore()

    // Draw glasses overlay
    if (cachedLandmarksRef.current && activeProduct) {
      const transform = computeGlassesTransform(
        cachedLandmarksRef.current,
        canvas.width,
        canvas.height,
        true,
      )

      ctx.save()
      ctx.translate(transform.centerX, transform.centerY)
      ctx.rotate(transform.rotation)
      drawGlasses(ctx, 0, 0, transform.width * glassesScale, activeProduct)
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
