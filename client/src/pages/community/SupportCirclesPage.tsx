import * as React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, LogOut } from 'lucide-react';
import { StorageProviderFactory, StorageItem } from '@/services/StorageService';
import { AnonymousRegistration } from '@/components/AnonymousRegistration';
import { GroupView } from '@/components/GroupView';
import { supportGroupsService } from '@/services/SupportGroupsService';
import { User, SupportGroup } from '@/types/supportGroups';

// Circle data interface extending StorageItem
interface Circle extends StorageItem {
  title: string;
  description: string;
  expandedDescription: string;
  activity: 'gathering' | 'active' | 'quiet' | 'resting';
  tags: string[];
  atmosphere: string;
  memberIds: string[];
  maxMembers: number;
}

// User membership interface
interface UserMembership extends StorageItem {
  userId: string;
  circleIds: string[];
}

export function SupportCirclesPage() {
  const [circles, setCircles] = React.useState<Circle[]>([]);
  const [hoveredCircle, setHoveredCircle] = React.useState<string | null>(null);
  const [userId, setUserId] = React.useState<string>('');
  const [userMembership, setUserMembership] = React.useState<UserMembership | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [selectedGroup, setSelectedGroup] = React.useState<SupportGroup | null>(null);
  const [showGroupView, setShowGroupView] = React.useState(false);

  const storageProvider = React.useMemo(
    () => StorageProviderFactory.createProvider('local', 'support-circles'),
    []
  );

  const membershipProvider = React.useMemo(
    () => StorageProviderFactory.createProvider('local', 'user-memberships'),
    []
  );

  // Check if user is already registered for anonymous support groups
  React.useEffect(() => {
    const existingUser = supportGroupsService.getCurrentUser();
    if (existingUser) {
      setUser(existingUser);
    }
  }, []);

  // Initialize circles and user data
  React.useEffect(() => {
    if (!user) return;

    const initializeData = async () => {
      // Get or create anonymous user ID for circle tracking (separate from support groups)
      let storedUserId = localStorage.getItem('anonymous-user-id');
      if (!storedUserId) {
        storedUserId = user.id; // Use the support group user ID
        localStorage.setItem('anonymous-user-id', storedUserId);
      }
      setUserId(storedUserId);

      // Load circles
      const storedCircles = await storageProvider.list<Circle>();
      
      if (storedCircles.length === 0) {
        // Initialize default circles
        const defaultCircles: Omit<Circle, 'id' | 'createdAt' | 'updatedAt'>[] = [
          {
            title: 'Loss of Parent',
            description: 'For those honoring a mother or father',
            expandedDescription: 'A gentle space for adult children navigating life without their parent, sharing memories and finding strength in shared experience.',
            activity: 'gathering',
            tags: ['Parent', 'Family'],
            atmosphere: 'Warm embrace',
            memberIds: [],
            maxMembers: 7,
          },
          {
            title: 'Pet Loss Haven',
            description: 'Remembering our beloved companions',
            expandedDescription: 'Where the love for our animal friends is understood and honored, no loss too small to grieve.',
            activity: 'active',
            tags: ['Pets', 'Companions'],
            atmosphere: 'Gentle comfort',
            memberIds: [],
            maxMembers: 7,
          },
          {
            title: 'Sudden Loss Sanctuary',
            description: 'Processing the unexpected',
            expandedDescription: 'A sacred space for those navigating shock and trauma, where there is no rush to heal.',
            activity: 'quiet',
            tags: ['Sudden', 'Trauma'],
            atmosphere: 'Soft understanding',
            memberIds: [],
            maxMembers: 7,
          },
          {
            title: 'Pregnancy & Infant Loss',
            description: 'Honoring the smallest lives',
            expandedDescription: 'Supporting those who have lost during pregnancy or infancy, where every loss matters deeply.',
            activity: 'gathering',
            tags: ['Pregnancy', 'Infant'],
            atmosphere: 'Tender care',
            memberIds: [],
            maxMembers: 7,
          },
          {
            title: 'Young Hearts Gathering',
            description: 'For young adults (18-35) on this journey',
            expandedDescription: 'Peer support for navigating grief in early adulthood, finding your way forward.',
            activity: 'active',
            tags: ['Young Adults', 'Peers'],
            atmosphere: 'Hopeful connection',
            memberIds: [],
            maxMembers: 7,
          },
          {
            title: 'Relationship Transitions',
            description: 'Grieving love that has changed',
            expandedDescription: 'For those mourning the end of significant relationships, where your grief is valid.',
            activity: 'resting',
            tags: ['Relationships', 'Change'],
            atmosphere: 'Compassionate space',
            memberIds: [],
            maxMembers: 7,
          },
        ];

        const savedCircles: Circle[] = [];
        for (const circle of defaultCircles) {
          const saved = await storageProvider.save(circle as Circle);
          savedCircles.push(saved);
        }
        setCircles(savedCircles);
      } else {
        setCircles(storedCircles);
      }

      // Load user membership
      const memberships = await membershipProvider.list<UserMembership>();
      const userMembership = memberships.find(m => m.userId === storedUserId);
      setUserMembership(userMembership || null);
    };

    initializeData();
  }, [storageProvider, membershipProvider, user]);

  const handleRegistrationComplete = (newUser: User) => {
    setUser(newUser);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out? You can return anytime using this device.')) {
      supportGroupsService.clearCurrentUser();
      setUser(null);
      setShowGroupView(false);
      setSelectedGroup(null);
    }
  };

  const handleBackFromGroup = () => {
    setShowGroupView(false);
    setSelectedGroup(null);
  };

  const joinCircle = async (circleId: string) => {
    if (!userId || !user) return;

    const circle = circles.find(c => c.id === circleId);
    if (!circle) return;

    console.log('Joining circle:', circle.title, 'with user:', user.username);

    // Check if user is already a member
    if (userMembership?.circleIds.includes(circleId)) {
      console.log('User already member, finding support group...');
      // User is already in this circle, let them view it
      // Find or create a support group for this circle
      try {
        const group = supportGroupsService.createOrJoinGroupForTopic(circle.title, user.id);
        console.log('Found/created group:', group);
        setSelectedGroup(group);
        setShowGroupView(true);
      } catch (error) {
        console.error('Error finding group:', error);
        alert('Error opening circle. Please try leaving and rejoining.');
      }
      return;
    }

    console.log('Adding user to circle...');
    
    // Check if circle is full
    if (circle.memberIds.length >= circle.maxMembers) {
      // Create a new circle of the same type
      const newCircle: Omit<Circle, 'id' | 'createdAt' | 'updatedAt'> = {
        ...circle,
        memberIds: [userId],
      };
      const savedCircle = await storageProvider.save(newCircle as Circle);
      setCircles([...circles, savedCircle]);

      // Create corresponding support group
      await createSupportGroupForCircle(savedCircle);
      await updateUserMembership(savedCircle.id);
      alert(`This circle was full. We've created a new gathering space for you!`);
    } else {
      // Add user to existing circle
      const updatedCircle = await storageProvider.update<Circle>(circleId, {
        memberIds: [...circle.memberIds, userId],
      });

      setCircles(circles.map(c => c.id === circleId ? updatedCircle : c));
      
      // Create corresponding support group
      await createSupportGroupForCircle(updatedCircle);
      await updateUserMembership(circleId);
    }
  };

  const createSupportGroupForCircle = async (circle: Circle) => {
    if (!user) return;

    console.log('Creating support group for circle:', circle.title);
    
    try {
      // Use the new high-level method that handles everything
      const group = supportGroupsService.createOrJoinGroupForTopic(circle.title, user.id);
      console.log('Successfully created/joined group:', group.id, group.topic);
      setSelectedGroup(group);
      setShowGroupView(true);
    } catch (error) {
      console.error('Error creating/joining support group:', error);
      alert('Failed to join the circle. Please try again.');
    }
  };

  const updateUserMembership = async (newCircleId: string) => {
    if (userMembership) {
      const updated = await membershipProvider.update<UserMembership>(
        userMembership.id,
        { circleIds: [...userMembership.circleIds, newCircleId] }
      );
      setUserMembership(updated);
    } else {
      const newMembership = await membershipProvider.save<UserMembership>({
        userId,
        circleIds: [newCircleId],
      } as UserMembership);
      setUserMembership(newMembership);
    }
  };

  const getActivityGlow = (activity: Circle['activity']) => {
    switch (activity) {
      case 'gathering':
        return 'shadow-amber-400/60 animate-pulse';
      case 'active':
        return 'shadow-rose-400/50';
      case 'quiet':
        return 'shadow-blue-400/40';
      case 'resting':
        return 'shadow-purple-400/30';
    }
  };

  const getActivityText = (activity: Circle['activity']) => {
    switch (activity) {
      case 'gathering':
        return 'Currently gathering';
      case 'active':
        return 'Warmly active';
      case 'quiet':
        return 'Quietly present';
      case 'resting':
        return 'Resting gently';
    }
  };

  const isMember = (circleId: string) => {
    return userMembership?.circleIds.includes(circleId) || false;
  };

  // If user is not registered, show registration
  if (!user) {
    return <AnonymousRegistration onComplete={handleRegistrationComplete} />;
  }

  // If viewing a specific group, show group view
  if (showGroupView && selectedGroup) {
    return <GroupView group={selectedGroup} user={user} onBack={handleBackFromGroup} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900/20 to-slate-900 -mx-4 -my-8 px-4 py-12">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-16 space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/community">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-amber-200/70 hover:text-amber-200 hover:bg-amber-200/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Community
            </Button>
          </Link>
          
          <div className="flex items-center gap-4">
            <span className="text-purple-200/70 text-sm">
              Welcome, {user.username}
            </span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLogout}
              className="text-amber-200/70 hover:text-amber-200 hover:bg-amber-200/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
        
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-serif text-amber-100/90 tracking-wide">
            Sacred Circles
          </h1>
          <p className="text-lg text-purple-200/70 max-w-2xl mx-auto leading-relaxed font-light">
            Find your sanctuary. Each circle is a safe harbor,
            <br />a constellation of shared understanding.
          </p>
        </div>
      </div>

      {/* Constellation Layout */}
      <div className="max-w-7xl mx-auto relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {circles.map((circle, index) => (
            <div
              key={circle.id}
              className="relative group"
              onMouseEnter={() => setHoveredCircle(circle.id)}
              onMouseLeave={() => setHoveredCircle(null)}
              style={{
                animation: `fadeIn 0.6s ease-out ${index * 0.1}s both`,
              }}
            >
              {/* Circle Orb */}
              <div className="relative">
                {/* Glow effect */}
                <div
                  className={`absolute inset-0 rounded-full blur-2xl transition-all duration-700 ${getActivityGlow(circle.activity)}`}
                  style={{
                    transform: hoveredCircle === circle.id ? 'scale(1.3)' : 'scale(1)',
                  }}
                />
                
                {/* Main circle */}
                <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl p-8 border border-amber-200/10 transition-all duration-500 hover:border-amber-200/30">
                  {/* Activity indicator */}
                  <div className="absolute top-4 right-4">
                    <div className={`w-2 h-2 rounded-full ${
                      circle.activity === 'gathering' ? 'bg-amber-400 animate-pulse' :
                      circle.activity === 'active' ? 'bg-rose-400' :
                      circle.activity === 'quiet' ? 'bg-blue-400' :
                      'bg-purple-400'
                    }`} />
                  </div>

                  {/* Content */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-serif text-amber-100 mb-2 leading-tight">
                        {circle.title}
                      </h3>
                      <p className="text-purple-200/60 text-sm leading-relaxed">
                        {hoveredCircle === circle.id 
                          ? circle.expandedDescription 
                          : circle.description}
                      </p>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {circle.tags.map((tag, tagIndex) => (
                        <Badge 
                          key={tagIndex} 
                          variant="outline" 
                          className="text-xs border-amber-200/20 text-amber-200/60 bg-transparent"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Atmosphere & Activity */}
                    <div className="pt-4 border-t border-amber-200/10 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-purple-300/50 italic">
                          {circle.atmosphere}
                        </span>
                        <span className="text-amber-300/70">
                          {getActivityText(circle.activity)}
                        </span>
                      </div>
                    </div>

                    {/* Join Button */}
                    <Button
                      onClick={() => joinCircle(circle.id)}
                      className={`w-full mt-4 transition-all duration-300 ${
                        isMember(circle.id)
                          ? 'bg-emerald-900/30 text-emerald-300/70 border border-emerald-400/30 hover:bg-emerald-900/40 hover:border-emerald-400/50'
                          : 'bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 text-amber-100 border border-amber-400/30 hover:border-amber-400/50'
                      }`}
                      variant="outline"
                    >
                      {isMember(circle.id) ? (
                        <span className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Enter Your Circle
                        </span>
                      ) : (
                        'Join Circle'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Request New Circle */}
      <div className="max-w-2xl mx-auto mt-20">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-2xl rounded-full" />
          <div className="relative bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-sm rounded-2xl p-8 border border-blue-300/20 text-center space-y-4">
            <h3 className="text-2xl font-serif text-blue-200">
              Can't find your sanctuary?
            </h3>
            <p className="text-purple-200/60 leading-relaxed">
              Every type of loss deserves its own sacred space.
              <br />
              Request a new circle for your journey.
            </p>
            <Button 
              variant="outline"
              className="border-blue-300/30 text-blue-200 hover:bg-blue-400/10 hover:border-blue-300/50 transition-all"
            >
              Request New Circle
            </Button>
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
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
      `}</style>
    </div>
  );
}
