import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supportGroupsService } from '@/services/SupportGroupsService';
import { User } from '@/types/supportGroups';

interface AnonymousRegistrationProps {
  onComplete: (user: User) => void;
}

export function AnonymousRegistration({ onComplete }: AnonymousRegistrationProps) {
  const [username, setUsername] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUsername = username.trim();
    
    if (!trimmedUsername) {
      setError('Please enter a username');
      return;
    }

    if (trimmedUsername.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (trimmedUsername.length > 20) {
      setError('Username must be at most 20 characters');
      return;
    }

    try {
      const user = supportGroupsService.registerUser(trimmedUsername);
      onComplete(user);
    } catch (err) {
      setError('Failed to register. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="text-4xl mb-2">🤝</div>
          <CardTitle className="text-2xl">Welcome to Support Groups</CardTitle>
          <CardDescription className="text-base">
            Create your anonymous identity to join supportive communities.
            Your username is your only identifier - no email or password required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Choose Your Anonymous Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="e.g., HopefulJourney, QuietStrength"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                className="text-base"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                3-20 characters. This will be visible to other group members.
              </p>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                Your Privacy Matters
              </h4>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>✓ No email or personal information required</li>
                <li>✓ Your username is stored locally on your device</li>
                <li>✓ You can return anytime using the same device</li>
                <li>✓ All interactions remain anonymous</li>
              </ul>
            </div>

            <Button type="submit" className="w-full" size="lg">
              Continue to Support Groups
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
