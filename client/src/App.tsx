import * as React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { HomePage } from '@/pages/HomePage';
import { TherapyPage } from '@/pages/therapy/TherapyPage';
import { CommunityPage } from '@/pages/community/CommunityPage';
import { ToolsPage } from '@/pages/tools/ToolsPage';
import { ResourcesPage } from '@/pages/resources/ResourcesPage';
import { PhaserGame } from '@/components/PhaserGame';
import { ToastProvider } from '@/components/ui/use-toast';
import { AuthCallback } from '@/pages/auth/AuthCallback';

// Lazy-loaded so Three.js only ships when the driving journey is opened.
const DrivingJourney = React.lazy(() => import('@/journey3d/DrivingJourney'));

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* Full-screen Phaser Game Route (no header/container) */}
          <Route path="/journey" element={<PhaserGame />} />

          {/* 3D driving version of the journey (no header) */}
          <Route
            path="/journey/drive"
            element={
              <React.Suspense
                fallback={
                  <div className="fixed inset-0 grid place-items-center bg-sky-200 text-stone-600">
                    Preparing your drive…
                  </div>
                }
              >
                <DrivingJourney />
              </React.Suspense>
            }
          />
          
          {/* Auth callback route (no header) */}
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* Standard App Routes with Header */}
          <Route path="*" element={
            <div className="min-h-screen bg-gray-50">
              <Header />
              <main className="container mx-auto px-4 py-8">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/therapy/*" element={<TherapyPage />} />
                  <Route path="/community/*" element={<CommunityPage />} />
                  <Route path="/tools/*" element={<ToolsPage />} />
                  <Route path="/resources/*" element={<ResourcesPage />} />
                </Routes>
              </main>
            </div>
          } />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
