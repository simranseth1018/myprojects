import { useRef, useEffect, useState, useCallback } from 'react'
import type { FaceLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision'
import {
  extractHeadPose,
  smoothPose,
  computeFaceMeasurements,
  type HeadPose,
  type FaceMeasurements,
} from '@/lib/headPose'

interface UseFaceDetectionLoop3DOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  landmarker: FaceLandmarker | null
  enabled: boolean
}

export function useFaceDetectionLoop3D({
  videoRef,
  canvasRef,
  landmarker,
  enabled,
}: UseFaceDetectionLoop3DOptions) {
  const [faceDetected, setFaceDetected] = useState(false)
  const rafRef = useRef<number>(0)
  const lastDetectionRef = useRef<number>(0)
  const faceLastSeenRef = useRef<number>(0)

  // Pose data stored in refs (not state) to avoid 30 re-renders/sec
  const headPoseRef = useRef<HeadPose | null>(null)
  const facePositionRef = useRef<FaceMeasurements | null>(null)
  const landmarksRef = useRef<NormalizedLandmark[] | null>(null)
  const smoothedPoseRef = useRef<HeadPose | null>(null)

  const renderFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !landmarker || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(renderFrame)
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Match canvas to video resolution
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
          const landmarks = result.faceLandmarks[0]
          landmarksRef.current = landmarks
          faceLastSeenRef.current = now
          setFaceDetected(true)

          // Extract head pose from transformation matrix
          if (
            result.facialTransformationMatrixes &&
            result.facialTransformationMatrixes.length > 0
          ) {
            const matrix = result.facialTransformationMatrixes[0]
            const rawPose = extractHeadPose(matrix.data as unknown as Float32Array)
            const smoothed = smoothPose(rawPose, smoothedPoseRef.current, 0.5)
            smoothedPoseRef.current = smoothed
            headPoseRef.current = smoothed
          } else {
            // Fallback: derive roll from eye landmarks only
            const le = landmarks[33]
            const re = landmarks[263]
            const roll = Math.atan2(re.y - le.y, re.x - le.x)
            headPoseRef.current = {
              pitch: 0, yaw: 0, roll,
              tx: 0, ty: 0, tz: 0,
            }
          }

          // Compute 3D position from landmarks
          facePositionRef.current = computeFaceMeasurements(
            landmarks,
            canvas.width,
            canvas.height,
          )
        } else {
          if (now - faceLastSeenRef.current > 500) {
            landmarksRef.current = null
            headPoseRef.current = null
            facePositionRef.current = null
            smoothedPoseRef.current = null
            setFaceDetected(false)
          }
        }
      } catch {
        // Detection can fail on some frames
      }
      lastDetectionRef.current = now
    }

    // Draw mirrored video (for capture support)
    ctx.save()
    ctx.scale(-1, 1)
    ctx.translate(-canvas.width, 0)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    ctx.restore()

    rafRef.current = requestAnimationFrame(renderFrame)
  }, [videoRef, canvasRef, landmarker])

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

  return {
    faceDetected,
    headPoseRef,
    facePositionRef,
  }
}
