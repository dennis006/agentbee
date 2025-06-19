import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

interface ToastProps {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  onClose: (id: string) => void
  autoClose?: boolean
  duration?: number
}

const Toast = ({ id, message, type, onClose, autoClose = true, duration = 4000 }: ToastProps) => {
  const [isExiting, setIsExiting] = useState(false)

  const handleClose = useCallback(() => {
    setIsExiting(true)
    setTimeout(() => {
      onClose(id)
    }, 300)
  }, [id, onClose])

  useEffect(() => {
    if (!autoClose) return

    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => {
      clearTimeout(timer)
    }
  }, [autoClose, duration, handleClose])

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20',
          border: 'border-green-400/50',
          icon: CheckCircle,
          iconColor: 'text-green-400',
          glow: 'shadow-green-glow',
          progressColor: 'bg-gradient-to-r from-green-400 to-emerald-400'
        }
      case 'error':
        return {
          bg: 'bg-gradient-to-r from-red-500/20 to-pink-500/20',
          border: 'border-red-400/50',
          icon: XCircle,
          iconColor: 'text-red-400',
          glow: 'shadow-red-glow',
          progressColor: 'bg-gradient-to-r from-red-400 to-pink-400'
        }
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20',
          border: 'border-yellow-400/50',
          icon: AlertTriangle,
          iconColor: 'text-yellow-400',
          glow: 'shadow-yellow-glow',
          progressColor: 'bg-gradient-to-r from-yellow-400 to-orange-400'
        }
      case 'info':
        return {
          bg: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20',
          border: 'border-blue-400/50',
          icon: Info,
          iconColor: 'text-blue-400',
          glow: 'shadow-blue-glow',
          progressColor: 'bg-gradient-to-r from-blue-400 to-cyan-400'
        }
    }
  }

  const styles = getTypeStyles()
  const Icon = styles.icon

  return (
    <div 
      className={`
        p-4 rounded-xl border backdrop-blur-xl max-w-md mb-3
        transition-all duration-300 ease-in-out
        ${isExiting ? 'transform translate-x-full opacity-0 scale-95' : 'transform translate-x-0 opacity-100 scale-100'}
        ${styles.bg} ${styles.border} ${styles.glow}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <Icon className={`w-6 h-6 ${styles.iconColor}`} />
        </div>

        {/* Message */}
        <div className="flex-1 text-dark-text font-medium">
          {message}
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-dark-muted hover:text-dark-text transition-colors duration-200 hover:scale-110"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress Bar */}
      {autoClose && !isExiting && (
        <div className="mt-3 h-1 bg-dark-bg/50 rounded-full overflow-hidden">
          <div 
            className={`h-full ${styles.progressColor}`}
            style={{
              width: '100%',
              animation: `toast-progress ${duration}ms linear forwards`,
              transformOrigin: 'left'
            }}
          />
        </div>
      )}

      {/* Inject keyframes */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes toast-progress {
            from { width: 100%; }
            to { width: 0%; }
          }
        `
      }} />
    </div>
  )
}

// Toast Manager Hook
interface ToastState {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastState[]>([])

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { id, message, type }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const success = useCallback((message: string) => addToast(message, 'success'), [addToast])
  const error = useCallback((message: string) => addToast(message, 'error'), [addToast])
  const warning = useCallback((message: string) => addToast(message, 'warning'), [addToast])
  const info = useCallback((message: string) => addToast(message, 'info'), [addToast])

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  }
}

// Toast Container Component
export const ToastContainer = ({ toasts, removeToast }: { 
  toasts: ToastState[], 
  removeToast: (id: string) => void 
}) => {
  if (!toasts || toasts.length === 0) {
    return null
  }

  return (
    <div className="fixed top-6 right-6 z-[9999] space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={removeToast}
          />
        </div>
      ))}
    </div>
  )
}

export default Toast 