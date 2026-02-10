/**
 * Supabase Client Configuration
 * Initializes and exports the Supabase client for the RemontCo application
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Global listener for password recovery
// This ensures users are redirected to the reset password page if they land elsewhere (e.g. dashboard)
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'PASSWORD_RECOVERY') {
    const isResetPage = window.location.pathname.includes('/auth/reset-password.html');
    if (!isResetPage) {
      console.log('Password recovery detected, redirecting to reset page...');
      // Redirect to reset password page, preserving the hash with the token
      window.location.href = `/auth/reset-password.html${window.location.hash}`;
    }
  }
});

/**
 * Get current user session
 * @returns {Promise<Object|null>} User session or null
 */
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  return session;
}

/**
 * Get current user profile
 * @returns {Promise<Object|null>} User profile with role
 */
export async function getCurrentUser() {
  const session = await getCurrentSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

/**
 * Sign out current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
  window.location.href = '/index.html';
}
