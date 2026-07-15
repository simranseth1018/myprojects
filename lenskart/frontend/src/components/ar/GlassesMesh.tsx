import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { HeadPose, FaceMeasurements } from '@/lib/headPose'

interface GlassesMeshProps {
  headPoseRef: React.RefObject<HeadPose | null>
  facePositionRef: React.RefObject<FaceMeasurements | null>
  glassesScale: number
  overlayTexture: HTMLCanvasElement | null
}

export default function GlassesMesh({
  headPoseRef,
  facePositionRef,
  glassesScale,
  overlayTexture,
}: GlassesMeshProps) {
  const groupRef = useRef<THREE.Group>(null)

  // ── Glasses texture ──────────────────────────────────────────────────────
  const texture = useMemo(() => {
    if (!overlayTexture) return null
    const tex = new THREE.CanvasTexture(overlayTexture)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.needsUpdate = true
    return tex
  }, [overlayTexture])

  useEffect(() => {
    if (texture && overlayTexture) {
      texture.image = overlayTexture
      texture.needsUpdate = true
    }
  }, [overlayTexture, texture])

  const aspect = overlayTexture
    ? overlayTexture.width / overlayTexture.height
    : 3.0

  // ── Lens reflection texture (subtle gradient) ────────────────────────────
  const reflectionTex = useMemo(() => {
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    // Subtle diagonal gradient simulating window reflection
    const grad = ctx.createLinearGradient(0, 0, size, size)
    grad.addColorStop(0, 'rgba(255,255,255,0)')
    grad.addColorStop(0.3, 'rgba(255,255,255,0.04)')
    grad.addColorStop(0.5, 'rgba(255,255,255,0.12)')
    grad.addColorStop(0.7, 'rgba(255,255,255,0.04)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    return tex
  }, [])

  // ── Shadow texture (soft oval shadow for nose/cheeks) ────────────────────
  const shadowTex = useMemo(() => {
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    grad.addColorStop(0, 'rgba(0,0,0,0.25)')
    grad.addColorStop(0.5, 'rgba(0,0,0,0.10)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    return tex
  }, [])

  // ── Per-frame update ─────────────────────────────────────────────────────
  useFrame(() => {
    const group = groupRef.current
    const pose = headPoseRef.current
    const face = facePositionRef.current
    if (!group || !pose || !face) {
      if (group) group.visible = false
      return
    }

    group.visible = true

    // Position: map nose bridge to Three.js world coords
    const scaleFactor = 3.5
    group.position.set(
      -face.noseBridgeX * scaleFactor,  // Negate for mirror
      face.noseBridgeY * scaleFactor,
      0,
    )

    // Rotation from head pose
    group.rotation.set(
      -pose.pitch,
      pose.yaw,
      -pose.roll,
    )

    // Scale based on IPD (more accurate than face width)
    // IPD typically ~62mm for adults; the glasses should span wider than IPD
    const ipdScale = (face.ipd / 640) * glassesScale * 3.2
    const faceScale = (face.faceWidth / 640) * glassesScale * 2.5
    // Blend IPD and face width for robustness
    const baseScale = face.ipd > 0
      ? ipdScale * 0.6 + faceScale * 0.4
      : faceScale
    group.scale.set(baseScale * aspect, baseScale, 1)
  })

  if (!texture) return null

  return (
    <group ref={groupRef}>
      {/* Main glasses frame */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={texture}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Lens reflection overlay (subtle) */}
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          map={reflectionTex}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Shadow on nose/cheeks (behind the frame) */}
      <mesh position={[0, -0.35, -0.01]} rotation={[0.3, 0, 0]}>
        <planeGeometry args={[0.6, 0.25]} />
        <meshBasicMaterial
          map={shadowTex}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* Bridge shadow (small dark shadow where bridge meets nose) */}
      <mesh position={[0, -0.08, -0.005]}>
        <planeGeometry args={[0.15, 0.08]} />
        <meshBasicMaterial
          map={shadowTex}
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}
