'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast { id: number; message: string; type: ToastType; }
interface ToastContextType { showToast: (message: string, type?: ToastType) => void; }

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });
export function useToast() { return useContext(ToastContext); }

const CONFIG: Record<ToastType, { icon: typeof CheckCircle2; bg: string; border: string }> = {
  success: { icon: CheckCircle2,  bg: 'linear-gradient(135deg,#059669,#10b981)', border: 'rgba(16,185,129,0.35)' },
  error:   { icon: XCircle,       bg: 'linear-gradient(135deg,#dc2626,#ef4444)', border: 'rgba(239,68,68,0.35)'  },
  warning: { icon: AlertTriangle, bg: 'linear-gradient(135deg,#d97706,#f59e0b)', border: 'rgba(245,158,11,0.35)' },
  info:    { icon: Info,          bg: 'linear-gradient(135deg,#0284c7,#0ea5e9)', border: 'rgba(14,165,233,0.35)' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev.slice(-2), { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Container — always centred, never shifts layout */}
      <div
        aria-live="polite"
        aria-atomic="false"
        style={{
          position: 'fixed',
          top: '1.25rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          pointerEvents: 'none',
          width: 'max-content',
          maxWidth: 'min(420px, 90vw)',
        }}
      >
        {toasts.map(toast => {
          const { icon: Icon, bg, border } = CONFIG[toast.type];
          return (
            <div
              key={toast.id}
              role="alert"
              className="toast"
              style={{ background: bg, border: `1px solid ${border}`, pointerEvents: 'auto' }}
            >
              <Icon size={17} strokeWidth={2.5} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, textAlign: 'center', letterSpacing: '0.01em' }}>
                {toast.message}
              </span>
              <button
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss"
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: '0.4rem',
                  padding: '0.15rem',
                  cursor: 'pointer',
                  color: 'white',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
              >
                <X size={13} strokeWidth={3} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}