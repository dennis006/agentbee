import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, X, Loader, Zap, Play, Square, RotateCcw } from 'lucide-react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'loading';
  title: string;
  message: string;
  duration?: number;
  action?: string;
  progress?: number;
}

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(toast.progress || 0);

  useEffect(() => {
    setIsVisible(true);
    
    // Auto-remove timer (except for loading toasts)
    if (toast.type !== 'loading' && toast.duration) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, toast.duration);
      
      return () => clearTimeout(timer);
    }
  }, [toast.duration, toast.type, onClose]);

  // Update progress for loading toasts
  useEffect(() => {
    if (toast.type === 'loading' && toast.progress !== undefined) {
      setProgress(toast.progress);
    }
  }, [toast.progress, toast.type]);

  const getToastIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-400" />;
      case 'loading':
        switch (toast.action) {
          case 'start':
            return <Play className="w-6 h-6 text-green-400 animate-pulse" />;
          case 'stop':
            return <Square className="w-6 h-6 text-red-400 animate-pulse" />;
          case 'restart':
            return <RotateCcw className="w-6 h-6 text-purple-400 animate-spin" />;
          default:
            return <Loader className="w-6 h-6 text-blue-400 animate-spin" />;
        }
      default:
        return <Zap className="w-6 h-6 text-blue-400" />;
    }
  };

  const getToastColors = () => {
    switch (toast.type) {
      case 'success':
        return 'border-green-500/50 bg-green-500/10 shadow-green-500/20';
      case 'error':
        return 'border-red-500/50 bg-red-500/10 shadow-red-500/20';
      case 'loading':
        switch (toast.action) {
          case 'start':
            return 'border-green-500/50 bg-green-500/10 shadow-green-500/20';
          case 'stop':
            return 'border-red-500/50 bg-red-500/10 shadow-red-500/20';
          case 'restart':
            return 'border-purple-500/50 bg-purple-500/10 shadow-purple-500/20';
          default:
            return 'border-blue-500/50 bg-blue-500/10 shadow-blue-500/20';
        }
      default:
        return 'border-blue-500/50 bg-blue-500/10 shadow-blue-500/20';
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${getToastColors()}
        border backdrop-blur-xl rounded-xl shadow-lg p-4
        max-w-sm w-full relative overflow-hidden
      `}
    >
      {/* Background Animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
      
      {/* Progress Bar für Loading Toasts */}
      {toast.type === 'loading' && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700/50">
          <div 
            className={`h-full transition-all duration-500 ease-out ${
              toast.action === 'start' ? 'bg-green-400' : 
              toast.action === 'stop' ? 'bg-red-400' : 
              toast.action === 'restart' ? 'bg-purple-400' : 'bg-blue-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getToastIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-semibold text-white mb-1">
                {toast.title}
              </h4>
              <p className="text-sm text-gray-300 leading-relaxed">
                {toast.message}
              </p>
              
              {/* Loading Details */}
              {toast.type === 'loading' && (
                <div className="mt-2 text-xs text-gray-400">
                  {toast.action === 'start' && '🚀 Bot wird gestartet...'}
                  {toast.action === 'stop' && '🛑 Bot wird gestoppt...'}
                  {toast.action === 'restart' && '🔄 Bot wird neugestartet...'}
                  {progress > 0 && (
                    <div className="mt-1">
                      <span className="text-gray-300">{Math.round(progress)}%</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Close Button (nur für non-loading toasts) */}
            {toast.type !== 'loading' && (
              <button
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(onClose, 300);
                }}
                className="flex-shrink-0 text-gray-400 hover:text-white transition-colors duration-200 p-1 hover:bg-white/10 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pulse Animation für Loading */}
      {toast.type === 'loading' && (
        <div className="absolute inset-0 border border-current rounded-xl opacity-20 animate-ping" />
      )}
    </div>
  );
};

// Hook for using toasts
export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id, duration: toast.duration || 5000 }]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const updateToast = (id: string, updates: Partial<Toast>) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, ...updates } : toast
    ));
  };

  // Specialized bot control toasts
  const showBotStarting = () => {
    return addToast({
      type: 'loading',
      action: 'start',
      title: 'Bot wird gestartet',
      message: 'Railway Container startet...',
      progress: 0
    });
  };

  const showBotStopping = () => {
    return addToast({
      type: 'loading',
      action: 'stop', 
      title: 'Bot wird gestoppt',
      message: 'Beende alle Verbindungen...',
      progress: 0
    });
  };

  const showBotRestarting = () => {
    return addToast({
      type: 'loading',
      action: 'restart',
      title: 'Bot wird neugestartet',
      message: 'Railway Container neustart...',
      progress: 0
    });
  };

  const showSuccess = (title: string, message: string) => {
    return addToast({
      type: 'success',
      title,
      message,
      duration: 4000
    });
  };

  const showError = (title: string, message: string) => {
    return addToast({
      type: 'error',
      title,
      message,
      duration: 6000
    });
  };

  // Simple functions for single-parameter usage (backwards compatibility)
  const success = (message: string) => {
    return addToast({
      type: 'success',
      title: 'Erfolg',
      message,
      duration: 4000
    });
  };

  const error = (message: string) => {
    return addToast({
      type: 'error',
      title: 'Fehler',
      message,
      duration: 6000
    });
  };

  return {
    toasts,
    addToast,
    removeToast,
    updateToast,
    showBotStarting,
    showBotStopping,
    showBotRestarting,
    showSuccess,
    showError,
    success,
    error
  };
}; 