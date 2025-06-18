import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Mail, Heart, Calendar, Download, Trash2 } from 'lucide-react';

export function LettersPage() {
  const [showNewLetter, setShowNewLetter] = React.useState(false);
  const [letterTo, setLetterTo] = React.useState('');
  const [letterSubject, setLetterSubject] = React.useState('');
  const [letterContent, setLetterContent] = React.useState('');
  const [savedLetters, setSavedLetters] = React.useState([
    {
      id: 1,
      to: 'Mom',
      subject: 'Missing your Sunday pancakes',
      content: 'Dear Mom, I woke up this morning thinking about your pancakes...',
      date: '2 days ago',
      wordCount: 247,
      category: 'Memory'
    },
    {
      id: 2,
      to: 'Dad',
      subject: 'Thank you for teaching me to be strong',
      content: 'Dad, I\'ve been thinking about all the lessons you taught me...',
      date: '1 week ago',
      wordCount: 156,
      category: 'Gratitude'
    }
  ]);

  const letterPrompts = [
    "Tell them about something wonderful that happened to you recently",
    "Share a memory that makes you smile",
    "Ask them the questions you wish you could still ask",
    "Thank them for a specific lesson they taught you",
    "Describe how you're honoring their memory",
    "Tell them about the family news they're missing",
    "Share your fears and how you're working through them",
    "Write about a tradition you're continuing because of them"
  ];

  const handleSaveLetter = () => {
    if (letterTo.trim() && letterContent.trim()) {
      const newLetter = {
        id: Date.now(),
        to: letterTo,
        subject: letterSubject || 'Untitled Letter',
        content: letterContent,
        date: 'Today',
        wordCount: letterContent.trim().split(/\s+/).length,
        category: 'Personal'
      };
      setSavedLetters([newLetter, ...savedLetters]);
      setLetterTo('');
      setLetterSubject('');
      setLetterContent('');
      setShowNewLetter(false);
    }
  };

  const deleteLetter = (id: number) => {
    setSavedLetters(savedLetters.filter(letter => letter.id !== id));
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Memory': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Gratitude': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Personal': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/tools">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tools
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            💌 Letters to Loved Ones
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Write messages to those you've lost - a beautiful way to stay connected
          </p>
        </div>
      </div>

      <div className="text-center">
        <Button 
          onClick={() => setShowNewLetter(true)}
          className="space-x-2"
        >
          <Mail className="h-4 w-4" />
          <span>Write a New Letter</span>
        </Button>
      </div>

      {showNewLetter && (
        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/20">
          <CardHeader>
            <CardTitle>Write a Letter</CardTitle>
            <CardDescription>
              Express your thoughts, feelings, and memories in a heartfelt letter
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="To: (e.g., 'Mom', 'Grandpa', 'Best Friend')"
                value={letterTo}
                onChange={(e) => setLetterTo(e.target.value)}
              />
              <Input
                placeholder="Subject (optional)"
                value={letterSubject}
                onChange={(e) => setLetterSubject(e.target.value)}
              />
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2">Writing prompts (click to use):</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {letterPrompts.slice(0, 4).map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-1 px-2"
                    onClick={() => setLetterContent(letterContent + (letterContent ? '\n\n' : '') + prompt)}
                  >
                    {prompt.substring(0, 30)}...
                  </Button>
                ))}
              </div>
            </div>

            <Textarea
              placeholder="Dear..."
              value={letterContent}
              onChange={(e) => setLetterContent(e.target.value)}
              className="min-h-64"
            />
            
            <div className="flex justify-between items-center">
              <div className="space-x-2">
                <Button 
                  disabled={!letterContent.trim() || !letterTo.trim()}
                  onClick={handleSaveLetter}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Letter
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowNewLetter(false)}
                >
                  Cancel
                </Button>
              </div>
              
              <div className="text-sm text-gray-500">
                {letterContent.trim() ? letterContent.trim().split(/\s+/).length : 0} words
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {savedLetters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Your Letters</span>
              <Badge variant="outline">{savedLetters.length}</Badge>
            </CardTitle>
            <CardDescription>
              Your collection of heartfelt messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {savedLetters.map((letter) => (
                <Card key={letter.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">To: {letter.to}</h3>
                          <Badge className={getCategoryColor(letter.category)}>
                            {letter.category}
                          </Badge>
                        </div>
                        <h4 className="text-sm text-gray-600 dark:text-gray-400">
                          {letter.subject}
                        </h4>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{letter.date}</span>
                          </span>
                          <span>{letter.wordCount} words</span>
                        </div>
                      </div>
                      <div className="space-x-2">
                        <Button size="sm" variant="ghost">
                          <Heart className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => deleteLetter(letter.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm line-clamp-3 mb-3">
                      {letter.content}
                    </p>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        Read Full Letter
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-3 w-3 mr-1" />
                        Export
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="text-amber-800 dark:text-amber-200">
            💝 Letters as Healing
          </CardTitle>
          <CardDescription className="text-amber-700 dark:text-amber-300">
            Writing letters to loved ones helps process grief and maintain connection
          </CardDescription>
        </CardHeader>
        <CardContent className="text-amber-700 dark:text-amber-300">
          <ul className="space-y-1 text-sm">
            <li>• Express feelings you couldn't say before</li>
            <li>• Share important life updates and milestones</li>
            <li>• Ask questions and imagine their responses</li>
            <li>• Keep their memory alive through conversation</li>
            <li>• Find comfort in continuing the relationship</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}