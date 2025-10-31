import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { 
  ArrowLeft, MessageCircle, Heart, Search, Filter, X, ChevronDown, 
  Users, CheckCircle, Clock, AlertTriangle, Shield, TrendingUp,
  UserCheck, Bell, Settings, BarChart3, CheckCircle2
} from 'lucide-react';

type ConnectionStatus = 'not_connected' | 'pending' | 'connected';
type SortOption = 'compatibility' | 'alphabetical' | 'newest';

interface PeerMatch {
  id: string;
  name: string;
  age: number;
  lossType: string;
  timeframe: string;
  compatibility: number;
  bio: string;
  interests: string[];
  availability: string;
  responseRate: number;
  isOnline: boolean;
  isVerified: boolean;
  connectionStatus: ConnectionStatus;
}

interface ActiveConnection {
  id: string;
  name: string;
  lastMessage: string;
  unreadCount: number;
  avatar: string;
}

interface Filters {
  lossType: string;
  timeframeRange: string;
  minCompatibility: number;
  searchQuery: string;
}

export function PeerSupportPage() {
  const { toast } = useToast();
  const [filters, setFilters] = React.useState<Filters>({
    lossType: 'all',
    timeframeRange: 'all',
    minCompatibility: 0,
    searchQuery: '',
  });
  const [sortBy, setSortBy] = React.useState<SortOption>('compatibility');
  const [expandedCards, setExpandedCards] = React.useState<Set<string>>(new Set());
  const [showPreferences, setShowPreferences] = React.useState(false);
  const [showSafetyGuidelines, setShowSafetyGuidelines] = React.useState(false);
  const [showReportModal, setShowReportModal] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Preference states
  const [ageRange, setAgeRange] = React.useState([18, 65]);
  const [selectedLossTypes, setSelectedLossTypes] = React.useState<string[]>([]);
  const [commFrequency, setCommFrequency] = React.useState('moderate');

  // Utility function for compatibility gradient
  const getCompatibilityGradient = (compatibility: number) => {
    const red = 255 - compatibility * 2;
    const green = compatibility * 2.55;
    return `linear-gradient(135deg, rgba(${red}, ${green}, 100, 0.2) 0%, rgba(${red}, ${green}, 100, 0.1) 100%)`;
  };

  const activeConnections: ActiveConnection[] = [
    { id: '1', name: 'Sarah M.', lastMessage: 'Thank you for sharing that...', unreadCount: 2, avatar: '👩' },
    { id: '2', name: 'Mike T.', lastMessage: 'I understand how you feel...', unreadCount: 0, avatar: '👨' },
    { id: '3', name: 'Luna K.', lastMessage: 'Let\'s chat more tomorrow?', unreadCount: 1, avatar: '👤' },
  ];

  const peerMatches: PeerMatch[] = [
    {
      id: '1',
      name: 'Sarah M.',
      age: 28,
      lossType: 'Lost mother to cancer',
      timeframe: '6 months ago',
      compatibility: 95,
      bio: 'Also navigating life without mom. Love reading and hiking.',
      interests: ['Reading', 'Hiking', 'Meditation', 'Journaling'],
      availability: 'Evenings, Weekends',
      responseRate: 92,
      isOnline: true,
      isVerified: true,
      connectionStatus: 'connected',
    },
    {
      id: '2',
      name: 'Mike T.',
      age: 35,
      lossType: 'Sudden loss of spouse',
      timeframe: '1 year ago',
      compatibility: 88,
      bio: 'Father of two, finding strength in community support.',
      interests: ['Parenting', 'Sports', 'Support Groups', 'Cooking'],
      availability: 'Mornings, Weekends',
      responseRate: 85,
      isOnline: false,
      isVerified: true,
      connectionStatus: 'connected',
    },
    {
      id: '3',
      name: 'Luna K.',
      age: 24,
      lossType: 'Pet loss (dog)',
      timeframe: '3 months ago',
      compatibility: 92,
      bio: 'Missing my best friend. Art therapy helps me cope.',
      interests: ['Art Therapy', 'Animals', 'Music', 'Nature'],
      availability: 'Flexible',
      responseRate: 88,
      isOnline: true,
      isVerified: false,
      connectionStatus: 'connected',
    },
    {
      id: '4',
      name: 'Emily R.',
      age: 42,
      lossType: 'Lost father to illness',
      timeframe: '8 months ago',
      compatibility: 87,
      bio: 'Learning to cope with the loss of my dad. Family is everything.',
      interests: ['Family', 'Gardening', 'Photography', 'Reading'],
      availability: 'Afternoons',
      responseRate: 90,
      isOnline: false,
      isVerified: true,
      connectionStatus: 'pending',
    },
    {
      id: '5',
      name: 'David L.',
      age: 31,
      lossType: 'Lost sibling in accident',
      timeframe: '4 months ago',
      compatibility: 83,
      bio: 'Still processing the sudden loss. Finding comfort in talking with others.',
      interests: ['Technology', 'Gaming', 'Writing', 'Movies'],
      availability: 'Evenings',
      responseRate: 78,
      isOnline: true,
      isVerified: false,
      connectionStatus: 'not_connected',
    },
  ];

  const lossTypes = [
    'Lost mother to cancer',
    'Sudden loss of spouse',
    'Pet loss (dog)',
    'Lost father to illness',
    'Lost sibling in accident',
  ];

  // Filter and sort logic
  const filteredAndSortedPeers = React.useMemo(() => {
    let filtered = peerMatches.filter(peer => {
      // Filter by loss type
      if (filters.lossType !== 'all' && peer.lossType !== filters.lossType) {
        return false;
      }
      
      // Filter by timeframe
      if (filters.timeframeRange !== 'all') {
        const monthsAgo = parseInt(peer.timeframe.split(' ')[0]) || 0;
        if (filters.timeframeRange === 'recent' && monthsAgo > 6) return false;
        if (filters.timeframeRange === 'past_year' && (monthsAgo < 6 || monthsAgo > 12)) return false;
        if (filters.timeframeRange === 'over_year' && monthsAgo <= 12) return false;
      }
      
      // Filter by minimum compatibility
      if (peer.compatibility < filters.minCompatibility) {
        return false;
      }
      
      // Search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesBio = peer.bio.toLowerCase().includes(query);
        const matchesInterests = peer.interests.some(interest => 
          interest.toLowerCase().includes(query)
        );
        if (!matchesBio && !matchesInterests) {
          return false;
        }
      }
      
      return true;
    });

    // Sort
    if (sortBy === 'compatibility') {
      filtered.sort((a, b) => b.compatibility - a.compatibility);
    } else if (sortBy === 'alphabetical') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'newest') {
      filtered.sort((a, b) => {
        const aMonths = parseInt(a.timeframe.split(' ')[0]) || 0;
        const bMonths = parseInt(b.timeframe.split(' ')[0]) || 0;
        return aMonths - bMonths;
      });
    }

    return filtered;
  }, [peerMatches, filters, sortBy]);

  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filters.lossType !== 'all') count++;
    if (filters.timeframeRange !== 'all') count++;
    if (filters.minCompatibility > 0) count++;
    if (filters.searchQuery) count++;
    return count;
  }, [filters]);

  const removeFilter = (filterKey: keyof Filters) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: filterKey === 'minCompatibility' ? 0 : filterKey === 'searchQuery' ? '' : 'all'
    }));
  };

  const toggleCardExpanded = (cardId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const handleUpdatePreferences = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Preferences Updated",
        description: "Your matching preferences have been saved successfully.",
        variant: "default",
      });
    }, 1000);
  };

  const getConnectionButton = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return { text: 'Message', icon: <MessageCircle className="h-4 w-4" />, variant: 'default' as const };
      case 'pending':
        return { text: 'Pending', icon: <Clock className="h-4 w-4" />, variant: 'outline' as const };
      case 'not_connected':
        return { text: 'Connect', icon: <UserCheck className="h-4 w-4" />, variant: 'default' as const };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Available Peers</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">127</p>
              </div>
              <Users className="h-10 w-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Successful Connections</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">1,243</p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Support Groups</p>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">38</p>
              </div>
              <BarChart3 className="h-10 w-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Connections Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageCircle className="h-5 w-5 mr-2" />
            My Connections
          </CardTitle>
          <CardDescription>Active peer support connections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeConnections.map(conn => (
              <div 
                key={conn.id} 
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div className="text-2xl">{conn.avatar}</div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 dark:text-white">{conn.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{conn.lastMessage}</p>
                  </div>
                  {conn.unreadCount > 0 && (
                    <Badge variant="default" className="bg-blue-500">
                      {conn.unreadCount}
                    </Badge>
                  )}
                </div>
                <Button size="sm" variant="outline">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  View Chat
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Safety Guidelines */}
      <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
        <Collapsible open={showSafetyGuidelines} onOpenChange={setShowSafetyGuidelines}>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  <CardTitle className="text-yellow-800 dark:text-yellow-200">Safety Guidelines</CardTitle>
                </div>
                <ChevronDown 
                  className={`h-5 w-5 text-yellow-600 dark:text-yellow-400 transition-transform ${showSafetyGuidelines ? 'rotate-180' : ''}`} 
                />
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="text-yellow-700 dark:text-yellow-300">
              <ul className="space-y-2">
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Respect boundaries - Everyone heals at their own pace</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Maintain confidentiality - Keep conversations private</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Report concerns - If something feels wrong, let us know</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Be kind and supportive - Your words have power</span>
                </li>
              </ul>
              <div className="mt-4">
                <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="border-yellow-600">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Report Concern
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Report a Concern</DialogTitle>
                      <DialogDescription>
                        Help us keep the community safe by reporting any concerning behavior.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Type of Concern</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select concern type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="harassment">Harassment</SelectItem>
                            <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                            <SelectItem value="spam">Spam</SelectItem>
                            <SelectItem value="safety">Safety Concern</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Details</Label>
                        <Textarea 
                          rows={4}
                          placeholder="Please describe your concern..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowReportModal(false)}>Cancel</Button>
                      <Button onClick={() => {
                        setShowReportModal(false);
                        toast({
                          title: "Report Submitted",
                          description: "Thank you. We'll review your concern promptly.",
                        });
                      }}>Submit Report</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Matching Preferences Panel */}
      <Card className="border-purple-200 dark:border-purple-800">
        <Collapsible open={showPreferences} onOpenChange={setShowPreferences}>
          <CardHeader>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <CardTitle>Matching Preferences</CardTitle>
                </div>
                <ChevronDown 
                  className={`h-5 w-5 transition-transform ${showPreferences ? 'rotate-180' : ''}`} 
                />
              </div>
            </CollapsibleTrigger>
            <CardDescription>Customize your peer matching criteria</CardDescription>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Preferred Age Range: {ageRange[0]} - {ageRange[1]}</Label>
                <Slider 
                  value={ageRange} 
                  onValueChange={setAgeRange}
                  min={18}
                  max={65}
                  step={1}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-3">
                <Label>Loss Types Willing to Discuss</Label>
                <div className="space-y-2">
                  {lossTypes.map(lossType => (
                    <div key={lossType} className="flex items-center space-x-2">
                      <Checkbox 
                        id={lossType}
                        checked={selectedLossTypes.includes(lossType)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedLossTypes([...selectedLossTypes, lossType]);
                          } else {
                            setSelectedLossTypes(selectedLossTypes.filter(lt => lt !== lossType));
                          }
                        }}
                      />
                      <Label htmlFor={lossType} className="font-normal cursor-pointer">
                        {lossType}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Communication Frequency Preference</Label>
                <Select value={commFrequency} onValueChange={setCommFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="frequent">Frequent (3-5 times/week)</SelectItem>
                    <SelectItem value="moderate">Moderate (1-2 times/week)</SelectItem>
                    <SelectItem value="occasional">Occasional (as needed)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleUpdatePreferences} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Updating...' : 'Update Preferences'}
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

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

      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h3 className="font-semibold text-gray-800 dark:text-white">Filters & Search</h3>
              {activeFilterCount > 0 && (
                <Badge variant="secondary">{activeFilterCount} active</Badge>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search by bio or interests..." 
                  className="pl-10"
                  value={filters.searchQuery}
                  onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                />
              </div>

              {/* Loss Type Filter */}
              <Select value={filters.lossType} onValueChange={(value) => setFilters({ ...filters, lossType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Loss Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Loss Types</SelectItem>
                  {lossTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Timeframe Filter */}
              <Select value={filters.timeframeRange} onValueChange={(value) => setFilters({ ...filters, timeframeRange: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Timeframes</SelectItem>
                  <SelectItem value="recent">Recent (0-6 months)</SelectItem>
                  <SelectItem value="past_year">Past Year (6-12 months)</SelectItem>
                  <SelectItem value="over_year">Over a Year</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compatibility">Compatibility</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  <SelectItem value="newest">Newest Matches</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Min Compatibility Slider */}
            <div className="space-y-2">
              <Label>Minimum Compatibility: {filters.minCompatibility}%</Label>
              <Slider 
                value={[filters.minCompatibility]} 
                onValueChange={(value) => setFilters({ ...filters, minCompatibility: value[0] })}
                min={0}
                max={100}
                step={5}
              />
            </div>

            {/* Active Filter Chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2">
                {filters.lossType !== 'all' && (
                  <Badge variant="secondary" className="cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600">
                    Loss Type: {filters.lossType}
                    <X 
                      className="h-3 w-3 ml-1" 
                      onClick={() => removeFilter('lossType')}
                    />
                  </Badge>
                )}
                {filters.timeframeRange !== 'all' && (
                  <Badge variant="secondary" className="cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600">
                    Timeframe: {filters.timeframeRange}
                    <X 
                      className="h-3 w-3 ml-1" 
                      onClick={() => removeFilter('timeframeRange')}
                    />
                  </Badge>
                )}
                {filters.minCompatibility > 0 && (
                  <Badge variant="secondary" className="cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600">
                    Min Match: {filters.minCompatibility}%
                    <X 
                      className="h-3 w-3 ml-1" 
                      onClick={() => removeFilter('minCompatibility')}
                    />
                  </Badge>
                )}
                {filters.searchQuery && (
                  <Badge variant="secondary" className="cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600">
                    Search: "{filters.searchQuery}"
                    <X 
                      className="h-3 w-3 ml-1" 
                      onClick={() => removeFilter('searchQuery')}
                    />
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Peer Matches Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Suggested Peer Matches ({filteredAndSortedPeers.length})
        </h2>
        
        {filteredAndSortedPeers.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                No matches found
              </h3>
              <p className="text-gray-500 dark:text-gray-500">
                Try adjusting your filters to see more peer matches
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedPeers.map((peer) => {
            const isExpanded = expandedCards.has(peer.id);
            const buttonConfig = getConnectionButton(peer.connectionStatus);
            
            return (
              <Card 
                key={peer.id} 
                className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <CardTitle className="text-lg">{peer.name}</CardTitle>
                          {peer.isOnline && (
                            <span className="absolute -top-1 -right-3 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Age {peer.age}
                        </span>
                        {peer.isVerified && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                        <div 
                          className="flex items-center space-x-1 px-3 py-1 rounded-full"
                          style={{ background: getCompatibilityGradient(peer.compatibility) }}
                        >
                          <Heart className="h-4 w-4 text-red-500" />
                          <span className="text-sm font-bold">{peer.compatibility}% match</span>
                        </div>
                      </div>
                      
                      <CardDescription>
                        <strong>{peer.lossType}</strong> • {peer.timeframe}
                      </CardDescription>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {peer.bio}
                      </p>

                      {/* Shared Interests Tags */}
                      <div className="flex flex-wrap gap-2">
                        {peer.interests.slice(0, isExpanded ? undefined : 3).map(interest => (
                          <Badge 
                            key={interest} 
                            variant="outline" 
                            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            {interest}
                          </Badge>
                        ))}
                        {!isExpanded && peer.interests.length > 3 && (
                          <Badge variant="outline" className="text-gray-500">
                            +{peer.interests.length - 3} more
                          </Badge>
                        )}
                      </div>

                      {/* Expandable Section */}
                      <Collapsible open={isExpanded} onOpenChange={() => toggleCardExpanded(peer.id)}>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-blue-600 dark:text-blue-400">
                            {isExpanded ? 'Show Less' : 'Show More'}
                            <ChevronDown 
                              className={`h-4 w-4 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                            />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-4 space-y-3">
                          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div>
                              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Availability</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{peer.availability}</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Response Rate</p>
                              <div className="flex items-center space-x-2">
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div 
                                    className="bg-green-500 h-2 rounded-full" 
                                    style={{ width: `${peer.responseRate}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium">{peer.responseRate}%</span>
                              </div>
                            </div>
                          </div>
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              <strong>Connection Status:</strong> {
                                peer.connectionStatus === 'connected' ? 'You are connected with this peer' :
                                peer.connectionStatus === 'pending' ? 'Connection request sent, awaiting response' :
                                'Not yet connected'
                              }
                            </p>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                    
                    <div className="ml-4">
                      <Button size="sm" variant={buttonConfig.variant}>
                        {buttonConfig.icon}
                        <span className="ml-2">{buttonConfig.text}</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })
        )}
      </div>

      {/* Volunteer Section */}
      <Card>
        <CardHeader>
          <CardTitle>Want to help others?</CardTitle>
          <CardDescription>
            Become a peer support volunteer and help someone else on their journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline">
            <Heart className="h-4 w-4 mr-2" />
            Volunteer as Peer Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
