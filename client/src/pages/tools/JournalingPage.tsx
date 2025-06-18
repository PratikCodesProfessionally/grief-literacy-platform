import * as React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Calendar } from 'lucide-react';

export function JournalingPage() {
  const [selectedPrompt, setSelectedPrompt] = React.useState('');
  const [journalEntry, setJournalEntry] = React.useState('');

  const journalPrompts = [
    "How are you feeling today? Don't judge it, just notice it.",
    "What do you miss most about them today?",
    "Describe a moment when you felt their love strongly.",
    "What would you want them to know about your life right now?",
    "Write about a fear you have about moving forward.",
    "What are you grateful for today, even in your grief?",
    "How has this loss changed you?",
    "What does healing look like to you?",
  ];

  const recentEntries = [
    { date: 'Today', preview: 'I woke up thinking about Mom again...' },
    { date: 'Yesterday', preview: 'The grief hit me in waves today...' },
    { date: '3 days ago', preview: 'I found myself laughing at a memory...' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/tools">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tools
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          📔 Grief Journaling
        </h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Journal Prompts</CardTitle>
            <CardDescription>
              Choose a prompt to guide your writing today
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {journalPrompts.map((prompt, index) => (
              <Button
                key={index}
                variant={selectedPrompt === prompt ? "default" : "outline"}
                className="w-full text-left justify-start h-auto p-3 text-sm"
                onClick={() => setSelectedPrompt(prompt)}
              >
                {prompt}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Today's Entry</CardTitle>
            <CardDescription>
              {selectedPrompt || "Select a prompt or write freely about what's on your heart"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Let your thoughts flow onto the page..."
              className="min-h-96"
              value={journalEntry}
              onChange={(e) => setJournalEntry(e.target.value)}
            />
            <div className="mt-4 flex justify-between">
              <div className="space-x-2">
                <Button disabled={!journalEntry.trim()}>Save Entry</Button>
                <Button variant="outline" onClick={() => setJournalEntry('')}>
                  Clear
                </Button>
              </div>
              <div className="text-sm text-gray-500">
                {journalEntry.length} characters
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Recent Entries</span>
          </CardTitle>
          <CardDescription>
            Your recent journal entries - track your journey over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEntries.map((entry, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium text-sm">{entry.date}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{entry.preview}</div>
                </div>
                <Button variant="ghost" size="sm">View</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
