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
  displayName?: string;
  age?: number;
  bio?: string;
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
    if (step < 6) setStep(step + 1);
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
    <div className="space-y-6">
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-2xl rounded-full" />
        <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl p-8 border border-purple-300/20 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif text-purple-200">Find Your Best Peer Match</h2>
            <Badge className="bg-purple-500/20 text-purple-200 border-purple-400/30 px-4 py-2">
              Step {step} of 6
            </Badge>
          </div>
          <Progress value={(step / 6) * 100} className="h-2 bg-slate-700" />
        </div>
      </div>

      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-rose-500/10 blur-2xl rounded-full" />
        <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl p-8 border border-amber-200/20 shadow-xl">
          <div className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <Label className="text-lg text-amber-100 mb-3 block">What type of loss are you experiencing?</Label>
              <div className="grid grid-cols-2 gap-3">
                {lossTypes.map((type) => (
                  <Button
                    key={type}
                    variant="outline"
                    className={`h-auto py-3 text-left justify-start transition-all ${
                      profile.lossType === type
                        ? 'bg-amber-500/20 border-amber-400/50 text-amber-100'
                        : 'bg-slate-800/50 border-purple-300/20 text-purple-200 hover:border-amber-400/30 hover:bg-amber-500/10'
                    }`}
                    onClick={() => setProfile({ ...profile, lossType: type })}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <Label className="text-lg text-amber-100 mb-3 block">When did this loss occur?</Label>
              <div className="grid grid-cols-1 gap-3">
                {timeframes.map((time) => (
                  <Button
                    key={time}
                    variant="outline"
                    className={`h-auto py-3 text-left justify-start transition-all ${
                      profile.timeframe === time
                        ? 'bg-amber-500/20 border-amber-400/50 text-amber-100'
                        : 'bg-slate-800/50 border-purple-300/20 text-purple-200 hover:border-amber-400/30 hover:bg-amber-500/10'
                    }`}
                    onClick={() => setProfile({ ...profile, timeframe: time })}
                  >
                    {time}
                  </Button>
                ))}
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
                <Label className="text-lg text-amber-100 mb-3 block">Your age range</Label>
                <div className="grid grid-cols-3 gap-3">
                  {ageRanges.map((range) => (
                    <Button
                      key={range}
                      variant="outline"
                      className={`h-auto py-3 transition-all ${
                        profile.ageRange === range
                          ? 'bg-amber-500/20 border-amber-400/50 text-amber-100'
                          : 'bg-slate-800/50 border-purple-300/20 text-purple-200 hover:border-amber-400/30 hover:bg-amber-500/10'
                      }`}
                      onClick={() => setProfile({ ...profile, ageRange: range })}
                    >
                      {range}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-lg text-amber-100 mb-3 block">Communication preference</Label>
                <div className="grid grid-cols-1 gap-3">
                  {communicationPreferences.map((pref) => (
                    <Button
                      key={pref}
                      variant="outline"
                      className={`h-auto py-3 text-left justify-start transition-all ${
                        profile.communicationPreference === pref
                          ? 'bg-amber-500/20 border-amber-400/50 text-amber-100'
                          : 'bg-slate-800/50 border-purple-300/20 text-purple-200 hover:border-amber-400/30 hover:bg-amber-500/10'
                      }`}
                      onClick={() => setProfile({ ...profile, communicationPreference: pref })}
                    >
                      {pref}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <div>
                <Label className="text-lg text-amber-100 mb-3 block">Display name (how others will see you)</Label>
                <Input
                  placeholder="e.g., Sarah M. or Anonymous123"
                  value={profile.displayName || ''}
                  onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                  className="bg-slate-800/50 border-purple-300/20 text-white placeholder:text-purple-200/40"
                />
                <p className="text-xs text-purple-200/60 mt-2">
                  💡 You can use initials or a pseudonym for privacy
                </p>
              </div>
              
              <div>
                <Label className="text-lg text-amber-100 mb-3 block">Your age (optional)</Label>
                <Input
                  type="number"
                  placeholder="e.g., 28"
                  value={profile.age || ''}
                  onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || undefined })}
                  className="bg-slate-800/50 border-purple-300/20 text-white placeholder:text-purple-200/40"
                />
              </div>

              <div>
                <Label className="text-lg text-amber-100 mb-3 block">Short bio (tell potential matches about yourself)</Label>
                <textarea
                  placeholder="e.g., Looking for someone who understands what it's like to lose a parent. I find comfort in reading and nature walks."
                  value={profile.bio || ''}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-purple-300/20 text-white placeholder:text-purple-200/40 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                />
                <p className="text-xs text-purple-200/60 mt-2">
                  💡 Share what helps you cope or what you're looking for in a peer connection
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6 border-t border-purple-300/20">
            <Button 
              variant="outline" 
              onClick={handleBack}
              disabled={step === 1}
              className="border-purple-300/20 text-purple-200 hover:bg-purple-500/10"
            >
              Back
            </Button>
            {step < 6 ? (
              <Button 
                onClick={handleNext}
                className="bg-gradient-to-r from-amber-500/80 to-rose-500/80 hover:from-amber-500 hover:to-rose-500 text-white border-0"
              >
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleComplete}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
              >
                Find My Matches
              </Button>
            )}
          </div>
          </div>
        </div>
      </div>

      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-xl rounded-full" />
        <div className="relative bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-sm rounded-2xl p-6 border border-blue-300/20">
          <p className="text-sm text-blue-200/80">
            💡 <strong className="text-blue-200">Your privacy matters:</strong> This information helps us find the best peer matches 
            for you and is stored locally on your device.
          </p>
        </div>
      </div>
    </div>
  );
}

// Statistics Dashboard Component
function StatisticsDashboard({ stats }: { stats: Statistics }) {
  return (
    <div className="grid md:grid-cols-4 gap-4">
      <div className="backdrop-blur-md bg-gradient-to-br from-slate-900/40 to-purple-900/20 rounded-xl shadow-lg border border-purple-400/20 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-purple-200/70">
              Total Peers
            </h3>
            <Users className="h-5 w-5 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.totalPeers}</div>
          <p className="text-xs text-purple-200/60 mt-1">
            Available for matching
          </p>
        </div>
      </div>

      <div className="backdrop-blur-md bg-gradient-to-br from-slate-900/40 to-green-900/20 rounded-xl shadow-lg border border-green-400/20 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-500">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-green-200/70">
              Active Connections
            </h3>
            <MessageCircle className="h-5 w-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.activeConnections}</div>
          <p className="text-xs text-green-200/60 mt-1">
            Ongoing conversations
          </p>
        </div>
      </div>

      <div className="backdrop-blur-md bg-gradient-to-br from-slate-900/40 to-blue-900/20 rounded-xl shadow-lg border border-blue-400/20 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-500">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-blue-200/70">
              Support Groups
            </h3>
            <TrendingUp className="h-5 w-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.supportGroupsJoined}</div>
          <p className="text-xs text-blue-200/60 mt-1">
            Groups you've joined
          </p>
        </div>
      </div>

      <div className="backdrop-blur-md bg-gradient-to-br from-slate-900/40 to-amber-900/20 rounded-xl shadow-lg border border-amber-400/20 hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-500">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-amber-200/70">
              Match Quality
            </h3>
            <Award className="h-5 w-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.averageMatchScore}%</div>
          <p className="text-xs text-amber-200/60 mt-1">
            Average match score
          </p>
        </div>
      </div>
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

  // Load user profile and calculate real statistics from localStorage
  React.useEffect(() => {
    const stored = localStorage.getItem('peer-support-profile');
    const allPeers = JSON.parse(localStorage.getItem('peer-support-registry') || '[]');
    
    if (stored) {
      setUserProfile(JSON.parse(stored));
      
      // Calculate real statistics from actual registered peers
      setStatistics({
        totalPeers: allPeers.length,
        activeConnections: 0, // Will be populated when chat system is implemented
        supportGroupsJoined: 0, // Can be synced with SupportGroupsService
        averageMatchScore: 0, // Will be calculated after matches are generated
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

    // Load real registered peers from localStorage
    const registeredPeers = JSON.parse(localStorage.getItem('peer-support-registry') || '[]');
    
    // Filter out the current user and convert to PeerMatch format
    const allPeers: PeerMatch[] = registeredPeers
      .filter((peer: UserProfile) => peer.id !== userProfile.id)
      .map((peer: UserProfile) => ({
        id: peer.id,
        name: peer.displayName || `User ${peer.id.slice(0, 4)}`,
        age: peer.age || 25,
        lossType: peer.lossType,
        timeframe: peer.timeframe,
        bio: peer.bio || 'Looking for someone to share experiences with.',
        supportStyle: peer.supportStyle || [],
        interests: peer.interests || [],
        communicationPreference: peer.communicationPreference || 'Flexible schedule',
        compatibility: 0
      }));

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
      displayName: profile.displayName,
      age: profile.age,
      bio: profile.bio,
    };
    
    setUserProfile(fullProfile);
    localStorage.setItem('peer-support-profile', JSON.stringify(fullProfile));
    
    // Register user in peer registry for matching with others
    const registry = JSON.parse(localStorage.getItem('peer-support-registry') || '[]');
    registry.push(fullProfile);
    localStorage.setItem('peer-support-registry', JSON.stringify(registry));
    
    // Update statistics after profile creation
    setStatistics({
      totalPeers: registry.length,
      activeConnections: 0,
      supportGroupsJoined: 0,
      averageMatchScore: 0, // Will be calculated after matches are displayed
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
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900/20 to-slate-900 -mx-4 -my-8 px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-6">
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

          <div className="text-center space-y-4">
            <h1 className="text-5xl font-serif text-amber-100/90 tracking-wide">
              💬 Peer Support Matching
            </h1>
            <p className="text-lg text-purple-200/70 max-w-2xl mx-auto leading-relaxed font-light">
              Find your sanctuary. Connect with someone who truly understands your journey.
            </p>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-2xl rounded-full" />
            <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-3xl p-8 border border-amber-200/20 shadow-2xl">
              <h2 className="text-2xl font-serif text-amber-100 mb-3">Welcome to Peer Support!</h2>
              <p className="text-purple-200/70 leading-relaxed">
                Let's find the perfect peer matches for your journey. This quick questionnaire 
                helps us connect you with people who truly understand what you're going through.
              </p>
            </div>
          </div>

          <MatchingQuestionnaire onComplete={handleQuestionnaireComplete} />
        </div>
      </div>
    );
  }

  // Main interface with matches
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900/20 to-slate-900 -mx-4 -my-8 px-4 py-12">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
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
            <h1 className="text-4xl font-serif text-amber-100/90 tracking-wide">
              💬 Peer Support
            </h1>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleResetProfile}
            className="text-amber-200/70 border-amber-200/20 hover:text-amber-200 hover:bg-amber-200/10"
          >
            Update Preferences
          </Button>
        </div>

      {/* Statistics Dashboard */}
      <StatisticsDashboard stats={statistics} />

      {/* How it Works */}
      <div className="backdrop-blur-md bg-gradient-to-br from-slate-900/40 to-green-900/20 rounded-xl shadow-lg border border-green-400/20 p-6">
        <h2 className="text-xl font-semibold text-green-200 mb-4">
          How Peer Support Works
        </h2>
        <ul className="space-y-2 text-green-100/80">
          <li>• We match you with someone who has experienced similar loss</li>
          <li>• Exchange supportive messages in a safe, private space</li>
          <li>• Share experiences, coping strategies, and encouragement</li>
          <li>• No pressure - communicate at your own pace</li>
        </ul>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-300" />
          <Input
            placeholder="Search by name, loss type, or interests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800/50 border-purple-300/20 text-white placeholder:text-purple-200/40"
          />
        </div>
        <Button 
          variant="outline"
          onClick={() => setFilterActive(!filterActive)}
          className={`border-purple-300/20 text-purple-200 hover:bg-purple-500/10 ${
            filterActive ? 'bg-purple-500/20 border-purple-400/50' : ''
          }`}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Peer Matches */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-amber-100/90">
            Your Best Matches ({filteredMatches.length})
          </h2>
          {peerMatches.length > 0 && (
            <span className="text-sm px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30">
              Sorted by compatibility
            </span>
          )}
        </div>
        
        {filteredMatches.length === 0 ? (
          <div className="backdrop-blur-md bg-gradient-to-br from-slate-900/40 to-purple-900/20 border border-purple-500/20 rounded-xl shadow-lg">
            <div className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-purple-300" />
              <h3 className="text-lg font-semibold mb-2 text-white">No matches found</h3>
              <p className="text-purple-200/70">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Check back soon for new peer matches'}
              </p>
            </div>
          </div>
        ) : (
          filteredMatches.map((peer) => (
            <div
              key={peer.id}
              className={`backdrop-blur-md bg-gradient-to-br from-slate-900/40 to-purple-900/20 rounded-xl shadow-lg transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 border-l-4 animate-fade-in ${
                peer.compatibility >= 80
                  ? 'border-l-amber-500 hover:border-l-amber-400'
                  : peer.compatibility >= 60
                  ? 'border-l-rose-500 hover:border-l-rose-400'
                  : 'border-l-purple-500 hover:border-l-purple-400'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-white">{peer.name}</h3>
                      <span className="text-sm text-purple-200/70">
                        Age {peer.age}
                      </span>
                      <div className={`flex items-center space-x-1 px-3 py-1 rounded-full backdrop-blur-sm ${
                        peer.compatibility >= 80
                          ? 'bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/30'
                          : 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30'
                      }`}>
                        <Heart className={`h-4 w-4 ${
                          peer.compatibility >= 80 ? 'text-amber-400' : 'text-purple-400'
                        }`} />
                        <span className={`text-sm font-semibold ${
                          peer.compatibility >= 80 ? 'text-amber-300' : 'text-purple-300'
                        }`}>
                          {peer.compatibility}% match
                        </span>
                      </div>
                    </div>
                    <p className="text-base text-purple-100">
                      <strong>{peer.lossType}</strong> • {peer.timeframe}
                    </p>
                    <p className="text-sm text-purple-200/70">
                      {peer.bio}
                    </p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {peer.supportStyle.slice(0, 2).map((style) => (
                        <span
                          key={style}
                          className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30"
                        >
                          {style}
                        </span>
                      ))}
                      {peer.interests.slice(0, 3).map((interest) => (
                        <span
                          key={interest}
                          className="text-xs px-3 py-1 rounded-full bg-slate-800/40 text-slate-200 border border-slate-600/30"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <button className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 text-white font-medium hover:from-amber-400 hover:to-rose-400 transition-all duration-300 shadow-lg hover:shadow-amber-500/50 flex items-center space-x-2">
                      <MessageCircle className="h-4 w-4" />
                      <span>Connect</span>
                    </button>
                    <button className="w-full px-4 py-2 text-sm rounded-lg backdrop-blur-sm bg-purple-500/10 text-purple-200 border border-purple-400/30 hover:bg-purple-500/20 transition-all duration-300">
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Volunteer Section */}
      <div className="backdrop-blur-md bg-gradient-to-br from-slate-900/40 to-amber-900/20 rounded-xl shadow-lg border border-amber-400/20 p-6">
        <div className="flex items-center space-x-2 mb-2">
          <Award className="h-5 w-5 text-amber-400" />
          <h3 className="text-xl font-semibold text-amber-200">Want to help others?</h3>
        </div>
        <p className="text-amber-100/70 mb-4">
          Become a peer support volunteer and help someone else on their journey
        </p>
        <button className="px-6 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:from-amber-400 hover:to-orange-400 transition-all duration-300 shadow-lg hover:shadow-amber-500/50">
          Volunteer as Peer Support
        </button>
      </div>
      </div>
    </div>
  );
}
