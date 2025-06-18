import * as React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SupportCirclesPage } from './SupportCirclesPage';
import { PeerSupportPage } from './PeerSupportPage';

export function CommunityPage() {
  const location = useLocation();
  const isMainPage = location.pathname === '/community';

  const communityOptions = [
    {
      title: 'Support Circles',
      description: 'Join safe, moderated group discussions by type of loss',
      icon: '🤝',
      path: '/community/circles',
    },
    {
      title: 'Peer Support',
      description: 'Connect one-on-one with someone who understands',
      icon: '💬',
      path: '/community/peer',
    },
    {
      title: 'Share Your Story',
      description: 'Anonymous sharing space for your experiences',
      icon: '📝',
      path: '/community/share',
    },
    {
      title: 'Memorial Wall',
      description: 'Honor and remember loved ones together',
      icon: '🕯️',
      path: '/community/memorial',
    },
  ];

  if (isMainPage) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
            Support Community
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Connect with others who understand your journey. You are not alone.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {communityOptions.map((option, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
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
                  <Button className="w-full">Join</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2 text-amber-800 dark:text-amber-200">
            Community Guidelines
          </h3>
          <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-300">
            <li>• Be respectful and compassionate</li>
            <li>• No judgment - everyone's grief is valid</li>
            <li>• Maintain confidentiality and privacy</li>
            <li>• Report inappropriate behavior</li>
            <li>• Take care of your emotional wellbeing</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/circles" element={<SupportCirclesPage />} />
      <Route path="/peer" element={<PeerSupportPage />} />
    </Routes>
  );
}
