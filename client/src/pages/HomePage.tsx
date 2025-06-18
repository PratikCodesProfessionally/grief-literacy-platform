import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function HomePage() {
  const features = [
    {
      title: 'Therapeutic Approaches',
      description: 'Explore story, art, poetry, and music therapy options',
      link: '/therapy',
      icon: '🎨',
    },
    {
      title: 'Support Community',
      description: 'Connect with others on similar journeys',
      link: '/community',
      icon: '💬',
    },
    {
      title: 'Healing Tools',
      description: 'Journaling, meditation, and coping resources',
      link: '/tools',
      icon: '🛠️',
    },
    {
      title: 'Learning Resources',
      description: 'Books, courses, and educational content',
      link: '/resources',
      icon: '📚',
    },
  ];

  return (
    <div className="space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-800 dark:text-white">
          Welcome to Your
        </h1>
        <h2 className="text-3xl md:text-5xl font-bold text-purple-600 dark:text-purple-400">
          Grief Literacy Journey
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          A compassionate space for healing, learning, and growing through grief with therapeutic approaches, 
          community support, and personalized tools.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature) => (
          <Card key={feature.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="text-4xl mb-2">{feature.icon}</div>
              <CardTitle className="text-lg">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to={feature.link}>
                <Button className="w-full">Explore</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-8 text-center">
        <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
          You Are Not Alone
        </h3>
        <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Grief is a natural response to loss. This app provides evidence-based therapeutic approaches, 
          peer support, and practical tools to help you navigate your unique journey. 
          Remember: healing is not linear, and every feeling is valid.
        </p>
      </div>
    </div>
  );
}
