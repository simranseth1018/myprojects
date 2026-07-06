import { useRef, useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Camera, VideoOff, Check, Loader2 } from 'lucide-react'
import { useAppDispatch } from '@/store'
import { setCapturedImage } from '@/store/slices/tryOnSlice'
import { cn } from '@/lib/utils'
import { useWebcam } from '@/hooks/ar/useWebcam'
import { useFaceLandmarker } from '@/hooks/ar/useFaceLandmarker'
import { useFaceDetectionLoop } from '@/hooks/ar/useFaceDetectionLoop'
import CameraPermissionPrompt from './CameraPermissionPrompt'
import type { Product } from '@/types/product'

interface WebcamTryOnProps {
  activeProduct: Product | null
  glassesScale: number
  onStopCamera: () => void
}

export default function WebcamTryOn({ activeProduct, glassesScale, onStopCamera }: WebcamTryOnProps) {
  const dispatch = useAppDispatch()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [captured, setCaptured] = useState(false)

  const { videoRef, isStreaming, error: webcamError, startCamera, stopCamera } = useWebcam()
  const { landmarker, isLoading: modelLoading, error: modelError } = useFaceLandmarker()

  const { faceDetected } = useFaceDetectionLoop({
    videoRef,
    canvasRef,
    landmarker,
    activeProduct,
    glassesScale,
    enabled: isStreaming && !!landmarker,
  })

  const handleCapture = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    dispatch(setCapturedImage(url))
    const a = document.createElement('a')
    a.href = url
    a.download = `lenskart-tryon-${activeProduct?.slug ?? 'look'}.png`
    a.click()
    setCaptured(true)
    setTimeout(() => setCaptured(false), 2500)
  }, [activeProduct, dispatch])

  const handleStop = useCallback(() => {
    stopCamera()
    onStopCamera()
  }, [stopCamera, onStopCamera])

  return (
    <div className="w-full max-w-lg flex flex-col items-center gap-4">
      {/* Video element — ALWAYS in DOM so ref is available for startCamera */}
      <video
        ref={videoRef}
        playsInline
        muted
        style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '1px', height: '1px' }}
      />

      {/* Show permission prompt if camera not started */}
      {!isStreaming && (
        <CameraPermissionPrompt onStart={startCamera} error={webcamError} />
      )}

      {/* Webcam canvas view */}
      {isStreaming && (
        <>
          <div className="relative w-full">
            <canvas
              ref={canvasRef}
              className="w-full rounded-2xl shadow-2xl"
            />

            {/* Status overlays */}
            {modelLoading && (
              <div className="absolute inset-0 rounded-2xl bg-gray-950/80 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
                <p className="text-sm text-gray-300">Loading face detection model...</p>
              </div>
            )}

            {modelError && (
              <div className="absolute inset-0 rounded-2xl bg-gray-950/80 flex flex-col items-center justify-center gap-3 px-6">
                <p className="text-sm text-red-400 text-center">{modelError}</p>
              </div>
            )}

            {/* Face detection indicator */}
            {!modelLoading && !modelError && (
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <div className={cn(
                  'w-2.5 h-2.5 rounded-full',
                  faceDetected ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' : 'bg-red-500 animate-pulse',
                )} />
                <span className="text-xs text-white/70 bg-black/40 px-2 py-0.5 rounded-full">
                  {faceDetected ? 'Face detected' : 'No face detected'}
                </span>
              </div>
            )}
          </div>

          {/* Hint text */}
          {!faceDetected && !modelLoading && (
            <p className="text-center text-xs text-gray-500">
              Position your face in the center of the frame
            </p>
          )}

          {/* Action bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center justify-center gap-2"
          >
            <button onClick={handleStop} className="btn-secondary text-sm gap-2">
              <VideoOff className="w-4 h-4" />
              Stop Camera
            </button>
            <button
              onClick={handleCapture}
              className={cn(
                'btn-primary text-sm gap-2 min-w-[140px] justify-center transition-colors',
                captured && '!bg-green-600',
              )}
            >
              {captured
                ? <><Check className="w-4 h-4" /> Saved!</>
                : <><Camera className="w-4 h-4" /> Capture</>
              }
            </button>
          </motion.div>
        </>
      )}
    </div>
  )
}
