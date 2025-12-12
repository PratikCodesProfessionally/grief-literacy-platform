import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Send, Video, Wifi, WifiOff, Copy } from 'lucide-react';
import { supportGroupsService } from '@/services/SupportGroupsService';
import { groupPresenceService } from '@/services/GroupPresenceService';
import { groupMessageService } from '@/services/GroupMessageService';
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
  
  // Real-time presence state
  const [realtimeMemberCount, setRealtimeMemberCount] = React.useState<number | null>(null);
  const [realtimeMembers, setRealtimeMembers] = React.useState<string[]>([]);
  const [isPresenceConnected, setIsPresenceConnected] = React.useState(false);
  
  // Real-time messages state
  const [realtimePosts, setRealtimePosts] = React.useState<GroupPost[]>(initialGroup.posts);

  // Generate consistent channel ID based on topic
  const getChannelId = React.useCallback(() => {
    return group.topic.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  }, [group.topic]);

  // Join presence channel when component mounts - use topic for consistent channel across devices
  React.useEffect(() => {
    if (groupPresenceService.isAvailable()) {
      const channelId = getChannelId();
      console.log('[GroupView] Joining presence channel:', channelId);
      
      groupPresenceService.joinGroup(channelId, user.username, {
        onMemberCountChange: (count, members) => {
          console.log(`[GroupView] Realtime member count: ${count}`, members);
          setRealtimeMemberCount(count);
          setRealtimeMembers(members);
          setIsPresenceConnected(true);
        },
        onError: (error) => {
          console.error('[GroupView] Presence error:', error);
          setIsPresenceConnected(false);
        },
      });
    }

    return () => {
      // Leave presence channel when component unmounts
      groupPresenceService.leaveGroup(getChannelId());
    };
  }, [getChannelId, user.username]);

  // Subscribe to realtime messages - use topic instead of group.id for cross-device sync
  React.useEffect(() => {
    if (groupMessageService.isAvailable()) {
      const channelId = getChannelId();
      console.log('[GroupView] Subscribing to message channel:', channelId);
      
      groupMessageService.subscribeToMessages(channelId, {
        onNewMessage: (newMessage) => {
          console.log('[GroupView] Received realtime message:', newMessage);
          // Add the new message if it doesn't already exist
          setRealtimePosts((prevPosts) => {
            const exists = prevPosts.some((p) => p.id === newMessage.id);
            if (exists) return prevPosts;
            return [...prevPosts, newMessage];
          });
        },
        onError: (error) => {
          console.error('[GroupView] Message subscription error:', error);
        },
      });
    }

    return () => {
      groupMessageService.unsubscribeFromMessages(getChannelId());
    };
  }, [getChannelId]);

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
      // Post to local storage
      const newMessage = supportGroupsService.postToGroup(group.id, user.id, user.username, content);
      setNewPost('');
      
      // Add to realtime posts immediately (optimistic update)
      setRealtimePosts((prevPosts) => [...prevPosts, newMessage]);
      
      // Broadcast to other devices via Supabase - use topic-based channel
      if (groupMessageService.isAvailable()) {
        await groupMessageService.broadcastMessage(getChannelId(), newMessage);
      }
      
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

  const handleStartVideoCall = () => {
    // Create a unique room name based on group ID
    const roomName = `GriefPlatformSacredCircle${group.id.replace(/[^a-zA-Z0-9]/g, '')}`;
    
    // Open Jitsi in a new tab - this works without authentication
    const jitsiUrl = `https://meet.jit.si/${roomName}#userInfo.displayName="${encodeURIComponent(user.username)}"`;
    
    console.log('Opening Jitsi call:', jitsiUrl);
    window.open(jitsiUrl, '_blank');
  };

  // Generate the video call link for sharing
  const getVideoCallLink = () => {
    const roomName = `GriefPlatformSacredCircle${group.id.replace(/[^a-zA-Z0-9]/g, '')}`;
    return `https://meet.jit.si/${roomName}`;
  };

  const handleCopyVideoLink = () => {
    const link = getVideoCallLink();
    navigator.clipboard.writeText(link).then(() => {
      alert('Video-Link kopiert! Teilen Sie diesen Link mit anderen Gruppenmitgliedern.');
    }).catch(() => {
      prompt('Kopieren Sie diesen Link:', link);
    });
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
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900/20 to-slate-900 -mx-4 -my-8 px-4 py-12">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="text-amber-200/70 hover:text-amber-200 hover:bg-amber-200/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sacred Circles
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="default"
              size="sm" 
              onClick={handleStartVideoCall}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Video className="h-4 w-4 mr-2" />
              Video Call starten
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopyVideoLink}
              className="text-purple-200/70 border-purple-200/20 hover:text-purple-200 hover:bg-purple-200/10"
            >
              Link kopieren
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLeaveGroup}
              className="text-amber-200/70 border-amber-200/20 hover:text-amber-200 hover:bg-amber-200/10"
            >
              Leave Circle
            </Button>
          </div>
        </div>

        {/* Group Info Card - Sacred Circles Style */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-rose-500/20 blur-2xl rounded-full" />
          <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl p-8 border border-amber-200/20 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="space-y-4 flex-1">
                <div className="flex items-center space-x-4">
                  <span className="text-5xl">{group.icon}</span>
                  <div>
                    <h1 className="text-3xl font-serif text-amber-100/90 tracking-wide">
                      {group.topic}
                    </h1>
                    <p className="text-purple-200/70 leading-relaxed mt-2">
                      {group.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6 pt-4 border-t border-amber-200/10">
                  <Badge 
                    variant="secondary" 
                    className="bg-purple-500/20 text-purple-200 border-purple-400/30 px-4 py-2"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {/* Use realtime count if available, otherwise fallback to localStorage count */}
                    {isPresenceConnected && realtimeMemberCount !== null 
                      ? `${realtimeMemberCount} Online`
                      : `${group.members.length}/${group.maxCapacity} Members`
                    }
                  </Badge>
                  {/* Show connection status indicator */}
                  {groupPresenceService.isAvailable() && (
                    <Badge 
                      variant="outline" 
                      className={`px-3 py-1 ${
                        isPresenceConnected 
                          ? 'bg-green-500/20 text-green-300 border-green-400/30' 
                          : 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
                      }`}
                    >
                      {isPresenceConnected ? (
                        <>
                          <Wifi className="h-3 w-3 mr-1" />
                          Live
                        </>
                      ) : (
                        <>
                          <WifiOff className="h-3 w-3 mr-1" />
                          Connecting...
                        </>
                      )}
                    </Badge>
                  )}
                  <span className="text-purple-300/50 italic text-sm">
                    A sacred space for healing
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Post Form */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-amber-500/10 blur-2xl rounded-full" />
        <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl p-8 border border-amber-200/20 shadow-xl">
          <h2 className="text-xl font-serif text-amber-100 mb-4">Share with Your Circle</h2>
          <p className="text-purple-200/60 text-sm mb-6">
            Your message will be visible to all {group.members.length} members of this sacred space
          </p>
            
            <form onSubmit={handlePostMessage} className="space-y-4">
              <Textarea
                placeholder="Share your thoughts, feelings, or experiences..."
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="min-h-[120px] bg-slate-900/50 border-amber-200/20 text-purple-100 placeholder:text-purple-300/40 focus:border-amber-400/50 rounded-2xl"
                disabled={isPosting}
              />
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isPosting || !newPost.trim()}
                  className="bg-gradient-to-r from-amber-500/80 to-rose-500/80 hover:from-amber-500 hover:to-rose-500 text-white border-0"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isPosting ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </form>
          </div>
        </div>

      {/* Posts Feed */}
      <div className="space-y-6">
        <h2 className="text-2xl font-serif text-amber-100/90 tracking-wide text-center">
          Circle Messages ({realtimePosts.length})
        </h2>
        
          {realtimePosts.length === 0 ? (
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 blur-2xl rounded-full" />
              <div className="relative bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-sm rounded-3xl p-12 border border-purple-300/20 text-center">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-purple-200/60 leading-relaxed">
                  No messages yet. Be the first to share in this sacred space.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {[...realtimePosts].reverse().map((post, index) => (
                <div 
                  key={post.id} 
                  className="relative group"
                  style={{
                    animation: `fadeIn 0.5s ease-out ${index * 0.1}s both`,
                  }}
                >
                  <div className={`absolute inset-0 blur-xl rounded-full transition-all duration-500 ${
                    post.authorId === user.id 
                      ? 'bg-gradient-to-r from-amber-500/20 to-rose-500/20' 
                      : 'bg-gradient-to-r from-purple-500/10 to-blue-500/10'
                  }`} />
                  <div className={`relative backdrop-blur-sm rounded-3xl p-6 border transition-all duration-300 ${
                    post.authorId === user.id
                      ? 'bg-gradient-to-br from-amber-900/30 to-rose-900/30 border-amber-400/30 hover:border-amber-400/50'
                      : 'bg-gradient-to-br from-slate-800/70 to-slate-900/70 border-purple-300/20 hover:border-purple-300/30'
                  }`}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className={`font-semibold ${
                            post.authorId === user.id ? 'text-amber-200' : 'text-purple-200'
                          }`}>
                            {post.authorUsername}
                          </span>
                          {post.authorId === user.id && (
                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/30 text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-purple-300/50">
                          {formatDate(post.createdAt)}
                        </span>
                      </div>
                      <p className="text-purple-100/90 whitespace-pre-wrap leading-relaxed">
                        {post.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      
      {/* CSS Animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}} />
    </div>
    </div>
  );
}