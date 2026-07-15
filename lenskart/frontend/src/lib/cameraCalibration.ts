/**
 * Estimate the webcam's vertical FOV for Three.js PerspectiveCamera.
 * Most consumer webcams have ~60° horizontal FOV.
 */
export function estimateWebcamFOV(
  videoWidth: number,
  videoHeight: number,
  horizontalFovDeg = 60,
): number {
  const aspect = videoWidth / videoHeight
  const hFovRad = (horizontalFovDeg * Math.PI) / 180
  const vFovRad = 2 * Math.atan(Math.tan(hFovRad / 2) / aspect)
  return (vFovRad * 180) / Math.PI
}
