import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: AuthError | null; user: User | null; needsEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithMagicLink: (email: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (displayName: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Create the user's profile row if it doesn't exist yet (journal entries reference it). */
async function ensureProfile(user: User): Promise<void> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  if (profile) return;

  const { error: insertError } = await supabase.from('profiles').insert({
    id: user.id,
    email: user.email!,
    display_name: user.user_metadata?.display_name || null,
    storage_preference: 'hybrid',
    encryption_enabled: import.meta.env.VITE_ENABLE_ENCRYPTION === 'true',
  });
  if (insertError) throw insertError;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes.
    // The callback must NOT await other Supabase calls: supabase-js runs it while
    // holding its auth lock (e.g. while restoring the session on page load), and
    // any query inside waits for that lock -> every request hangs forever.
    // So update state synchronously and defer the profile check.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        const sessionUser = session.user;
        setTimeout(() => {
          ensureProfile(sessionUser).catch((err) =>
            console.error('Failed to ensure profile on login:', err)
          );
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) return { error, user: null, needsEmailConfirmation: false };

      // Check if email confirmation is required
      const needsEmailConfirmation = !data.session && data.user && !data.user.email_confirmed_at;

      // If email confirmation is required, don't create profile yet
      if (needsEmailConfirmation) {
        return { error: null, user: data.user, needsEmailConfirmation: true };
      }

      // Create profile in profiles table only if user is confirmed
      if (data.user && data.session) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          email: data.user.email!,
          display_name: displayName || null,
          storage_preference: 'hybrid',
          encryption_enabled: import.meta.env.VITE_ENABLE_ENCRYPTION === 'true',
        });

        if (profileError) {
          console.error('Failed to create profile:', profileError);
          // Don't fail the signup if profile creation fails - it might be created by trigger
        }
      }

      return { error: null, user: data.user, needsEmailConfirmation: false };
    } catch (error) {
      return { error: error as AuthError, user: null, needsEmailConfirmation: false };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signInWithMagicLink = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const updateProfile = async (displayName: string) => {
    try {
      if (!user) {
        return { error: new Error('No user logged in') };
      }

      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) return { error };

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const value = {
    user,
    session,
    loading,
    isAuthenticated: !!user && !!session,
    signUp,
    signIn,
    signInWithMagicLink,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
