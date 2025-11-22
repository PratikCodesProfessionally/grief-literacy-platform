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

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* Full-screen Phaser Game Route (no header/container) */}
          <Route path="/journey" element={<PhaserGame />} />
          
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
