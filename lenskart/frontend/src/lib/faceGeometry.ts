import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

export interface GlassesTransform {
  centerX: number
  centerY: number
  width: number
  rotation: number
}

// MediaPipe Face Mesh landmark indices
const LEFT_EYE_OUTER = 33
const RIGHT_EYE_OUTER = 263
const NOSE_BRIDGE = 6
const LEFT_TEMPLE = 234
const RIGHT_TEMPLE = 454

export function computeGlassesTransform(
  landmarks: NormalizedLandmark[],
  canvasWidth: number,
  canvasHeight: number,
  isMirrored: boolean,
): GlassesTransform {
  const noseBridge = landmarks[NOSE_BRIDGE]
  const leftEye = landmarks[LEFT_EYE_OUTER]
  const rightEye = landmarks[RIGHT_EYE_OUTER]
  const leftTemple = landmarks[LEFT_TEMPLE]
  const rightTemple = landmarks[RIGHT_TEMPLE]

  // Convert normalized coords to pixel coords
  let cx = noseBridge.x * canvasWidth
  let cy = noseBridge.y * canvasHeight

  if (isMirrored) {
    cx = canvasWidth - cx
  }

  // Face width from temple to temple (in pixels)
  let ltX = leftTemple.x * canvasWidth
  let rtX = rightTemple.x * canvasWidth
  if (isMirrored) {
    ltX = canvasWidth - ltX
    rtX = canvasWidth - rtX
  }
  const faceWidth = Math.abs(rtX - ltX)

  // Rotation from eye line
  let leX = leftEye.x * canvasWidth
  let leY = leftEye.y * canvasHeight
  let reX = rightEye.x * canvasWidth
  let reY = rightEye.y * canvasHeight
  if (isMirrored) {
    leX = canvasWidth - leX
    reX = canvasWidth - reX
  }
  const rotation = Math.atan2(reY - leY, reX - leX)

  return {
    centerX: cx,
    centerY: cy,
    width: faceWidth,
    rotation,
  }
}
