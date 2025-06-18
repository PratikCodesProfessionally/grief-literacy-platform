import * as React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { HomePage } from '@/pages/HomePage';
import { TherapyPage } from '@/pages/therapy/TherapyPage';
import { CommunityPage } from '@/pages/community/CommunityPage';
import { ToolsPage } from '@/pages/tools/ToolsPage';
import { ResourcesPage } from '@/pages/resources/ResourcesPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
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
    </Router>
  );
}

export default App;