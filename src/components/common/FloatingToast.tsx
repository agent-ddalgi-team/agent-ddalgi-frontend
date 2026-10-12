import React, { useEffect } from 'react'
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'

export interface ToastProps {
  message: string
  type?: 'success' | 'info' | 'warning'
  duration?: number
  onClose: () => void
}

export const FloatingToast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  duration = 3000,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 animate-bounce" />,
    info: <Info className="h-4 w-4 text-blue-500 shrink-0" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />,
  }

  const bgStyles = {
    success: 'border-emerald-200 bg-white/95 text-slate-800 shadow-emerald-500/10',
    info: 'border-blue-200 bg-white/95 text-slate-800 shadow-blue-500/10',
    warning: 'border-amber-200 bg-white/95 text-slate-800 shadow-amber-500/10',
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9990] animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
    >
      <div
        className={`flex items-center gap-2.5 rounded-full border px-4 py-2.5 shadow-lg backdrop-blur-md text-xs font-semibold ${bgStyles[type]}`}
      >
        {icons[type]}
        <span>{message}</span>
        <button
          type="button"
          onClick={onClose}
          className="ml-1 rounded-full p-0.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          aria-label="닫기"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
