import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users } from 'lucide-react';

export function SupportCirclesPage() {
  const supportCircles = [
    {
      title: 'Loss of Parent',
      description: 'For those grieving the loss of a mother or father',
      members: 234,
      lastActive: '2 min ago',
      tags: ['Parent', 'Adult Children'],
    },
    {
      title: 'Pet Loss Support',
      description: 'Grieving our beloved animal companions',
      members: 156,
      lastActive: '15 min ago',
      tags: ['Pets', 'Companion Animals'],
    },
    {
      title: 'Sudden Loss',
      description: 'Processing unexpected and traumatic losses',
      members: 89,
      lastActive: '1 hour ago',
      tags: ['Sudden', 'Trauma', 'Shock'],
    },
    {
      title: 'Pregnancy & Infant Loss',
      description: 'Supporting those who have lost during pregnancy or infancy',
      members: 67,
      lastActive: '3 hours ago',
      tags: ['Pregnancy', 'Infant', 'Miscarriage'],
    },
    {
      title: 'Young Adults Grieving',
      description: 'Grief support specifically for ages 18-35',
      members: 143,
      lastActive: '30 min ago',
      tags: ['Young Adults', 'Peer Support'],
    },
    {
      title: 'Relationship Loss',
      description: 'Grieving the end of significant relationships',
      members: 78,
      lastActive: '45 min ago',
      tags: ['Relationships', 'Breakup', 'Divorce'],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/community">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Community
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          🤝 Support Circles
        </h1>
      </div>

      <div className="grid gap-4">
        {supportCircles.map((circle, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-lg">{circle.title}</CardTitle>
                  <CardDescription>{circle.description}</CardDescription>
                  <div className="flex flex-wrap gap-1">
                    {circle.tags.map((tag, tagIndex) => (
                      <Badge key={tagIndex} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button>Join Circle</Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{circle.members} members</span>
                </div>
                <span>Last active: {circle.lastActive}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-800 dark:text-blue-200">
            Can't find your circle?
          </CardTitle>
          <CardDescription className="text-blue-600 dark:text-blue-300">
            Request a new support circle for your specific type of loss
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
            Request New Circle
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
