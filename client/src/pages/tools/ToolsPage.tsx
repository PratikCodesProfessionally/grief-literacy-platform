import * as React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { JournalingPage } from './JournalingPage';
import { MeditationPage } from './MeditationPage';
import MemoryGardenPage from './MemoryGardenPage';
import { LettersPage } from './LettersPage';

export function ToolsPage() {
  const location = useLocation();
  const isMainPage = location.pathname === '/tools';

  const toolCategories = [
    {
      title: 'Reflective Tools',
      tools: [
        {
          name: 'Grief Journaling',
          description: 'Guided prompts for daily reflection and processing',
          icon: '📔',
          path: '/tools/journaling',
        },
        {
          name: 'Letters to Loved Ones',
          description: 'Write messages to those you\'ve lost',
          icon: '💌',
          path: '/tools/letters',
        },
        {
          name: 'Memory Garden',
          description: 'Create a digital space to honor memories',
          icon: '🌸',
          path: '/tools/memory-garden',
        },
      ],
    },
    {
      title: 'Coping Tools',
      tools: [
        {
          name: 'Guided Meditations',
          description: 'Mindfulness and healing meditation sessions',
          icon: '🧘‍♀️',
          path: '/tools/meditation',
        },
        {
          name: 'Emergency Toolkit',
          description: 'Quick access to calming resources when overwhelmed',
          icon: '🆘',
          path: '/tools/emergency',
        },
        {
          name: 'Breathing Exercises',
          description: 'Simple techniques for managing difficult moments',
          icon: '🫁',
          path: '/tools/breathing',
        },
      ],
    },
    {
      title: 'Tracking Tools',
      tools: [
        {
          name: 'Grief Timeline',
          description: 'Track your emotional journey over time',
          icon: '📈',
          path: '/tools/timeline',
        },
        {
          name: 'Mood Check-in',
          description: 'Daily emotional awareness and logging',
          icon: '💭',
          path: '/tools/mood',
        },
        {
          name: 'Progress Journal',
          description: 'Celebrate small wins and growth moments',
          icon: '🌱',
          path: '/tools/progress',
        },
      ],
    },
  ];

  if (isMainPage) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
            Healing Tools
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Practical tools and resources to support you through your grief journey
          </p>
        </div>

        {toolCategories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
              {category.title}
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {category.tools.map((tool, toolIndex) => (
                <Card key={toolIndex} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="text-center">
                    <div className="text-3xl mb-2">{tool.icon}</div>
                    <CardTitle className="text-lg">{tool.name}</CardTitle>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to={tool.path}>
                      <Button className="w-full">Use Tool</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/journaling" element={<JournalingPage />} />
      <Route path="/meditation" element={<MeditationPage />} />
      <Route path="/memory-garden" element={<MemoryGardenPage />} />
      <Route path="/letters" element={<LettersPage />} />
    </Routes>
  );
}