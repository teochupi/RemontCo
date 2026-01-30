/**
 * Authentication Service
 * Handles user authentication operations
 */

import { supabase } from './supabase.js';

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
  // First, create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'company_admin',
        username: username.toLowerCase(),
        email: email
      }
    }
  });

  if (authError) throw authError;

  // Then create company record
  const { data: companyRecord, error: companyError } = await supabase
    .from('companies')
    .insert({
      owner_id: authData.user.id,
      name: companyData.name,
      eik: companyData.eik,
      address: companyData.address,
      city: companyData.city,
      phone: companyData.phone,
      email: email,
      is_verified: false,
      status: 'pending'
    })
    .select()
    .single();

  if (companyError) throw companyError;

  return { authData, companyRecord };
}

/**
 * Request password reset
 * @param {string} email 
 * @returns {Promise<Object>}
 */
export async function resetPassword(email) {
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
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) throw error;
  return data;
}
