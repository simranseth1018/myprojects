import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { FaceAnalysisResult } from '@/types/user'

type TryOnMode = 'idle' | 'loading' | 'active' | 'error'
type FaceDetectionMode = 'idle' | 'loading' | 'analyzing' | 'done' | 'error'

interface TryOnState {
  mode: TryOnMode
  faceDetectionMode: FaceDetectionMode
  faceAnalysis: FaceAnalysisResult | null
  activeProductId: string | null
  activeVariantId: string | null
  isCameraPermitted: boolean
  error: string | null
  capturedImage: string | null
}

const initialState: TryOnState = {
  mode: 'idle',
  faceDetectionMode: 'idle',
  faceAnalysis: null,
  activeProductId: null,
  activeVariantId: null,
  isCameraPermitted: false,
  error: null,
  capturedImage: null,
}

const tryOnSlice = createSlice({
  name: 'tryOn',
  initialState,
  reducers: {
    setTryOnMode: (state, action: PayloadAction<TryOnMode>) => {
      state.mode = action.payload
    },
    setFaceDetectionMode: (state, action: PayloadAction<FaceDetectionMode>) => {
      state.faceDetectionMode = action.payload
    },
    setFaceAnalysis: (state, action: PayloadAction<FaceAnalysisResult>) => {
      state.faceAnalysis = action.payload
      state.faceDetectionMode = 'done'
    },
    setActiveProduct: (state, action: PayloadAction<{ productId: string; variantId: string }>) => {
      state.activeProductId = action.payload.productId
      state.activeVariantId = action.payload.variantId
    },
    setCameraPermitted: (state, action: PayloadAction<boolean>) => {
      state.isCameraPermitted = action.payload
    },
    setCapturedImage: (state, action: PayloadAction<string | null>) => {
      state.capturedImage = action.payload
    },
    setTryOnError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.mode = 'error'
    },
    resetTryOn: () => initialState,
  },
})

export const {
  setTryOnMode,
  setFaceDetectionMode,
  setFaceAnalysis,
  setActiveProduct,
  setCameraPermitted,
  setCapturedImage,
  setTryOnError,
  resetTryOn,
} = tryOnSlice.actions

export default tryOnSlice.reducer
