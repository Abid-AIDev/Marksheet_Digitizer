// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export const createClient = () => {
  // Only create Supabase client in browser environment
  if (typeof window === 'undefined') {
    // Return a mock client for server-side rendering and build time
    return {
      auth: {
        signUp: async () => ({ error: { message: 'Not available during build' } }),
        signInWithPassword: async () => ({ error: { message: 'Not available during build' } }),
        signOut: async () => ({ error: null }),
      },
    } as any;
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client for missing environment variables
    return {
      auth: {
        signUp: async () => ({ error: { message: 'Supabase not configured' } }),
        signInWithPassword: async () => ({ error: { message: 'Supabase not configured' } }),
        signOut: async () => ({ error: { message: 'Supabase not configured' } }),
      },
    } as any;
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};
