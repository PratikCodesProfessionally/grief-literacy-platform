import * as React from 'react';
import { useToast } from './use-toast';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4 w-full max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-lg shadow-lg p-4 transition-all duration-300 ${
            toast.variant === 'destructive'
              ? 'bg-red-600 text-white'
              : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
          }`}
        >
          <div className="flex flex-col gap-1">
            {toast.title && (
              <div className="font-semibold text-sm">
                {toast.title}
              </div>
            )}
            {toast.description && (
              <div className="text-sm opacity-90">
                {toast.description}
              </div>
            )}
            {toast.action && (
              <div className="mt-2">
                {toast.action}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
