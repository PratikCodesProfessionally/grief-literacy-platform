import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, MessageCircle } from 'lucide-react';
import { supportGroupsService } from '@/services/SupportGroupsService';
import { SupportGroup, User } from '@/types/supportGroups';

interface MyGroupsProps {
  user: User;
  onViewGroup: (group: SupportGroup) => void;
  onBrowseGroups: () => void;
}

export function MyGroups({ user, onViewGroup, onBrowseGroups }: MyGroupsProps) {
  const [myGroups, setMyGroups] = React.useState<SupportGroup[]>([]);

  React.useEffect(() => {
    loadMyGroups();
  }, [user.id]);

  const loadMyGroups = () => {
    const groups = supportGroupsService.getUserGroups(user.id);
    setMyGroups(groups);
  };

  if (myGroups.length === 0) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            My Support Groups
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            You haven't joined any groups yet
          </p>
        </div>

        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <div className="text-6xl mb-4">🤝</div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
              Start Your Journey
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Join a support group to connect with others who understand what you're going through.
              Share experiences, offer support, and find comfort in community.
            </p>
            <Button size="lg" onClick={onBrowseGroups}>
              Browse Support Groups
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            My Support Groups
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            You're a member of {myGroups.length} {myGroups.length === 1 ? 'group' : 'groups'}
          </p>
        </div>
        <Button onClick={onBrowseGroups}>
          Join More Groups
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {myGroups.map((group) => (
          <Card key={group.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{group.icon}</span>
                    <CardTitle className="text-lg">{group.topic}</CardTitle>
                  </div>
                  <CardDescription>{group.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{group.members.length}/{group.maxCapacity} members</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>{group.posts.length} messages</span>
                  </div>
                </div>
              </div>

              {group.posts.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 text-xs text-gray-600 dark:text-gray-400">
                  Last message: {new Date(group.posts[group.posts.length - 1].createdAt).toLocaleDateString()}
                </div>
              )}

              <Button 
                className="w-full"
                onClick={() => onViewGroup(group)}
              >
                View Group
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
