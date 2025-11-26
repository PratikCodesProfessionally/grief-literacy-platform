import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Send, Video, VideoOff } from 'lucide-react';
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
  const [showVideoInfo, setShowVideoInfo] = React.useState(false);
  const [isVideoCallActive, setIsVideoCallActive] = React.useState(false);
  const [jitsiLoaded, setJitsiLoaded] = React.useState(false);
  const jitsiContainerRef = React.useRef<HTMLDivElement>(null);
  const jitsiApiRef = React.useRef<any>(null);

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

  // Load Jitsi script
  React.useEffect(() => {
    // Check if script is already loaded
    if (document.getElementById('jitsi-script')) {
      // Check if API is available
      if (typeof (window as any).JitsiMeetExternalAPI !== 'undefined') {
        setJitsiLoaded(true);
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'jitsi-script';
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => {
      console.log('Jitsi script loaded successfully');
      setJitsiLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load Jitsi script');
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup on unmount
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }
    };
  }, []);

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

  const handleStartVideoCall = () => {
    if (isVideoCallActive) {
      // End the call
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
      setIsVideoCallActive(false);
      return;
    }

    // Check if Jitsi API is loaded
    if (!jitsiLoaded || typeof (window as any).JitsiMeetExternalAPI === 'undefined') {
      alert('Video conferencing is still loading... Please wait a moment and try again.');
      return;
    }

    // Start the call
    setIsVideoCallActive(true);
    setShowVideoInfo(false);

    // Small delay to ensure container is rendered
    setTimeout(() => {
      if (!jitsiContainerRef.current) {
        console.error('Jitsi container not found');
        setIsVideoCallActive(false);
        return;
      }

      // Create a unique room name based on group ID
      const roomName = `SacredCircle-${group.id}`;
      
      console.log('Starting Jitsi call with room:', roomName);
      
      try {
        // Initialize Jitsi Meet with public server
        const domain = 'meet.jit.si';
        const options = {
          roomName: roomName,
          width: '100%',
          height: 600,
          parentNode: jitsiContainerRef.current,
          userInfo: {
            displayName: user.username,
          },
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: true,
            enableWelcomePage: false,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 
              'fullscreen', 'fodeviceselection', 'hangup', 'chat',
              'raisehand', 'videoquality', 'filmstrip', 'stats',
              'shortcuts', 'tileview', 'videobackgroundblur', 'help'
            ],
          },
        };

        const api = new (window as any).JitsiMeetExternalAPI(domain, options);
        jitsiApiRef.current = api;

        console.log('Jitsi API initialized');

        // Event listeners
        api.addEventListener('videoConferenceJoined', () => {
          console.log('Joined video conference');
        });

        api.addEventListener('videoConferenceLeft', () => {
          console.log('Left video conference');
          setIsVideoCallActive(false);
          if (api) api.dispose();
          jitsiApiRef.current = null;
        });

        api.addEventListener('readyToClose', () => {
          console.log('Ready to close');
          setIsVideoCallActive(false);
          if (api) api.dispose();
          jitsiApiRef.current = null;
        });
      } catch (error) {
        console.error('Error starting Jitsi call:', error);
        setIsVideoCallActive(false);
        alert('Failed to start video call. Please try again.');
      }
    }, 100);
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
              variant={isVideoCallActive ? "destructive" : "default"}
              size="sm" 
              onClick={handleStartVideoCall}
              className={isVideoCallActive ? "" : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"}
            >
              {isVideoCallActive ? (
                <>
                  <VideoOff className="h-4 w-4 mr-2" />
                  End Call
                </>
              ) : (
                <>
                  <Video className="h-4 w-4 mr-2" />
                  Start Video Call
                </>
              )}
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
                    {group.members.length}/{group.maxCapacity} Members
                  </Badge>
                  <span className="text-purple-300/50 italic text-sm">
                    A sacred space for healing
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Video Call Container */}
      {isVideoCallActive && (
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-2xl rounded-full" />
          <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl p-8 border border-blue-400/30 shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Video className="h-6 w-6 text-blue-400" />
                  <h2 className="text-2xl font-serif text-blue-200">Video Conference</h2>
                </div>
                <Badge className="bg-green-500/20 text-green-300 border-green-400/30 px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Live</span>
                  </div>
                </Badge>
              </div>
              
              <div 
                ref={jitsiContainerRef} 
                className="w-full rounded-2xl overflow-hidden bg-slate-950 shadow-inner"
                style={{ minHeight: '600px' }}
              />
              
              <div className="bg-blue-900/20 border border-blue-400/20 rounded-2xl p-4">
                <p className="text-sm text-blue-200/80 text-center">
                  🔒 This video call is private and encrypted. Only members of this sacred circle can join.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Call Info */}
      {showVideoInfo && !isVideoCallActive && (
        <Card className="border-blue-500 bg-blue-50 dark:bg-blue-900/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Video className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <CardTitle className="text-lg">Video Conferencing</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowVideoInfo(false)}>
                ✕
              </Button>
            </div>
            <CardDescription>
              Connect face-to-face with your circle members (max 7 participants)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-sm">Powered by Jitsi Meet</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="mt-1">✅</div>
                  <div>
                    <strong>Free & Secure:</strong> End-to-end encrypted video calls
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="mt-1">✅</div>
                  <div>
                    <strong>No Installation:</strong> Works directly in your browser
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="mt-1">✅</div>
                  <div>
                    <strong>Private Rooms:</strong> Each circle has its own unique room
                  </div>
                </div>
              </div>
            </div>

            <Button className="w-full" onClick={handleStartVideoCall}>
              <Video className="h-4 w-4 mr-2" />
              Start Video Call Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Post Form */}
      {!isVideoCallActive && (
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
      )}

      {/* Posts Feed */}
      {!isVideoCallActive && (
        <div className="space-y-6">
          <h2 className="text-2xl font-serif text-amber-100/90 tracking-wide text-center">
            Circle Messages ({group.posts.length})
          </h2>
        
          {group.posts.length === 0 ? (
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
              {[...group.posts].reverse().map((post, index) => (
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
      )}
      
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