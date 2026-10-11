import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';

import './index.css';
import { textRenderingOptimizer } from './lib/textRenderingOptimizer';

// @ts-ignore - PWA plugin type
import { registerSW } from 'virtual:pwa-register';

// Initialize text rendering optimizer for crystal-clear display across all browsers.
// It also owns the light/dark theme (the `dark` class on <html>).
textRenderingOptimizer;

// Register Service Worker for PWA
if (import.meta.env.PROD) {
  const updateSW = registerSW({
    onNeedRefresh() {
      if (confirm('Neue Version verfügbar! Jetzt aktualisieren?')) {
        updateSW(true);
      }
    },
    onOfflineReady() {
      console.log('App ist bereit für Offline-Nutzung');
    },
  });
} else if ('serviceWorker' in navigator) {
  // Dev: avoid noisy Workbox logs and stale SW behavior
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => reg.unregister());
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
