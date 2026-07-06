import { motion } from 'framer-motion'
import { Video } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CameraPermissionPromptProps {
  onStart: () => void
  error: string | null
}

export default function CameraPermissionPrompt({ onStart, error }: CameraPermissionPromptProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'w-full max-w-lg aspect-[3/4] border-2 border-dashed rounded-3xl',
        'flex flex-col items-center justify-center gap-5',
        'border-gray-700 bg-gray-900/40',
      )}
    >
      <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center">
        <Video className="w-9 h-9 text-brand-400" />
      </div>
      <div className="text-center px-6">
        <p className="text-lg font-semibold text-gray-200">Enable Your Camera</p>
        <p className="text-sm text-gray-500 mt-1">
          We need camera access to show a live preview with glasses overlaid on your face.
        </p>
      </div>
      {error && (
        <div className="text-center px-6">
          <p className="text-sm text-red-400">{error}</p>
          <p className="text-xs text-gray-500 mt-1">
            Click the camera icon in your browser's address bar to reset permissions.
          </p>
        </div>
      )}
      <button onClick={onStart} className="btn-primary text-sm gap-2">
        <Video className="w-4 h-4" />
        Enable Camera
      </button>
    </motion.div>
  )
}
