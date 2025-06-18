import * as React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StoryTherapyPage } from './StoryTherapyPage';
import { ArtTherapyPage } from './ArtTherapyPage';
import { PoetryTherapyPage } from './PoetryTherapyPage';
import { MusicTherapyPage } from './MusicTherapyPage';

export function TherapyPage() {
  const location = useLocation();
  const isMainPage = location.pathname === '/therapy';

  const therapyOptions = [
    {
      id: 'story',
      title: 'Story Therapy',
      description: 'Express and process grief through storytelling and narrative',
      icon: '📖',
      path: '/therapy/story',
    },
    {
      id: 'art',
      title: 'Art Therapy',
      description: 'Use visual expression to explore and heal emotional wounds',
      icon: '🎨',
      path: '/therapy/art',
    },
    {
      id: 'poetry',
      title: 'Poetry Therapy',
      description: 'Find healing through reading and writing poetry',
      icon: '✍️',
      path: '/therapy/poetry',
    },
    {
      id: 'music',
      title: 'Music Therapy',
      description: 'Process emotions through music, sound, and rhythm',
      icon: '🎵',
      path: '/therapy/music',
    },
  ];

  if (isMainPage) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
            Therapeutic Approaches
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Choose from evidence-based creative therapies to help process and express your grief
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {therapyOptions.map((option) => (
            <Card key={option.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{option.icon}</div>
                  <div>
                    <CardTitle>{option.title}</CardTitle>
                    <CardDescription>{option.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Link to={option.path}>
                  <Button className="w-full">Start Session</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/story" element={<StoryTherapyPage />} />
      <Route path="/art" element={<ArtTherapyPage />} />
      <Route path="/poetry" element={<PoetryTherapyPage />} />
      <Route path="/music" element={<MusicTherapyPage />} />
    </Routes>
  );
}
