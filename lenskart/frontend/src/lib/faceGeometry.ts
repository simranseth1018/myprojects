import type { NormalizedLandmark } from '@mediapipe/tasks-vision'

export interface GlassesTransform {
  centerX: number
  centerY: number
  width: number
  rotation: number
}

// MediaPipe Face Mesh landmark indices
const LEFT_EYE_OUTER = 33
const LEFT_EYE_INNER = 133
const RIGHT_EYE_OUTER = 263
const RIGHT_EYE_INNER = 362
const LEFT_TEMPLE = 234
const RIGHT_TEMPLE = 454

export function computeGlassesTransform(
  landmarks: NormalizedLandmark[],
  canvasWidth: number,
  canvasHeight: number,
  isMirrored: boolean,
): GlassesTransform {
  const leftEyeOuter = landmarks[LEFT_EYE_OUTER]
  const leftEyeInner = landmarks[LEFT_EYE_INNER]
  const rightEyeOuter = landmarks[RIGHT_EYE_OUTER]
  const rightEyeInner = landmarks[RIGHT_EYE_INNER]
  const leftTemple = landmarks[LEFT_TEMPLE]
  const rightTemple = landmarks[RIGHT_TEMPLE]

  // Eye centers
  const leftEyeCX = (leftEyeOuter.x + leftEyeInner.x) / 2
  const leftEyeCY = (leftEyeOuter.y + leftEyeInner.y) / 2
  const rightEyeCX = (rightEyeOuter.x + rightEyeInner.x) / 2
  const rightEyeCY = (rightEyeOuter.y + rightEyeInner.y) / 2

  // Center between the two eyes (where the glasses bridge sits)
  let cx = ((leftEyeCX + rightEyeCX) / 2) * canvasWidth
  let cy = ((leftEyeCY + rightEyeCY) / 2) * canvasHeight

  if (isMirrored) {
    cx = canvasWidth - cx
  }

  // Face width from temple to temple
  let ltX = leftTemple.x * canvasWidth
  let rtX = rightTemple.x * canvasWidth
  if (isMirrored) {
    ltX = canvasWidth - ltX
    rtX = canvasWidth - rtX
  }
  const faceWidth = Math.abs(rtX - ltX)

  // Rotation from eye line
  let leX = leftEyeOuter.x * canvasWidth
  let leY = leftEyeOuter.y * canvasHeight
  let reX = rightEyeOuter.x * canvasWidth
  let reY = rightEyeOuter.y * canvasHeight
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
