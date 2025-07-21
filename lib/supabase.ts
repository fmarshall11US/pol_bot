import { createClient } from '@supabase/supabase-js';
import { getCompleteServiceRoleKey } from './supabase-key-fix';

// Create a function to get the Supabase client
export const getSupabase = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};

// For backward compatibility - export null if env vars not available at build time
export const supabase = (function() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }
  // Return a proxy that will throw at runtime if used without env vars
  return null;
})();

// Admin client for server-side operations
export const getSupabaseAdmin = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
  }
  
  // Get the complete service role key (handles truncation issue in production)
  const serviceRoleKey = getCompleteServiceRoleKey().trim().replace(/\s+/g, '');
  
  // Debug logging (remove in production)
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔍 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('🔍 Service key length:', serviceRoleKey.length);
    console.log('🔍 Service key prefix:', serviceRoleKey.substring(0, 20) + '...');
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};