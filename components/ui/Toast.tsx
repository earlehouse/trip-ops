'use client'
import { useEffect, useState, createContext, useContext, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 10) }, [])

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg text-sm font-medium transition-all duration-300',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        toast.type === 'success' && 'bg-gray-900 text-white',
        toast.type === 'error' && 'bg-red-600 text-white',
        toast.type === 'info' && 'bg-blue-600 text-white',
      )}
    >
      <span>{toast.message}</span>
      <button onClick={onDismiss} className="opacity-70 hover:opacity-100"><X size={14} /></button>
    </div>
  )
}
