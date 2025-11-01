import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { 
  ArrowLeft, MessageCircle, Heart, ChevronDown, 
  Users, CheckCircle, Clock, Shield, TrendingUp,
  UserCheck, BarChart3, CheckCircle2, Clipboard, ArrowRight, 
  ArrowLeftIcon, Loader2, RefreshCw, RotateCcw
} from 'lucide-react';

type ConnectionStatus = 'not_connected' | 'pending' | 'connected';

interface PeerMatch {
  id: string;
  name: string;
  age: number;
  lossType: string;
  timeframe: string;
  compatibility: number;
  bio: string;
  interests: string[];
  availability: string[];
  responseRate: number;
  isOnline: boolean;
  isVerified: boolean;
  connectionStatus: ConnectionStatus;
  communicationMethod: string;
  copingMethods: string[];
  supportPreferences: string[];
}

interface ActiveConnection {
  id: string;
  name: string;
  lastMessage: string;
  unreadCount: number;
  avatar: string;
}

interface QuestionnaireAnswers {
  lossType: string;
  lossTimeframe: string;
  supportPreferences: string[];
  communicationFrequency: string;
  communicationMethod: string;
  availability: string[];
  copingMethods: string[];
  interests: string;
  ageRange: string;
  bio: string;
}

export function PeerSupportPage() {
  const { toast } = useToast();
  
  // Questionnaire state
  const [questionnaireCompleted, setQuestionnaireCompleted] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(1);
  const [answers, setAnswers] = React.useState<QuestionnaireAnswers>({
    lossType: '',
    lossTimeframe: '',
    supportPreferences: [],
    communicationFrequency: '',
    communicationMethod: '',
    availability: [],
    copingMethods: [],
    interests: '',
    ageRange: '',
    bio: '',
  });
  
  // Matching state
  const [isMatching, setIsMatching] = React.useState(false);
  const [matches, setMatches] = React.useState<PeerMatch[]>([]);
  const [expandedCards, setExpandedCards] = React.useState<Set<string>>(new Set());
  const [showSafetyGuidelines, setShowSafetyGuidelines] = React.useState(false);
  const [showAnswersSummary, setShowAnswersSummary] = React.useState(false);

  // Statistics state - initialized to 0, ready for backend integration
  // TODO: Connect to backend API to fetch real-time statistics
  const [availablePeers, setAvailablePeers] = React.useState(0);
  const [successfulConnections, setSuccessfulConnections] = React.useState(0);
  const [activeSupportGroups, setActiveSupportGroups] = React.useState(0);

  const activeConnections: ActiveConnection[] = [
    { id: '1', name: 'Sarah M.', lastMessage: 'Thank you for sharing that...', unreadCount: 2, avatar: '👩' },
    { id: '2', name: 'Mike T.', lastMessage: 'I understand how you feel...', unreadCount: 0, avatar: '👨' },
    { id: '3', name: 'Luna K.', lastMessage: 'Let\'s chat more tomorrow?', unreadCount: 1, avatar: '👤' },
  ];

  // Utility function for compatibility gradient
  const getCompatibilityGradient = (compatibility: number) => {
    const red = 255 - compatibility * 2;
    const green = compatibility * 2.55;
    return `linear-gradient(135deg, rgba(${red}, ${green}, 100, 0.2) 0%, rgba(${red}, ${green}, 100, 0.1) 100%)`;
  };

  // Helper function to generate random matches based on questionnaire
  const generateMatches = () => {
    const names = [
      'Sarah M.', 'Mike T.', 'Luna K.', 'Emily R.', 'David L.',
      'Jessica P.', 'Tom W.', 'Rachel S.', 'Chris B.', 'Amanda H.'
    ];
    
    const bios = [
      'Finding my way through grief, one day at a time.',
      'Grateful for this supportive community.',
      'Healing through connection and shared experiences.',
      'Learning to embrace both joy and sorrow.',
      'Finding strength in vulnerability and openness.'
    ];

    const numMatches = Math.floor(Math.random() * 3) + 3; // 3-5 matches
    const generatedMatches: PeerMatch[] = [];

    for (let i = 0; i < numMatches; i++) {
      const name = names[Math.floor(Math.random() * names.length)];
      const age = answers.ageRange === '18-24' ? 18 + Math.floor(Math.random() * 7) :
                  answers.ageRange === '25-34' ? 25 + Math.floor(Math.random() * 10) :
                  answers.ageRange === '35-44' ? 35 + Math.floor(Math.random() * 10) :
                  answers.ageRange === '45-54' ? 45 + Math.floor(Math.random() * 10) :
                  55 + Math.floor(Math.random() * 15);

      // Calculate compatibility based on shared answers
      let compatibility = 75 + Math.floor(Math.random() * 23); // 75-98%
      
      // Parse interests from user input
      const userInterests = answers.interests ? answers.interests.split(',').map(i => i.trim()) : [];
      const allInterests = [...answers.copingMethods, ...userInterests];
      const peerInterests = allInterests.slice(0, 3 + Math.floor(Math.random() * 2));

      generatedMatches.push({
        id: `match-${i}`,
        name,
        age,
        lossType: answers.lossType,
        timeframe: answers.lossTimeframe,
        compatibility,
        bio: bios[Math.floor(Math.random() * bios.length)],
        interests: peerInterests,
        availability: answers.availability,
        responseRate: 75 + Math.floor(Math.random() * 25),
        isOnline: Math.random() > 0.5,
        isVerified: Math.random() > 0.3,
        connectionStatus: 'not_connected',
        communicationMethod: answers.communicationMethod,
        copingMethods: answers.copingMethods,
        supportPreferences: answers.supportPreferences,
      });
    }

    return generatedMatches;
  };

  const handleStartQuestionnaire = () => {
    setQuestionnaireCompleted(false);
    setCurrentStep(1);
    setAnswers({
      lossType: '',
      lossTimeframe: '',
      supportPreferences: [],
      communicationFrequency: '',
      communicationMethod: '',
      availability: [],
      copingMethods: [],
      interests: '',
      ageRange: '',
      bio: '',
    });
  };

  const handleNextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFindMatches = async () => {
    setIsMatching(true);
    
    // Simulate matching process
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const newMatches = generateMatches();
    setMatches(newMatches);
    setIsMatching(false);
    setQuestionnaireCompleted(true);
    
    toast({
      title: "Matches Found!",
      description: `We found ${newMatches.length} great peer matches for you.`,
      variant: "default",
    });
  };

  const handleGetNewMatches = async () => {
    setIsMatching(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    const newMatches = generateMatches();
    setMatches(newMatches);
    setIsMatching(false);
    
    toast({
      title: "New Matches Generated!",
      description: `Here are ${newMatches.length} new peer matches for you.`,
      variant: "default",
    });
  };

  const handleRetakeQuestionnaire = () => {
    setQuestionnaireCompleted(false);
    setCurrentStep(1);
    setMatches([]);
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

  const getSharedAttributes = (peer: PeerMatch) => {
    const shared = [];
    if (peer.lossType === answers.lossType) shared.push('loss type');
    if (peer.copingMethods.some(method => answers.copingMethods.includes(method))) shared.push('coping methods');
    if (peer.availability.some(time => answers.availability.includes(time))) shared.push('availability');
    if (peer.communicationMethod === answers.communicationMethod) shared.push('communication style');
    return shared;
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return answers.lossType && answers.lossTimeframe;
      case 2:
        return answers.supportPreferences.length > 0 && answers.communicationFrequency;
      case 3:
        return answers.communicationMethod && answers.availability.length > 0;
      case 4:
        return answers.copingMethods.length > 0;
      case 5:
        return answers.ageRange;
      default:
        return false;
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
                <p className="text-3xl font-bold text-gray-800 dark:text-white">{availablePeers}</p>
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
                <p className="text-3xl font-bold text-gray-800 dark:text-white">{successfulConnections}</p>
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
                <p className="text-3xl font-bold text-gray-800 dark:text-white">{activeSupportGroups}</p>
              </div>
              <BarChart3 className="h-10 w-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Encouraging message for zero state */}
      {availablePeers === 0 && successfulConnections === 0 && activeSupportGroups === 0 && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <p className="text-center text-blue-800 dark:text-blue-200 font-medium">
              🌟 Be among the first to connect! Complete the questionnaire to help us build this supportive community.
            </p>
          </CardContent>
        </Card>
      )}

      {/* My Connections Section */}
      {questionnaireCompleted && matches.length > 0 && (
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
      )}

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
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* How Peer Support Works - Updated */}
      <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-green-800 dark:text-green-200">
            How Peer Support Works
          </CardTitle>
        </CardHeader>
        <CardContent className="text-green-700 dark:text-green-300">
          <ul className="space-y-2">
            <li className="flex items-center">
              <span className="font-bold mr-2">1.</span>
              Complete a brief questionnaire about your needs and preferences
            </li>
            <li className="flex items-center">
              <span className="font-bold mr-2">2.</span>
              Get matched with peers who have similar experiences
            </li>
            <li className="flex items-center">
              <span className="font-bold mr-2">3.</span>
              Connect and support each other in a safe, private space
            </li>
            <li className="flex items-center">
              <span className="font-bold mr-2">4.</span>
              Communicate at your own pace - no pressure
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Empty State - Show when questionnaire not completed */}
      {!questionnaireCompleted && !isMatching && (
        <Card className="text-center py-12 border-2 border-dashed">
          <CardContent>
            <Clipboard className="h-20 w-20 mx-auto text-blue-500 mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
              Find Your Peer Support Match
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Complete a brief questionnaire to connect with someone who understands your journey and can offer meaningful support.
            </p>
            <Button size="lg" onClick={handleStartQuestionnaire}>
              <Clipboard className="h-5 w-5 mr-2" />
              Start Questionnaire
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Questionnaire */}
      {!questionnaireCompleted && currentStep > 0 && !isMatching && (
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <CardTitle>Peer Matching Questionnaire</CardTitle>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Step {currentStep} of 5
                </span>
              </div>
              <Progress value={(currentStep / 5) * 100} className="h-2" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1 - Loss Experience */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tell us about your loss</h3>
                
                <div className="space-y-2">
                  <Label>What type of loss are you experiencing?</Label>
                  <Select value={answers.lossType} onValueChange={(value) => setAnswers({...answers, lossType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select loss type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Loss of a parent</SelectItem>
                      <SelectItem value="spouse">Loss of a spouse/partner</SelectItem>
                      <SelectItem value="sibling">Loss of a sibling</SelectItem>
                      <SelectItem value="friend">Loss of a friend</SelectItem>
                      <SelectItem value="pet">Loss of a pet</SelectItem>
                      <SelectItem value="other">Other loss</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>How long ago did this happen?</Label>
                  <Select value={answers.lossTimeframe} onValueChange={(value) => setAnswers({...answers, lossTimeframe: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="less than 1 month">Less than 1 month</SelectItem>
                      <SelectItem value="1-3 months">1-3 months</SelectItem>
                      <SelectItem value="3-6 months">3-6 months</SelectItem>
                      <SelectItem value="6-12 months">6-12 months</SelectItem>
                      <SelectItem value="over a year">Over a year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 2 - Support Preferences */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">What are you looking for?</h3>
                
                <div className="space-y-3">
                  <Label>What are you looking for in peer support? (Select all that apply)</Label>
                  {['someone to listen', 'practical advice', 'shared activities', 'spiritual support'].map((pref) => (
                    <div key={pref} className="flex items-center space-x-2">
                      <Checkbox 
                        id={pref}
                        checked={answers.supportPreferences.includes(pref)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setAnswers({...answers, supportPreferences: [...answers.supportPreferences, pref]});
                          } else {
                            setAnswers({...answers, supportPreferences: answers.supportPreferences.filter(p => p !== pref)});
                          }
                        }}
                      />
                      <Label htmlFor={pref} className="font-normal capitalize cursor-pointer">
                        {pref}
                      </Label>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>How often would you like to connect?</Label>
                  <Select value={answers.communicationFrequency} onValueChange={(value) => setAnswers({...answers, communicationFrequency: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="few times a week">A few times a week</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="as needed">As needed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 3 - Communication Style */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Communication preferences</h3>
                
                <div className="space-y-2">
                  <Label>Preferred communication method?</Label>
                  <Select value={answers.communicationMethod} onValueChange={(value) => setAnswers({...answers, communicationMethod: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text chat">Text chat</SelectItem>
                      <SelectItem value="scheduled calls">Scheduled calls</SelectItem>
                      <SelectItem value="group settings">Group settings</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>When are you typically available? (Select all that apply)</Label>
                  {['mornings', 'afternoons', 'evenings', 'weekends'].map((time) => (
                    <div key={time} className="flex items-center space-x-2">
                      <Checkbox 
                        id={time}
                        checked={answers.availability.includes(time)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setAnswers({...answers, availability: [...answers.availability, time]});
                          } else {
                            setAnswers({...answers, availability: answers.availability.filter(t => t !== time)});
                          }
                        }}
                      />
                      <Label htmlFor={time} className="font-normal capitalize cursor-pointer">
                        {time}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4 - Interests & Coping */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Your interests and coping strategies</h3>
                
                <div className="space-y-3">
                  <Label>What helps you cope? (Select all that apply)</Label>
                  {['exercise', 'reading', 'art/creativity', 'nature', 'music', 'journaling', 'talking'].map((method) => (
                    <div key={method} className="flex items-center space-x-2">
                      <Checkbox 
                        id={method}
                        checked={answers.copingMethods.includes(method)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setAnswers({...answers, copingMethods: [...answers.copingMethods, method]});
                          } else {
                            setAnswers({...answers, copingMethods: answers.copingMethods.filter(m => m !== method)});
                          }
                        }}
                      />
                      <Label htmlFor={method} className="font-normal capitalize cursor-pointer">
                        {method}
                      </Label>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Your interests/hobbies (optional)</Label>
                  <Textarea 
                    placeholder="e.g., hiking, cooking, photography (comma-separated)"
                    value={answers.interests}
                    onChange={(e) => setAnswers({...answers, interests: e.target.value})}
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 5 - About You */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tell us about yourself</h3>
                
                <div className="space-y-2">
                  <Label>Your age range</Label>
                  <Select value={answers.ageRange} onValueChange={(value) => setAnswers({...answers, ageRange: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select age range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="18-24">18-24</SelectItem>
                      <SelectItem value="25-34">25-34</SelectItem>
                      <SelectItem value="35-44">35-44</SelectItem>
                      <SelectItem value="45-54">45-54</SelectItem>
                      <SelectItem value="55+">55+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Brief bio (optional)</Label>
                  <Textarea 
                    placeholder="Share anything you'd like peers to know about you..."
                    value={answers.bio}
                    onChange={(e) => setAnswers({...answers, bio: e.target.value})}
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={handlePreviousStep}
                disabled={currentStep === 1}
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </Button>
              
              {currentStep < 5 ? (
                <Button
                  onClick={handleNextStep}
                  disabled={!isStepValid()}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleFindMatches}
                  disabled={!isStepValid()}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Find My Matches
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isMatching && (
        <Card className="text-center py-12">
          <CardContent>
            <Loader2 className="h-16 w-16 mx-auto text-blue-500 animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
              Finding Your Perfect Matches...
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              We're analyzing your responses to connect you with the best peer support matches.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              This usually takes a few moments...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Questionnaire Answers Summary */}
      {questionnaireCompleted && matches.length > 0 && (
        <Card className="border-purple-200 dark:border-purple-800">
          <Collapsible open={showAnswersSummary} onOpenChange={setShowAnswersSummary}>
            <CardHeader>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer">
                  <CardTitle className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-purple-600" />
                    Your Matching Profile
                  </CardTitle>
                  <ChevronDown 
                    className={`h-5 w-5 transition-transform ${showAnswersSummary ? 'rotate-180' : ''}`} 
                  />
                </div>
              </CollapsibleTrigger>
              <CardDescription>View the preferences used for matching</CardDescription>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="space-y-3 text-sm">
                <div><strong>Loss Type:</strong> {answers.lossType}</div>
                <div><strong>Timeframe:</strong> {answers.lossTimeframe}</div>
                <div><strong>Looking For:</strong> {answers.supportPreferences.join(', ')}</div>
                <div><strong>Communication:</strong> {answers.communicationFrequency} via {answers.communicationMethod}</div>
                <div><strong>Availability:</strong> {answers.availability.join(', ')}</div>
                <div><strong>Coping Methods:</strong> {answers.copingMethods.join(', ')}</div>
                {answers.interests && <div><strong>Interests:</strong> {answers.interests}</div>}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Matched Peers Section */}
      {questionnaireCompleted && matches.length > 0 && !isMatching && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
              Your Peer Matches ({matches.length})
            </h2>
            <div className="space-x-2">
              <Button variant="outline" size="sm" onClick={handleGetNewMatches}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Get New Matches
              </Button>
              <Button variant="outline" size="sm" onClick={handleRetakeQuestionnaire}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Retake Questionnaire
              </Button>
            </div>
          </div>
          
          {matches.map((peer) => {
            const isExpanded = expandedCards.has(peer.id);
            const buttonConfig = getConnectionButton(peer.connectionStatus);
            const sharedAttributes = getSharedAttributes(peer);
            
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

                      {/* Why we matched */}
                      {sharedAttributes.length > 0 && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>Why we matched you:</strong> You both share {sharedAttributes.join(', ')}
                          </p>
                        </div>
                      )}

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
                              <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{peer.availability.join(', ')}</p>
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
                            <div>
                              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Communication Method</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{peer.communicationMethod}</p>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Coping Methods</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{peer.copingMethods.join(', ')}</p>
                            </div>
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
          })}
        </div>
      )}

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
