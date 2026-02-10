/**
 * Authentication Service
 * Handles user authentication operations
 */

import { supabase } from './supabase.js';

/**
 * Check if username already exists
 * @param {string} username 
 * @returns {Promise<boolean>} True if username exists
 */
export async function checkUsernameExists(username) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error('Error checking username:', error);
    return false;
  }

  return !!data;
}

/**
 * Check if email already exists
 * @param {string} email 
 * @returns {Promise<boolean>} True if email exists
 */
export async function checkEmailExists(email) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error('Error checking email:', error);
    return false;
  }

  return !!data;
}

/**
 * Sign in with email or username and password
 * @param {string} identifier - Email or Username
 * @param {string} password 
 * @returns {Promise<Object>} Auth response
 */
export async function signIn(identifier, password) {
  let email = identifier;

  // Check if identifier is not an email
  if (!identifier.includes('@')) {
    // Hardcoded fallback for admin to bypass RLS issues on profiles table for anonymous users
    if (identifier.toLowerCase() === 'admin') {
      email = 'chupetlov.teodor@gmail.com';
    } else {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', identifier.toLowerCase())
        .single();

      if (profileError || !profile) {
        throw new Error('Invalid username or email');
      }

      email = profile.email;
    }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
}

/**
 * Register new user (consumer)
 * @param {string} email 
 * @param {string} username
 * @param {string} password 
 * @param {Object} profileData - Additional profile data
 * @returns {Promise<Object>} Auth response
 */
export async function registerConsumer(email, username, password, profileData) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'consumer',
        username: username.toLowerCase(),
        email: email, // redundant but useful for profile sync
        ...profileData
      }
    }
  });

  if (error) throw error;
  return data;
}

/**
 * Register new company
 * @param {string} email 
 * @param {string} username
 * @param {string} password 
 * @param {Object} companyData - Company information
 * @returns {Promise<Object>} Registration response
 */
export async function registerCompany(email, username, password, companyData) {
  // Create auth user with company role
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'company',
        username: username.toLowerCase(),
        email: email,
        company_name: companyData.name,
        company_eik: companyData.eik,
        company_city: companyData.city,
        company_phone: companyData.phone,
        company_address: companyData.address,
        company_description: companyData.description,
        company_website: companyData.website,
        company_categories: companyData.categories || []
      }
    }
  });

  if (authError) throw authError;

  // All company data including categories is stored in user metadata
  // The database trigger 'on_profile_created_company' will create the company record
  // when the profile is created (after email confirmation)
  // Categories are retrieved from metadata and applied in company_dashboard

  return { authData, companyRecord: null };
}

/**
 * Request password reset
 * @param {string} email 
 * @returns {Promise<Object>}
 */
export async function resetPassword(email) {
  // Block password reset for demo accounts
  const DEMO_EMAILS = ['demo@remont.co', 'company-demo@remont.co'];
  if (DEMO_EMAILS.includes(email?.toLowerCase())) {
    throw new Error('Password reset is not available for demo accounts. Demo credentials are: demo@remont.co / demo123 or company-demo@remont.co / demo123');
  }

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password.html`
  });

  if (error) throw error;
  return data;
}

/**
 * Update password
 * @param {string} newPassword 
 * @returns {Promise<Object>}
 */
export async function updatePassword(newPassword) {
  // Get current user to check if it's a demo account
  const { data: { user } } = await supabase.auth.getUser();

  // Block password changes for demo accounts
  const DEMO_EMAILS = ['demo@remont.co', 'company-demo@remont.co'];
  if (user && DEMO_EMAILS.includes(user.email?.toLowerCase())) {
    throw new Error('Demo account passwords cannot be changed. Please create your own account to use all features.');
  }

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) throw error;
  return data;
}
