import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageCircle, Heart } from 'lucide-react';

export function PeerSupportPage() {
  const peerMatches = [
    {
      name: 'Sarah M.',
      age: 28,
      lossType: 'Lost mother to cancer',
      timeframe: '6 months ago',
      compatibility: 95,
      bio: 'Also navigating life without mom. Love reading and hiking.',
    },
    {
      name: 'Mike T.',
      age: 35,
      lossType: 'Sudden loss of spouse',
      timeframe: '1 year ago',
      compatibility: 88,
      bio: 'Father of two, finding strength in community support.',
    },
    {
      name: 'Luna K.',
      age: 24,
      lossType: 'Pet loss (dog)',
      timeframe: '3 months ago',
      compatibility: 92,
      bio: 'Missing my best friend. Art therapy helps me cope.',
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
          💬 Peer Support
        </h1>
      </div>

      <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-green-800 dark:text-green-200">
            How Peer Support Works
          </CardTitle>
        </CardHeader>
        <CardContent className="text-green-700 dark:text-green-300">
          <ul className="space-y-2">
            <li>• We match you with someone who has experienced similar loss</li>
            <li>• Exchange supportive messages in a safe, private space</li>
            <li>• Share experiences, coping strategies, and encouragement</li>
            <li>• No pressure - communicate at your own pace</li>
          </ul>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Suggested Peer Matches
        </h2>
        
        {peerMatches.map((peer, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <CardTitle className="text-lg">{peer.name}</CardTitle>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Age {peer.age}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium">{peer.compatibility}% match</span>
                    </div>
                  </div>
                  <CardDescription>
                    <strong>{peer.lossType}</strong> • {peer.timeframe}
                  </CardDescription>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {peer.bio}
                  </p>
                </div>
                <div className="space-x-2">
                  <Button size="sm">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Connect
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Want to help others?</CardTitle>
          <CardDescription>
            Become a peer support volunteer and help someone else on their journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline">Volunteer as Peer Support</Button>
        </CardContent>
      </Card>
    </div>
  );
}
