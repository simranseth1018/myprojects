import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import GlassesMesh from './GlassesMesh'
import { estimateWebcamFOV } from '@/lib/cameraCalibration'
import type { HeadPose, FaceMeasurements } from '@/lib/headPose'

interface GlassesSceneProps {
  headPoseRef: React.RefObject<HeadPose | null>
  facePositionRef: React.RefObject<FaceMeasurements | null>
  glassesScale: number
  overlayTexture: HTMLCanvasElement | null
  videoWidth: number
  videoHeight: number
}

export default function GlassesScene({
  headPoseRef,
  facePositionRef,
  glassesScale,
  overlayTexture,
  videoWidth,
  videoHeight,
}: GlassesSceneProps) {
  const fov = useMemo(
    () => estimateWebcamFOV(videoWidth || 1280, videoHeight || 720),
    [videoWidth, videoHeight],
  )

  return (
    <Canvas
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
      gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
      camera={{ fov, near: 0.1, far: 100, position: [0, 0, 5] }}
      dpr={1}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[0, 2, 5]} intensity={0.4} />
      <GlassesMesh
        headPoseRef={headPoseRef}
        facePositionRef={facePositionRef}
        glassesScale={glassesScale}
        overlayTexture={overlayTexture}
      />
    </Canvas>
  )
}
