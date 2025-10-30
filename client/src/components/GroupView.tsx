import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Send } from 'lucide-react';
import { supportGroupsService } from '@/services/SupportGroupsService';
import { SupportGroup, User, GroupPost } from '@/types/supportGroups';

interface GroupViewProps {
  group: SupportGroup;
  user: User;
  onBack: () => void;
}

export function GroupView({ group: initialGroup, user, onBack }: GroupViewProps) {
  const [group, setGroup] = React.useState<SupportGroup>(initialGroup);
  const [newPost, setNewPost] = React.useState('');
  const [isPosting, setIsPosting] = React.useState(false);

  // Refresh group data periodically (in a real app, this would be real-time)
  React.useEffect(() => {
    const interval = setInterval(() => {
      const updatedGroup = supportGroupsService.getGroup(group.id);
      if (updatedGroup) {
        setGroup(updatedGroup);
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [group.id]);

  const handlePostMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const content = newPost.trim();
    if (!content) return;

    setIsPosting(true);
    try {
      supportGroupsService.postToGroup(group.id, user.id, user.username, content);
      setNewPost('');
      
      // Refresh group data
      const updatedGroup = supportGroupsService.getGroup(group.id);
      if (updatedGroup) {
        setGroup(updatedGroup);
      }
    } catch (err) {
      console.error('Failed to post message:', err);
      alert('Failed to post message. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleLeaveGroup = () => {
    if (window.confirm('Are you sure you want to leave this group?')) {
      try {
        supportGroupsService.leaveGroup(group.id, user.id);
        onBack();
      } catch (err) {
        console.error('Failed to leave group:', err);
        alert('Failed to leave group. Please try again.');
      }
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Groups
        </Button>
        <Button variant="outline" size="sm" onClick={handleLeaveGroup}>
          Leave Group
        </Button>
      </div>

      {/* Group Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-3xl">{group.icon}</span>
                <CardTitle className="text-2xl">{group.topic}</CardTitle>
              </div>
              <CardDescription>{group.description}</CardDescription>
            </div>
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>{group.members.length}/{group.maxCapacity}</span>
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Post Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Share with Your Group</CardTitle>
          <CardDescription>
            Your message will be visible to all {group.members.length} members of this group
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePostMessage} className="space-y-4">
            <Textarea
              placeholder="Share your thoughts, feelings, or experiences..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              className="min-h-[100px]"
              disabled={isPosting}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isPosting || !newPost.trim()}>
                <Send className="h-4 w-4 mr-2" />
                {isPosting ? 'Posting...' : 'Post Message'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Posts Feed */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Group Messages ({group.posts.length})
        </h2>
        
        {group.posts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-4xl mb-4">💬</div>
              <p className="text-gray-600 dark:text-gray-400">
                No messages yet. Be the first to share!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {[...group.posts].reverse().map((post) => (
              <Card key={post.id} className={post.authorId === user.id ? 'bg-blue-50 dark:bg-blue-900/10' : ''}>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {post.authorUsername}
                        </span>
                        {post.authorId === user.id && (
                          <Badge variant="secondary" className="text-xs">You</Badge>
                        )}
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(post.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {post.content}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
