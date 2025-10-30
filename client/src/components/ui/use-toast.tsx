import * as React from "react"

export interface Toast {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

type ToastActionElement = React.ReactElement

export interface ToasterToast extends Toast {
  action?: ToastActionElement
}

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 5000

type ToasterContextType = {
  toasts: ToasterToast[]
  toast: (props: Omit<ToasterToast, "id">) => {
    id: string
    dismiss: () => void
    update: (props: Omit<ToasterToast, "id">) => void
  }
  dismiss: (toastId?: string) => void
}

const ToasterContext = React.createContext<ToasterContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToasterToast[]>([])

  const toast = React.useCallback(
    (props: Omit<ToasterToast, "id">) => {
      const id = Math.random().toString(36).substring(2, 9)
      const newToast: ToasterToast = { ...props, id }

      setToasts((prevToasts) => {
        const updatedToasts = [newToast, ...prevToasts].slice(0, TOAST_LIMIT)
        return updatedToasts
      })

      // Auto dismiss after delay
      setTimeout(() => {
        dismiss(id)
      }, TOAST_REMOVE_DELAY)

      return {
        id,
        dismiss: () => dismiss(id),
        update: (newProps: Omit<ToasterToast, "id">) => {
          setToasts((prevToasts) =>
            prevToasts.map((t) => (t.id === id ? { ...t, ...newProps } : t))
          )
        },
      }
    },
    []
  )

  const dismiss = React.useCallback((toastId?: string) => {
    if (toastId) {
      setToasts((prevToasts) => prevToasts.filter((t) => t.id !== toastId))
    } else {
      setToasts([])
    }
  }, [])

  return (
    <ToasterContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToasterContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToasterContext)
  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return context
}
