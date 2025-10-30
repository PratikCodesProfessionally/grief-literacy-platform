import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, MessageCircle } from 'lucide-react';
import { supportGroupsService } from '@/services/SupportGroupsService';
import { SupportGroup, User, GroupTopicTemplate } from '@/types/supportGroups';

interface GroupBrowserProps {
  user: User;
  onJoinGroup: (group: SupportGroup) => void;
}

export function GroupBrowser({ user, onJoinGroup }: GroupBrowserProps) {
  const [templates] = React.useState<GroupTopicTemplate[]>(
    supportGroupsService.getGroupTemplates()
  );
  const [groupsByTopic, setGroupsByTopic] = React.useState<Map<string, SupportGroup[]>>(
    new Map()
  );

  React.useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = () => {
    const newMap = new Map<string, SupportGroup[]>();
    templates.forEach(template => {
      const groups = supportGroupsService.getGroupsByTopic(template.topic);
      newMap.set(template.topic, groups);
    });
    setGroupsByTopic(newMap);
  };

  const handleJoinGroup = (topic: string) => {
    try {
      // Find an available group for this topic
      const availableGroups = supportGroupsService.getAvailableGroupsForTopic(topic);
      
      let groupToJoin: SupportGroup;
      if (availableGroups.length > 0) {
        // Join the first available group
        groupToJoin = availableGroups[0];
      } else {
        // All groups are full, joinGroup will create a new one
        const allGroups = supportGroupsService.getGroupsByTopic(topic);
        groupToJoin = allGroups[0]; // Pass any group, it will create new one
      }

      const joinedGroup = supportGroupsService.joinGroup(groupToJoin.id, user.id);
      loadGroups(); // Refresh the display
      onJoinGroup(joinedGroup);
    } catch (err) {
      console.error('Failed to join group:', err);
    }
  };

  const getTopicStats = (topic: string): { total: number; available: number } => {
    const groups = groupsByTopic.get(topic) || [];
    return {
      total: groups.length,
      available: groups.filter(g => g.members.length < g.maxCapacity).length,
    };
  };

  const isUserInTopic = (topic: string): boolean => {
    const groups = groupsByTopic.get(topic) || [];
    return groups.some(g => g.members.includes(user.id));
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          Welcome, {user.username}! 👋
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Choose a support group to join. Each group has a maximum of 7 members for intimate, meaningful connections.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {templates.map((template) => {
          const stats = getTopicStats(template.topic);
          const isMember = isUserInTopic(template.topic);

          return (
            <Card key={template.topic} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{template.icon}</span>
                      <CardTitle className="text-lg">{template.topic}</CardTitle>
                    </div>
                    <CardDescription>{template.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{stats.total} {stats.total === 1 ? 'group' : 'groups'}</span>
                    </div>
                    {stats.available > 0 && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                        {stats.available} available
                      </Badge>
                    )}
                  </div>
                </div>

                {isMember ? (
                  <Button className="w-full" variant="outline" disabled>
                    ✓ Already a Member
                  </Button>
                ) : (
                  <Button 
                    className="w-full"
                    onClick={() => handleJoinGroup(template.topic)}
                  >
                    Join Group
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2 text-amber-800 dark:text-amber-200">
          How Support Groups Work
        </h3>
        <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-300">
          <li>• Each group has a maximum of 7 members for intimate support</li>
          <li>• When a group is full, we automatically create a new one</li>
          <li>• You can join multiple groups on different topics</li>
          <li>• Share your experiences and support others anonymously</li>
          <li>• All conversations remain within your group</li>
        </ul>
      </div>
    </div>
  );
}
