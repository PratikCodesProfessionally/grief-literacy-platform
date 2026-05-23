import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/card';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash fragment from the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        // Also check for error in URL
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        if (error) {
          setStatus('error');
          setMessage(errorDescription || 'Authentication failed');
          return;
        }

        if (accessToken && refreshToken) {
          // Set the session with the tokens from the URL
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            setStatus('error');
            setMessage(sessionError.message);
            return;
          }

          setStatus('success');
          if (type === 'signup' || type === 'email_confirmation') {
            setMessage('Email verified successfully! You can now use cloud storage.');
          } else if (type === 'recovery') {
            setMessage('Password reset successful!');
          } else {
            setMessage('Authentication successful!');
          }

          // Redirect after a short delay
          setTimeout(() => {
            navigate('/tools/journaling', { replace: true });
          }, 2000);
        } else {
          // No tokens in URL, check if we have an existing session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            setStatus('success');
            setMessage('Already logged in! Redirecting...');
            setTimeout(() => {
              navigate('/tools/journaling', { replace: true });
            }, 1000);
          } else {
            setStatus('error');
            setMessage('No authentication data found. Please try signing up again.');
          }
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus('error');
        setMessage('An unexpected error occurred');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="p-8 max-w-md w-full text-center space-y-6">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-blue-500 mx-auto animate-spin" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Processing...</h2>
              <p className="text-gray-600 mt-2">{message}</p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Success!</h2>
              <p className="text-gray-600 mt-2">{message}</p>
              <p className="text-sm text-gray-500 mt-4">Redirecting to journaling...</p>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Something went wrong</h2>
              <p className="text-gray-600 mt-2">{message}</p>
            </div>
            <Button onClick={() => navigate('/tools/journaling')} className="w-full">
              Go to Journaling
            </Button>
          </>
        )}
      </Card>
    </div>
  );
};
