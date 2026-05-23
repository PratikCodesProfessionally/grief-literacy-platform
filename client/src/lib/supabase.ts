import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Dummy values for development when Supabase is not configured
const DUMMY_URL = 'https://placeholder.supabase.co';
const DUMMY_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder';

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Debug logging
console.log('[Supabase] Configuration check:', {
  hasUrl: Boolean(supabaseUrl),
  hasKey: Boolean(supabaseAnonKey),
  isConfigured,
  url: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'NOT SET',
});

if (!isConfigured) {
  console.warn('⚠️  Supabase not configured. Cloud storage features disabled.');
  console.info('ℹ️  To enable cloud storage:');
  console.info('   1. Create a Supabase account at https://app.supabase.com');
  console.info('   2. Copy .env.example to .env.local');
  console.info('   3. Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  console.info('   4. See SUPABASE_SETUP.md for detailed instructions');
} else {
  console.log('✅ Supabase configured successfully!');
}

export const supabase = createClient(
  supabaseUrl || DUMMY_URL, 
  supabaseAnonKey || DUMMY_KEY, 
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'grief-platform-auth',
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'X-Client-Info': 'grief-platform-web',
      },
    },
  }
);

export const isSupabaseConfigured = isConfigured;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          storage_preference: 'local' | 'cloud' | 'hybrid';
          encryption_enabled: boolean;
          last_sync_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          storage_preference?: 'local' | 'cloud' | 'hybrid';
          encryption_enabled?: boolean;
          last_sync_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          storage_preference?: 'local' | 'cloud' | 'hybrid';
          encryption_enabled?: boolean;
          last_sync_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      journal_entries: {
        Row: {
          id: string;
          user_id: string;
          encrypted_content: string;
          encrypted_title: string | null;
          encryption_iv: string;
          encryption_salt: string;
          mood: string | null;
          tags: string[];
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          version: number;
          device_id: string;
          sync_status: 'pending' | 'synced' | 'conflict';
        };
        Insert: {
          id: string;
          user_id: string;
          encrypted_content: string;
          encrypted_title?: string | null;
          encryption_iv: string;
          encryption_salt: string;
          mood?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          version?: number;
          device_id: string;
          sync_status?: 'pending' | 'synced' | 'conflict';
        };
        Update: {
          id?: string;
          user_id?: string;
          encrypted_content?: string;
          encrypted_title?: string | null;
          encryption_iv?: string;
          encryption_salt?: string;
          mood?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          version?: number;
          device_id?: string;
          sync_status?: 'pending' | 'synced' | 'conflict';
        };
      };
      prompts: {
        Row: {
          id: string;
          category: string;
          text: string;
          difficulty: 'beginner' | 'intermediate' | 'advanced';
          tags: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          category: string;
          text: string;
          difficulty?: 'beginner' | 'intermediate' | 'advanced';
          tags?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          category?: string;
          text?: string;
          difficulty?: 'beginner' | 'intermediate' | 'advanced';
          tags?: string[];
          created_at?: string;
        };
      };
      user_prompt_history: {
        Row: {
          id: string;
          user_id: string;
          prompt_id: string;
          used_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          prompt_id: string;
          used_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          prompt_id?: string;
          used_at?: string;
        };
      };
      sync_conflicts: {
        Row: {
          id: string;
          user_id: string;
          entry_id: string;
          local_version: number;
          cloud_version: number;
          local_data: any;
          cloud_data: any;
          resolved: boolean;
          resolved_at: string | null;
          resolution_strategy: 'keep_local' | 'keep_cloud' | 'merge' | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entry_id: string;
          local_version: number;
          cloud_version: number;
          local_data: any;
          cloud_data: any;
          resolved?: boolean;
          resolved_at?: string | null;
          resolution_strategy?: 'keep_local' | 'keep_cloud' | 'merge' | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          entry_id?: string;
          local_version?: number;
          cloud_version?: number;
          local_data?: any;
          cloud_data?: any;
          resolved?: boolean;
          resolved_at?: string | null;
          resolution_strategy?: 'keep_local' | 'keep_cloud' | 'merge' | null;
          created_at?: string;
        };
      };
    };
  };
};
