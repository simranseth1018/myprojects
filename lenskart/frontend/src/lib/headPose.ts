import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

export interface HeadPose {
  pitch: number // X rotation — nodding up/down
  yaw: number   // Y rotation — turning left/right
  roll: number  // Z rotation — tilting side to side
  tx: number
  ty: number
  tz: number
}

export interface FaceMeasurements {
  // Position in NDC [-1,1] for Three.js
  x: number
  y: number
  z: number
  // Precise measurements
  faceWidth: number          // temple-to-temple in pixels
  ipd: number                // interpupillary distance in pixels
  noseBridgeX: number        // nose bridge X in NDC
  noseBridgeY: number        // nose bridge Y in NDC
  // Left/right pupil positions (NDC)
  leftPupilX: number
  leftPupilY: number
  rightPupilX: number
  rightPupilY: number
  // Ear positions for temple alignment (NDC)
  leftEarX: number
  leftEarY: number
  rightEarX: number
  rightEarY: number
  // Jawline width for shadow placement
  jawWidth: number
}

// ─── MediaPipe landmark indices ─────────────────────────────────────────────
// Eyes
const LEFT_EYE_OUTER = 33
const LEFT_EYE_INNER = 133
const RIGHT_EYE_OUTER = 263
const RIGHT_EYE_INNER = 362
// Iris centers (available in MediaPipe Face Mesh with refine=true, indices 468-477)
const LEFT_IRIS_CENTER = 468
const RIGHT_IRIS_CENTER = 473
// Nose
const NOSE_BRIDGE_TOP = 6
const NOSE_TIP = 1
// Temples / face width
const LEFT_TEMPLE = 234
const RIGHT_TEMPLE = 454
// Ears (tragion points)
const LEFT_EAR = 234
const RIGHT_EAR = 454
// Jaw
const LEFT_JAW = 172
const RIGHT_JAW = 397

/**
 * Extract head pose (Euler angles + translation) from MediaPipe's
 * 4x4 facial transformation matrix (row-major, 16 floats).
 */
export function extractHeadPose(matrixData: Float32Array): HeadPose {
  const d = matrixData

  const pitch = Math.asin(clamp(-d[8], -1, 1))
  const cosPitch = Math.cos(pitch)

  let yaw: number
  let roll: number

  if (Math.abs(cosPitch) > 0.001) {
    yaw = Math.atan2(d[4], d[0])
    roll = Math.atan2(d[9], d[10])
  } else {
    yaw = Math.atan2(-d[1], d[5])
    roll = 0
  }

  return { pitch, yaw, roll, tx: d[3], ty: d[7], tz: d[11] }
}

/**
 * EMA smoothing to prevent jittery glasses.
 */
export function smoothPose(
  current: HeadPose,
  previous: HeadPose | null,
  alpha = 0.5,
): HeadPose {
  if (!previous) return current
  return {
    pitch: lerp(previous.pitch, current.pitch, alpha),
    yaw: lerp(previous.yaw, current.yaw, alpha),
    roll: lerp(previous.roll, current.roll, alpha),
    tx: lerp(previous.tx, current.tx, alpha),
    ty: lerp(previous.ty, current.ty, alpha),
    tz: lerp(previous.tz, current.tz, alpha),
  }
}

/**
 * Compute detailed face measurements for professional glasses fitting.
 *
 * Uses:
 * - Iris centers for IPD (interpupillary distance) and pupil alignment
 * - Nose bridge for bridge placement
 * - Temple/ear landmarks for temple arm alignment
 * - Jaw landmarks for shadow placement
 */
export function computeFaceMeasurements(
  landmarks: NormalizedLandmark[],
  canvasWidth: number,
  canvasHeight: number,
): FaceMeasurements {
  // ── Pupil / Iris positions ────────────────────────────────────────────────
  // MediaPipe provides iris center landmarks at indices 468 (left) and 473 (right)
  // If not available (older model), fall back to eye center
  const hasIris = landmarks.length > RIGHT_IRIS_CENTER
  const leftPupil = hasIris
    ? landmarks[LEFT_IRIS_CENTER]
    : midpoint(landmarks[LEFT_EYE_OUTER], landmarks[LEFT_EYE_INNER])
  const rightPupil = hasIris
    ? landmarks[RIGHT_IRIS_CENTER]
    : midpoint(landmarks[RIGHT_EYE_OUTER], landmarks[RIGHT_EYE_INNER])

  // IPD in pixels
  const ipd = Math.sqrt(
    ((rightPupil.x - leftPupil.x) * canvasWidth) ** 2 +
    ((rightPupil.y - leftPupil.y) * canvasHeight) ** 2,
  )

  // ── Nose bridge (where the glasses bridge sits) ───────────────────────────
  const noseBridge = landmarks[NOSE_BRIDGE_TOP]

  // ── Face width (temple to temple) ─────────────────────────────────────────
  const leftTemple = landmarks[LEFT_TEMPLE]
  const rightTemple = landmarks[RIGHT_TEMPLE]
  const faceWidth = Math.abs(rightTemple.x - leftTemple.x) * canvasWidth

  // ── Ear positions (for temple arm direction) ──────────────────────────────
  const leftEar = landmarks[LEFT_EAR]
  const rightEar = landmarks[RIGHT_EAR]

  // ── Jaw width (for shadow placement) ──────────────────────────────────────
  const leftJaw = landmarks[LEFT_JAW]
  const rightJaw = landmarks[RIGHT_JAW]
  const jawWidth = Math.abs(rightJaw.x - leftJaw.x) * canvasWidth

  // ── Center position: midpoint between pupils on nose bridge ───────────────
  const centerX = (leftPupil.x + rightPupil.x) / 2
  const centerY = noseBridge.y  // Use nose bridge height, not pupil height

  // Convert to NDC [-1,1]
  const toNdcX = (v: number) => (v - 0.5) * 2
  const toNdcY = (v: number) => -(v - 0.5) * 2

  return {
    x: toNdcX(centerX),
    y: toNdcY(centerY),
    z: noseBridge.z,
    faceWidth,
    ipd,
    noseBridgeX: toNdcX(noseBridge.x),
    noseBridgeY: toNdcY(noseBridge.y),
    leftPupilX: toNdcX(leftPupil.x),
    leftPupilY: toNdcY(leftPupil.y),
    rightPupilX: toNdcX(rightPupil.x),
    rightPupilY: toNdcY(rightPupil.y),
    leftEarX: toNdcX(leftEar.x),
    leftEarY: toNdcY(leftEar.y),
    rightEarX: toNdcX(rightEar.x),
    rightEarY: toNdcY(rightEar.y),
    jawWidth,
  }
}

// Keep the old interface name as an alias for backward compatibility
export type FacePosition3D = FaceMeasurements

// Keep the old function name for backward compat (used by 2D loop)
export function computeGlasses3DPosition(
  landmarks: NormalizedLandmark[],
  canvasWidth: number,
  canvasHeight: number,
): FaceMeasurements {
  return computeFaceMeasurements(landmarks, canvasWidth, canvasHeight)
}

function midpoint(a: NormalizedLandmark, b: NormalizedLandmark): NormalizedLandmark {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 }
}

function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a)
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}
