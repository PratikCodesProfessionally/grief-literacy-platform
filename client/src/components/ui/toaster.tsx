import * as React from "react"
import { useToast } from "./use-toast"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <div className="fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map(({ id, title, description, variant, action }) => (
        <div
          key={id}
          role="alert"
          aria-live="polite"
          aria-atomic="true"
          className={cn(
            "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all animate-in slide-in-from-top-full sm:slide-in-from-bottom-full",
            variant === "destructive"
              ? "border-red-500 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-900 dark:text-red-50"
              : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
          )}
        >
          <div className="grid gap-1">
            {title && <div className="text-sm font-semibold">{title}</div>}
            {description && (
              <div className="text-sm opacity-90">{description}</div>
            )}
          </div>
          {action}
        </div>
      ))}
    </div>
  )
}
