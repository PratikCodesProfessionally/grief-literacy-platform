import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  MessageCircle, 
  Heart, 
  Users, 
  TrendingUp, 
  Award,
  Search,
  Filter,
  CheckCircle
} from 'lucide-react';

// Types
interface UserProfile {
  id: string;
  hasCompletedQuestionnaire: boolean;
  lossType: string;
  timeframe: string;
  supportStyle: string[];
  interests: string[];
  ageRange: string;
  communicationPreference: string;
}

interface PeerMatch {
  id: string;
  name: string;
  age: number;
  lossType: string;
  timeframe: string;
  compatibility: number;
  bio: string;
  supportStyle: string[];
  interests: string[];
  communicationPreference: string;
}

interface Statistics {
  totalPeers: number;
  activeConnections: number;
  supportGroupsJoined: number;
  averageMatchScore: number;
}

// Questionnaire Component
function MatchingQuestionnaire({ onComplete }: { onComplete: (profile: Partial<UserProfile>) => void }) {
  const [step, setStep] = React.useState(1);
  const [profile, setProfile] = React.useState<Partial<UserProfile>>({
    supportStyle: [],
    interests: [],
  });

  const lossTypes = [
    'Loss of Parent', 'Loss of Spouse/Partner', 'Loss of Child',
    'Loss of Sibling', 'Loss of Pet', 'Loss of Friend',
    'Pregnancy/Infant Loss', 'Sudden Loss', 'Other'
  ];

  const timeframes = [
    'Recent (0-3 months)', 'Some time ago (3-12 months)', 
    'Over a year ago', 'Several years ago'
  ];

  const supportStyles = [
    'Active Listener', 'Advice Giver', 'Shared Experience',
    'Emotional Support', 'Practical Help', 'Spiritual Connection'
  ];

  const interests = [
    'Reading', 'Art & Creativity', 'Exercise & Fitness', 'Nature & Hiking',
    'Music', 'Meditation & Mindfulness', 'Journaling', 'Cooking',
    'Pet Care', 'Volunteering', 'Spirituality', 'Self-Help Books'
  ];

  const ageRanges = ['18-25', '26-35', '36-45', '46-55', '56-65', '65+'];
  
  const communicationPreferences = [
    'Frequent check-ins', 'Weekly conversations', 
    'As-needed basis', 'Flexible schedule'
  ];

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = () => {
    onComplete(profile);
  };

  const toggleArrayItem = (key: keyof UserProfile, value: string) => {
    const currentArray = (profile[key] as string[]) || [];
    setProfile({
      ...profile,
      [key]: currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value]
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-2xl">Find Your Best Peer Match</CardTitle>
            <Badge variant="secondary">Step {step} of 5</Badge>
          </div>
          <Progress value={(step / 5) * 100} className="h-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label className="text-lg mb-3 block">What type of loss are you experiencing?</Label>
                <div className="grid grid-cols-2 gap-3">
                  {lossTypes.map((type) => (
                    <Button
                      key={type}
                      variant={profile.lossType === type ? "default" : "outline"}
                      className="h-auto py-3 text-left justify-start"
                      onClick={() => setProfile({ ...profile, lossType: type })}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label className="text-lg mb-3 block">When did this loss occur?</Label>
                <div className="grid grid-cols-1 gap-3">
                  {timeframes.map((time) => (
                    <Button
                      key={time}
                      variant={profile.timeframe === time ? "default" : "outline"}
                      className="h-auto py-3 text-left justify-start"
                      onClick={() => setProfile({ ...profile, timeframe: time })}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <Label className="text-lg mb-3 block">
                  What support styles resonate with you? (Select all that apply)
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {supportStyles.map((style) => (
                    <Button
                      key={style}
                      variant={(profile.supportStyle || []).includes(style) ? "default" : "outline"}
                      className="h-auto py-3 text-left justify-start"
                      onClick={() => toggleArrayItem('supportStyle', style)}
                    >
                      <CheckCircle 
                        className={`h-4 w-4 mr-2 ${
                          (profile.supportStyle || []).includes(style) ? 'opacity-100' : 'opacity-0'
                        }`} 
                      />
                      {style}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <Label className="text-lg mb-3 block">
                  What are your interests and coping activities? (Select all that apply)
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {interests.map((interest) => (
                    <Button
                      key={interest}
                      variant={(profile.interests || []).includes(interest) ? "default" : "outline"}
                      className="h-auto py-3 text-left justify-start"
                      onClick={() => toggleArrayItem('interests', interest)}
                    >
                      <CheckCircle 
                        className={`h-4 w-4 mr-2 ${
                          (profile.interests || []).includes(interest) ? 'opacity-100' : 'opacity-0'
                        }`} 
                      />
                      {interest}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div>
                <Label className="text-lg mb-3 block">Your age range</Label>
                <div className="grid grid-cols-3 gap-3">
                  {ageRanges.map((range) => (
                    <Button
                      key={range}
                      variant={profile.ageRange === range ? "default" : "outline"}
                      className="h-auto py-3"
                      onClick={() => setProfile({ ...profile, ageRange: range })}
                    >
                      {range}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-lg mb-3 block">Communication preference</Label>
                <div className="grid grid-cols-1 gap-3">
                  {communicationPreferences.map((pref) => (
                    <Button
                      key={pref}
                      variant={profile.communicationPreference === pref ? "default" : "outline"}
                      className="h-auto py-3 text-left justify-start"
                      onClick={() => setProfile({ ...profile, communicationPreference: pref })}
                    >
                      {pref}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={handleBack}
              disabled={step === 1}
            >
              Back
            </Button>
            {step < 5 ? (
              <Button onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button onClick={handleComplete}>
                Find My Matches
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="py-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            💡 <strong>Your privacy matters:</strong> This information helps us find the best peer matches 
            for you and is stored locally on your device.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Statistics Dashboard Component
function StatisticsDashboard({ stats }: { stats: Statistics }) {
  return (
    <div className="grid md:grid-cols-4 gap-4">
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Peers
            </CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.totalPeers}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Available for matching
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Connections
            </CardTitle>
            <MessageCircle className="h-5 w-5 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.activeConnections}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Ongoing conversations
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Support Groups
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.supportGroupsJoined}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Groups you've joined
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Match Quality
            </CardTitle>
            <Award className="h-5 w-5 text-amber-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.averageMatchScore}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            Average match score
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Main Component
export function PeerSupportPage() {
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterActive, setFilterActive] = React.useState(false);
  const [statistics, setStatistics] = React.useState<Statistics>({
    totalPeers: 0,
    activeConnections: 0,
    supportGroupsJoined: 0,
    averageMatchScore: 0,
  });

  // Load user profile from localStorage
  React.useEffect(() => {
    const stored = localStorage.getItem('peer-support-profile');
    if (stored) {
      setUserProfile(JSON.parse(stored));
      // Initialize statistics with zero state (ready for backend integration)
      setStatistics({
        totalPeers: 127, // This would come from backend
        activeConnections: 0, // Will be populated when backend is connected
        supportGroupsJoined: 0, // Can be synced with SupportGroupsService
        averageMatchScore: 0, // Calculated based on actual matches
      });
    }
  }, []);

  // Calculate match score based on profile compatibility
  const calculateMatchScore = (peer: PeerMatch): number => {
    if (!userProfile) return 0;
    
    let score = 0;
    let factors = 0;

    // Loss type match (30% weight)
    if (peer.lossType === userProfile.lossType) {
      score += 30;
    }
    factors++;

    // Timeframe similarity (20% weight)
    if (peer.timeframe === userProfile.timeframe) {
      score += 20;
    }
    factors++;

    // Support style overlap (25% weight)
    const styleOverlap = peer.supportStyle.filter(s => 
      userProfile.supportStyle?.includes(s)
    ).length;
    if (styleOverlap > 0) {
      score += (styleOverlap / Math.max(peer.supportStyle.length, 1)) * 25;
    }
    factors++;

    // Interest overlap (15% weight)
    const interestOverlap = peer.interests.filter(i => 
      userProfile.interests?.includes(i)
    ).length;
    if (interestOverlap > 0) {
      score += (interestOverlap / Math.max(peer.interests.length, 1)) * 15;
    }
    factors++;

    // Communication preference (10% weight)
    if (peer.communicationPreference === userProfile.communicationPreference) {
      score += 10;
    }
    factors++;

    return Math.round(score);
  };

  // Generate matched peers based on profile
  const generateMatches = (): PeerMatch[] => {
    if (!userProfile) return [];

    // This is sample data - in production, this would come from backend
    const allPeers: PeerMatch[] = [
      {
        id: '1',
        name: 'Sarah M.',
        age: 28,
        lossType: 'Loss of Parent',
        timeframe: 'Some time ago (3-12 months)',
        bio: 'Also navigating life without mom. Love reading and hiking.',
        supportStyle: ['Active Listener', 'Shared Experience'],
        interests: ['Reading', 'Nature & Hiking', 'Journaling'],
        communicationPreference: 'Weekly conversations',
        compatibility: 0
      },
      {
        id: '2',
        name: 'Mike T.',
        age: 35,
        lossType: 'Loss of Spouse/Partner',
        timeframe: 'Over a year ago',
        bio: 'Father of two, finding strength in community support.',
        supportStyle: ['Practical Help', 'Emotional Support'],
        interests: ['Exercise & Fitness', 'Cooking', 'Pet Care'],
        communicationPreference: 'Flexible schedule',
        compatibility: 0
      },
      {
        id: '3',
        name: 'Luna K.',
        age: 24,
        lossType: 'Loss of Pet',
        timeframe: 'Recent (0-3 months)',
        bio: 'Missing my best friend. Art therapy helps me cope.',
        supportStyle: ['Emotional Support', 'Shared Experience'],
        interests: ['Art & Creativity', 'Pet Care', 'Meditation & Mindfulness'],
        communicationPreference: 'As-needed basis',
        compatibility: 0
      },
      {
        id: '4',
        name: 'David R.',
        age: 42,
        lossType: 'Loss of Parent',
        timeframe: 'Recent (0-3 months)',
        bio: 'Learning to honor my father\'s memory through storytelling.',
        supportStyle: ['Active Listener', 'Spiritual Connection'],
        interests: ['Reading', 'Spirituality', 'Self-Help Books'],
        communicationPreference: 'Weekly conversations',
        compatibility: 0
      },
      {
        id: '5',
        name: 'Emma L.',
        age: 31,
        lossType: 'Loss of Sibling',
        timeframe: 'Some time ago (3-12 months)',
        bio: 'Finding peace through meditation and nature walks.',
        supportStyle: ['Emotional Support', 'Shared Experience'],
        interests: ['Nature & Hiking', 'Meditation & Mindfulness', 'Yoga'],
        communicationPreference: 'Frequent check-ins',
        compatibility: 0
      },
    ];

    // Calculate compatibility scores
    const matchedPeers = allPeers.map(peer => ({
      ...peer,
      compatibility: calculateMatchScore(peer)
    }));

    // Sort by compatibility
    return matchedPeers.sort((a, b) => b.compatibility - a.compatibility);
  };

  const peerMatches = generateMatches();

  // Filter matches based on search query
  const filteredMatches = peerMatches.filter(peer => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      peer.name.toLowerCase().includes(query) ||
      peer.lossType.toLowerCase().includes(query) ||
      peer.bio.toLowerCase().includes(query)
    );
  });

  const handleQuestionnaireComplete = (profile: Partial<UserProfile>) => {
    const fullProfile: UserProfile = {
      id: Date.now().toString(),
      hasCompletedQuestionnaire: true,
      lossType: profile.lossType || '',
      timeframe: profile.timeframe || '',
      supportStyle: profile.supportStyle || [],
      interests: profile.interests || [],
      ageRange: profile.ageRange || '',
      communicationPreference: profile.communicationPreference || '',
    };
    
    setUserProfile(fullProfile);
    localStorage.setItem('peer-support-profile', JSON.stringify(fullProfile));
    
    // Update statistics after profile creation
    setStatistics({
      totalPeers: 127,
      activeConnections: 0,
      supportGroupsJoined: 0,
      averageMatchScore: peerMatches.length > 0 
        ? Math.round(peerMatches.reduce((sum, p) => sum + p.compatibility, 0) / peerMatches.length)
        : 0,
    });
  };

  const handleResetProfile = () => {
    if (confirm('Are you sure you want to reset your profile? This will delete your matching preferences.')) {
      localStorage.removeItem('peer-support-profile');
      setUserProfile(null);
      setStatistics({
        totalPeers: 0,
        activeConnections: 0,
        supportGroupsJoined: 0,
        averageMatchScore: 0,
      });
    }
  };

  // Show questionnaire if user hasn't completed it
  if (!userProfile || !userProfile.hasCompletedQuestionnaire) {
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
            💬 Peer Support Matching
          </h1>
        </div>

        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-primary/30">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to Peer Support!</CardTitle>
            <CardDescription className="text-base">
              Let's find the perfect peer matches for your journey. This quick questionnaire 
              helps us connect you with people who truly understand what you're going through.
            </CardDescription>
          </CardHeader>
        </Card>

        <MatchingQuestionnaire onComplete={handleQuestionnaireComplete} />
      </div>
    );
  }

  // Main interface with matches
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
        <Button variant="outline" size="sm" onClick={handleResetProfile}>
          Update Preferences
        </Button>
      </div>

      {/* Statistics Dashboard */}
      <StatisticsDashboard stats={statistics} />

      {/* How it Works */}
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

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, loss type, or interests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          variant={filterActive ? "default" : "outline"}
          onClick={() => setFilterActive(!filterActive)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Peer Matches */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Your Best Matches ({filteredMatches.length})
          </h2>
          {peerMatches.length > 0 && (
            <Badge variant="secondary" className="text-sm">
              Sorted by compatibility
            </Badge>
          )}
        </div>
        
        {filteredMatches.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No matches found</h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Check back soon for new peer matches'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredMatches.map((peer) => (
            <Card key={peer.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/50">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center space-x-3">
                      <CardTitle className="text-lg">{peer.name}</CardTitle>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Age {peer.age}
                      </span>
                      <div className="flex items-center space-x-1 bg-primary/10 px-3 py-1 rounded-full">
                        <Heart className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-primary">
                          {peer.compatibility}% match
                        </span>
                      </div>
                    </div>
                    <CardDescription className="text-base">
                      <strong>{peer.lossType}</strong> • {peer.timeframe}
                    </CardDescription>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {peer.bio}
                    </p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {peer.supportStyle.slice(0, 2).map((style) => (
                        <Badge key={style} variant="secondary" className="text-xs">
                          {style}
                        </Badge>
                      ))}
                      {peer.interests.slice(0, 3).map((interest) => (
                        <Badge key={interest} variant="outline" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button size="sm">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                    <Button size="sm" variant="outline" className="w-full">
                      View Profile
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      {/* Volunteer Section */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-amber-600" />
            <span>Want to help others?</span>
          </CardTitle>
          <CardDescription>
            Become a peer support volunteer and help someone else on their journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="border-amber-600 text-amber-700 hover:bg-amber-50">
            Volunteer as Peer Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
