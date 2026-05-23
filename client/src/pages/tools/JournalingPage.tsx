import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Calendar, Download, Trash2, Save, Smile, Meh, Frown, Star, StarOff, Search, BarChart3, Settings, Tag, Plus, X, Cloud, CloudOff, RefreshCw, Loader2 } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { journalStorage, type StorageType, type JournalEntry } from '@/services/JournalStorageService';
import { StorageSelector } from '@/components/StorageSelector';
import { useAuth } from '@/contexts/AuthContext';

export function JournalingPage() {
  const { user, isAuthenticated } = useAuth();
  const [selectedPrompt, setSelectedPrompt] = React.useState('');
  const [journalEntry, setJournalEntry] = React.useState('');
  const [entries, setEntries] = React.useState<JournalEntry[]>([]);
  const [selectedMood, setSelectedMood] = React.useState<'positive' | 'neutral' | 'difficult' | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showAnalytics, setShowAnalytics] = React.useState(false);
  const [showStorageSelector, setShowStorageSelector] = React.useState(false);
  const [storageType, setStorageType] = useLocalStorage<StorageType>('journal-storage-type', 'local');
  const [currentTags, setCurrentTags] = React.useState<string[]>([]);
  const [newTag, setNewTag] = React.useState('');
  const [expandedEntries, setExpandedEntries] = React.useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [syncStatus, setSyncStatus] = React.useState<{ pending: number; synced: number; lastSync: Date | null }>({
    pending: 0,
    synced: 0,
    lastSync: null,
  });

  // Load entries from IndexedDB on mount
  React.useEffect(() => {
    async function loadEntries() {
      try {
        setIsLoading(true);
        const storedEntries = await journalStorage.getAllEntries();
        setEntries(storedEntries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
        
        // Load sync status
        const status = await journalStorage.getSyncStatus();
        setSyncStatus({
          pending: status.pending,
          synced: status.synced,
          lastSync: status.lastSync,
        });
      } catch (error) {
        console.error('Failed to load entries:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadEntries();
  }, []);

  // Set user context for cloud sync when authenticated
  React.useEffect(() => {
    if (isAuthenticated && user?.id) {
      // In production, get encryption password from user input or secure storage
      const encryptionPassword = sessionStorage.getItem('grief-platform-encryption-password');
      if (encryptionPassword) {
        journalStorage.setUserContext(user.id, encryptionPassword);
      }
    }
  }, [isAuthenticated, user?.id]);

  const journalPrompts = [
    "How are you feeling today? Don't judge it, just notice it.",
    "What do you miss most about them today?",
    "Describe a moment when you felt their love strongly.",
    "What would you want them to know about your life right now?",
    "Write about a fear you have about moving forward.",
    "What are you grateful for today, even in your grief?",
    "How has this loss changed you?",
    "What does healing look like to you?",
    "What contradictions are you holding right now?",
    "Write a letter to them about something in your life.",
    "What would they want you to know about how you're doing?",
  ];

  const saveEntry = async () => {
    if (!journalEntry.trim()) return;

    const newEntry: JournalEntry = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      content: journalEntry,
      prompt: selectedPrompt || undefined,
      mood: selectedMood || undefined,
      wordCount: journalEntry.trim().split(/\s+/).length,
      charCount: journalEntry.length,
      tags: currentTags.length > 0 ? currentTags : undefined,
      isFavorite: false,
      // Legacy fields
      date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      timestamp: Date.now(),
    };

    try {
      await journalStorage.saveEntry(newEntry);
      setEntries([newEntry, ...entries]);
      setJournalEntry('');
      setSelectedPrompt('');
      setSelectedMood(null);
      setCurrentTags([]);
      
      // Update sync status
      const status = await journalStorage.getSyncStatus();
      setSyncStatus({ pending: status.pending, synced: status.synced, lastSync: status.lastSync });
    } catch (error) {
      console.error('Failed to save entry:', error);
    }
  };

  const syncNow = async () => {
    if (storageType === 'local') return;
    
    setIsSyncing(true);
    try {
      await journalStorage.forceSync();
      const storedEntries = await journalStorage.getAllEntries();
      setEntries(storedEntries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)));
      
      const status = await journalStorage.getSyncStatus();
      setSyncStatus({ pending: status.pending, synced: status.synced, lastSync: new Date() });
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !currentTags.includes(newTag.trim())) {
      setCurrentTags([...currentTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setCurrentTags(currentTags.filter(t => t !== tag));
  };

  const filteredEntries = React.useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const query = searchQuery.toLowerCase();
    return entries.filter(entry =>
      entry.content.toLowerCase().includes(query) ||
      entry.prompt?.toLowerCase().includes(query) ||
      entry.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }, [entries, searchQuery]);

  const analytics = React.useMemo(() => {
    const totalWords = entries.reduce((sum, e) => sum + e.wordCount, 0);
    const avgWordsPerEntry = entries.length > 0 ? Math.round(totalWords / entries.length) : 0;
    const moodCounts = entries.reduce((acc, e) => {
      if (e.mood) acc[e.mood] = (acc[e.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalEntries: entries.length,
      totalWords,
      avgWordsPerEntry,
      moodCounts,
      favoriteCount: entries.filter(e => e.isFavorite).length,
    };
  }, [entries]);

  React.useEffect(() => {
    const hasSeenStorageSelector = localStorage.getItem('journal-storage-selected');
    if (!hasSeenStorageSelector && entries.length === 0 && !isLoading) {
      setShowStorageSelector(true);
    }
  }, [entries.length, isLoading]);

  const handleStorageSelection = async (type: StorageType) => {
    setStorageType(type);
    localStorage.setItem('journal-storage-selected', 'true');
    journalStorage.updateSettings({ storageType: type });
    setShowStorageSelector(false);
    
    // Migrate existing entries if switching to cloud
    if (type === 'cloud' || type === 'hybrid') {
      await journalStorage.migrateStorage(type);
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      await journalStorage.deleteEntry(id);
      setEntries(entries.filter(e => e.id !== id));
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  const toggleFavorite = async (id: string) => {
    const entry = entries.find(e => e.id === id);
    if (entry) {
      const updated = { ...entry, isFavorite: !entry.isFavorite };
      await journalStorage.saveEntry(updated);
      setEntries(entries.map(e => e.id === id ? updated : e));
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedEntries(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const exportEntries = () => {
    const exportText = entries.map(entry => 
      `Date: ${entry.date}\n${entry.prompt ? `Prompt: ${entry.prompt}\n` : ''}${entry.mood ? `Mood: ${entry.mood}\n` : ''}\n${entry.content}\n\n---\n\n`
    ).join('');
    
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grief-journal-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  const recentEntries = [
    { date: 'Today', preview: 'I woke up thinking about Mom again...' },
    { date: 'Yesterday', preview: 'The grief hit me in waves today...' },
    { date: '3 days ago', preview: 'I found myself laughing at a memory...' },
  ];

  return (
    <div className="space-y-6 p-4">
      {/* Storage Selector Modal */}
      {showStorageSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <StorageSelector onSelect={handleStorageSelection} />
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Link to="/tools" className="flex-shrink-0">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3">
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Back to Tools</span>
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white truncate">
            📔 Grief Journaling
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Sync Status & Button */}
          {storageType !== 'local' && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={syncNow}
                disabled={isSyncing || !navigator.onLine}
                className="flex items-center gap-1"
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : navigator.onLine ? (
                  <Cloud className="h-4 w-4 text-green-500" />
                ) : (
                  <CloudOff className="h-4 w-4 text-gray-400" />
                )}
                {isSyncing ? 'Syncing...' : 'Sync'}
              </Button>
              {syncStatus.pending > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {syncStatus.pending} pending
                </Badge>
              )}
            </div>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowAnalytics(!showAnalytics)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {showAnalytics ? 'Hide' : 'Show'} Analytics
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowStorageSelector(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Storage: {storageType}
          </Button>
          {entries.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportEntries}>
              <Download className="h-4 w-4 mr-2" />
              Export ({entries.length})
            </Button>
          )}
        </div>
      </div>

      {/* Analytics Dashboard */}
      {showAnalytics && (
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-purple-300 dark:border-purple-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100" style={{ WebkitFontSmoothing: 'antialiased', fontWeight: 600 }}>
              <BarChart3 className="h-5 w-5" />
              Journal Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-700 dark:text-purple-300">{analytics.totalEntries}</div>
                <div className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 font-medium">Total Entries</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-indigo-700 dark:text-indigo-300">{analytics.totalWords}</div>
                <div className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 font-medium">Total Words</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-700 dark:text-blue-300">{analytics.avgWordsPerEntry}</div>
                <div className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 font-medium">Avg Words/Entry</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-amber-700 dark:text-amber-300">{analytics.favoriteCount}</div>
                <div className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 font-medium">Favorites</div>
              </div>
              <div className="text-center col-span-2 sm:col-span-1">
                <div className="flex justify-center gap-1 sm:gap-2 mb-1">
                  <span className="text-base sm:text-lg" title="Positive">😊 {analytics.moodCounts.positive || 0}</span>
                  <span className="text-base sm:text-lg" title="Neutral">😐 {analytics.moodCounts.neutral || 0}</span>
                  <span className="text-base sm:text-lg" title="Difficult">☹️ {analytics.moodCounts.difficult || 0}</span>
                </div>
                <div className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 font-medium">Mood Distribution</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <Card className="hover-lift">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Journal Prompts</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Choose a prompt to guide your writing today
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 px-4 sm:px-6 max-h-[24rem] sm:max-h-[28rem] overflow-y-auto">
            {journalPrompts.map((prompt, index) => (
              <Button
                key={index}
                variant={selectedPrompt === prompt ? "default" : "outline"}
                className="w-full text-left justify-start h-auto p-2 sm:p-3 text-xs sm:text-sm rounded-xl transition-all duration-300 hover:scale-[1.01]"
                onClick={() => setSelectedPrompt(prompt)}
              >
                <span className="break-words whitespace-normal">{prompt}</span>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 hover-lift">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Today's Entry</CardTitle>
            <CardDescription className="text-sm sm:text-base break-words">
              {selectedPrompt || "Select a prompt or write freely about what's on your heart"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Tag Management */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">Tags (optional)</label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add a tag (e.g., family, memories, healing)..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 input-clear"
                />
                <Button onClick={addTag} variant="outline" size="sm" className="btn-clear-state">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {currentTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {currentTags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      <Tag className="h-3 w-3" />
                      {tag}
                      <button onClick={() => removeTag(tag)} className="ml-1 hover:text-red-600">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Textarea
              placeholder="Let your thoughts flow onto the page..."
              className="min-h-96 text-reading-journal scrollbar-styled"
              style={{
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                fontSize: '1.125rem',
                lineHeight: '1.8',
              }}
              value={journalEntry}
              onChange={(e) => setJournalEntry(e.target.value)}
            />

            {/* Mood Selector */}
            <div className="mt-4 space-y-2">
              <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                How are you feeling?
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedMood === 'positive' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMood('positive')}
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm h-8"
                >
                  <Smile className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden xs:inline sm:inline">Positive</span>
                </Button>
                <Button
                  variant={selectedMood === 'neutral' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMood('neutral')}
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm h-8"
                >
                  <Meh className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden xs:inline sm:inline">Neutral</span>
                </Button>
                <Button
                  variant={selectedMood === 'difficult' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMood('difficult')}
                  className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm h-8"
                >
                  <Frown className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden xs:inline sm:inline">Difficult</span>
                </Button>
              </div>
            </div>

            <div className="mt-4 flex justify-between">
              <div className="space-x-2">
                <Button onClick={saveEntry} disabled={!journalEntry.trim()} className="btn-clear-state">
                  <Save className="h-4 w-4 mr-2" />
                  Save Entry
                </Button>
                <Button variant="outline" onClick={() => setJournalEntry('')} className="btn-clear-state">
                  Clear
                </Button>
              </div>
              <div className="text-sm text-gray-500" style={{ WebkitFontSmoothing: 'antialiased' }}>
                {journalEntry.length} characters · {journalEntry.split(/\s+/).filter(Boolean).length} words
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Recent Entries</span>
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
          <CardDescription>
            {searchQuery 
              ? `Found ${filteredEntries.length} matching entries` 
              : 'Your recent journal entries - track your journey over time'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredEntries.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                {searchQuery ? 'No entries match your search.' : 'No entries yet. Start journaling to see your entries here.'}
              </p>
            ) : (
              filteredEntries.slice(0, 10).map((entry) => {
                const isExpanded = expandedEntries.has(entry.id);
                const shouldShowReadMore = entry.content.length > 200;
                
                return (
                  <div key={entry.id} className="border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between p-3 sm:p-4 gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap flex-wrap items-center gap-2 mb-2">
                          <div className="font-medium text-xs sm:text-sm">{entry.date}</div>
                          {entry.mood && (
                            <Badge variant={entry.mood === 'positive' ? 'default' : entry.mood === 'difficult' ? 'destructive' : 'secondary'} className="text-xs">
                              {entry.mood === 'positive' && <Smile className="h-3 w-3 mr-1" />}
                              {entry.mood === 'neutral' && <Meh className="h-3 w-3 mr-1" />}
                              {entry.mood === 'difficult' && <Frown className="h-3 w-3 mr-1" />}
                              <span className="hidden sm:inline">{entry.mood}</span>
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {entry.wordCount}w{entry.charCount && <span className="hidden sm:inline"> · {entry.charCount} chars</span>}
                          </span>
                        </div>
                        {entry.prompt && (
                          <div className="text-xs text-purple-600 dark:text-purple-400 italic mb-2 font-medium">
                            Prompt: {entry.prompt}
                          </div>
                        )}
                        
                        {/* FULL CONTENT DISPLAY - No truncation when expanded */}
                        <div 
                          className={
                            isExpanded 
                              ? "text-reading-journal scrollbar-styled max-h-[600px] overflow-y-auto pr-2"
                              : "text-sm text-gray-600 dark:text-gray-400"
                          }
                          style={isExpanded ? {
                            WebkitFontSmoothing: 'antialiased',
                            MozOsxFontSmoothing: 'grayscale',
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                          } : undefined}
                        >
                          {isExpanded ? (
                            // Full view: Show complete content with crystal-clear rendering
                            <div className="leading-relaxed">
                              {entry.content}
                            </div>
                          ) : (
                            // Preview mode: Show first 200 chars
                            <div className="line-clamp-2">
                              {entry.content}
                            </div>
                          )}
                        </div>
                        
                        {/* Read More/Less Button */}
                        {shouldShowReadMore && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={() => toggleExpand(entry.id)}
                            className="px-0 h-auto mt-1 text-purple-600 hover:text-purple-700 btn-clear-state"
                          >
                            {isExpanded ? '← Show less' : 'Read more →'}
                          </Button>
                        )}
                        
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {entry.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 sm:ml-4 self-end sm:self-start flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(entry.id)}
                          title={entry.isFavorite ? "Remove from favorites" : "Add to favorites"}
                          className="h-8 w-8 p-0"
                        >
                          {entry.isFavorite ? (
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ) : (
                            <StarOff className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteEntry(entry.id)}
                          title="Delete entry"
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
