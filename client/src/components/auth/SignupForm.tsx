import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { EncryptionService } from '../../services/EncryptionService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface SignupFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const { signUp } = useAuth();
  const [step, setStep] = useState<'account' | 'encryption'>('account');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [encryptionPassword, setEncryptionPassword] = useState('');
  const [confirmEncryptionPassword, setConfirmEncryptionPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const validateAccountStep = () => {
    if (!email || !password || !confirmPassword) {
      setError('All fields are required');
      return false;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const validateEncryptionStep = () => {
    if (!encryptionPassword || !confirmEncryptionPassword) {
      setError('Encryption password is required');
      return false;
    }

    if (encryptionPassword.length < 12) {
      setError('Encryption password must be at least 12 characters for security');
      return false;
    }

    if (encryptionPassword !== confirmEncryptionPassword) {
      setError('Encryption passwords do not match');
      return false;
    }

    return true;
  };

  const handleAccountStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (validateAccountStep()) {
      setStep('encryption');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateEncryptionStep()) {
      return;
    }

    setLoading(true);

    const { error, user, needsEmailConfirmation } = await signUp(email, password, displayName);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Handle email confirmation requirement
    if (needsEmailConfirmation) {
      setEmailSent(true);
      setLoading(false);
      // Don't call onSuccess yet - user needs to confirm email first
      return;
    }

    // Store encryption password hash for verification (not for encryption!)
    const passwordHash = await EncryptionService.hashPassword(encryptionPassword);
    localStorage.setItem('grief-platform-encryption-hash', passwordHash);

    onSuccess?.();
    setLoading(false);
  };

  if (emailSent) {
    return (
      <Card className="p-6 max-w-md mx-auto">
        <div className="text-center space-y-4">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Check Your Email</h2>
            <p className="text-gray-600 mt-2">
              We've sent a confirmation link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Click the link in the email to complete your account setup and continue to encryption setup.
            </p>
          </div>
          <Button
            onClick={() => {
              setEmailSent(false);
              setStep('account');
            }}
            variant="outline"
            className="w-full"
          >
            Back to Signup
          </Button>
        </div>
      </Card>
    );
  }

  if (step === 'encryption') {
    return (
      <Card className="p-6 max-w-md mx-auto">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Secure Your Journal</h2>
            <p className="text-gray-600 mt-2">Create an encryption password</p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex gap-3">
              <svg
                className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Zero-Knowledge Encryption</p>
                <p>
                  Your journal entries are encrypted on your device before being saved to the cloud.
                  <strong className="block mt-1">
                    We cannot recover this password if you forget it.
                  </strong>
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <Label htmlFor="encryptionPassword">Encryption Password</Label>
              <Input
                id="encryptionPassword"
                type="password"
                value={encryptionPassword}
                onChange={(e) => setEncryptionPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 12 characters</p>
            </div>

            <div>
              <Label htmlFor="confirmEncryptionPassword">Confirm Encryption Password</Label>
              <Input
                id="confirmEncryptionPassword"
                type="password"
                value={confirmEncryptionPassword}
                onChange={(e) => setConfirmEncryptionPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="mt-1"
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('account')}
                className="flex-1"
              >
                Back
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Creating Account...' : 'Complete Signup'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 max-w-md mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
          <p className="text-gray-600 mt-2">Start your healing journey</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleAccountStep} className="space-y-4">
          <div>
            <Label htmlFor="displayName">Display Name (Optional)</Label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How should we address you?"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="password">Account Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="mt-1"
            />
          </div>

          <Button type="submit" className="w-full">
            Next: Set Up Encryption
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-sm text-blue-600 hover:text-blue-700 underline"
          >
            Already have an account? Sign in
          </button>
        </div>
      </div>
    </Card>
  );
};
