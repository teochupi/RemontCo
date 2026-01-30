/**
 * Authentication and Authorization Guards
 * Protects routes based on authentication status and user roles
 */

import { getCurrentSession, getCurrentUser } from '../services/supabase.js';

/**
 * Require authentication
 * Redirects to login if user is not authenticated
 * @param {string} redirectTo - URL to redirect to if not authenticated
 * @returns {Promise<Object>} User session
 */
export async function requireAuth(redirectTo = '/index.html') {
  const session = await getCurrentSession();

  if (!session) {
    // Save intended destination
    localStorage.setItem('remontco_redirect_after_login', window.location.pathname + window.location.search);
    window.location.replace(redirectTo);
    throw new Error('Authentication required');
  }

  return session;
}

/**
 * Require specific role(s)
 * Redirects if user doesn't have required role
 * @param {string|string[]} allowedRoles - Role or array of roles
 * @param {string} redirectTo - URL to redirect if unauthorized
 * @returns {Promise<Object>} User profile
 */
export async function requireRole(allowedRoles, redirectTo = null) {
  // Ensure we're authenticated first
  await requireAuth();

  const user = await getCurrentUser();

  if (!user || !user.role) {
    window.location.href = '/auth/login.html';
    throw new Error('User profile not found');
  }

  // Normalize to array
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  // Check if user has required role
  if (!roles.includes(user.role)) {
    // If no specific redirect provided, route to appropriate dashboard
    if (!redirectTo) {
      redirectTo = routeAfterLogin(user.role);
    }

    console.warn(`Unauthorized access attempt. Required: ${roles.join(', ')}, Found: ${user.role}`);
    window.location.href = redirectTo;
    throw new Error('Insufficient permissions');
  }

  return user;
}

/**
 * Check if user is authenticated (without redirecting)
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
  const session = await getCurrentSession();
  return !!session;
}

/**
 * Check if user has specific role (without redirecting)
 * @param {string|string[]} allowedRoles 
 * @returns {Promise<boolean>}
 */
export async function hasRole(allowedRoles) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.role) return false;

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    return roles.includes(user.role);
  } catch {
    return false;
  }
}

/**
 * Route user to appropriate dashboard based on role
 * @param {string} role - User role
 * @returns {string} Dashboard URL
 */
export function routeAfterLogin(role) {
  const routes = {
    'consumer': '/dashboard/consumer.html',
    'company_admin': '/dashboard/company.html',
    'company_member': '/dashboard/company.html',
    'admin': '/dashboard/admin.html'
  };

  return routes[role] || '/index.html';
}

/**
 * Check if user is a company user (admin or member)
 * @returns {Promise<boolean>}
 */
export async function isCompanyUser() {
  return await hasRole(['company_admin', 'company_member']);
}

/**
 * Require company role with additional company verification check
 * @returns {Promise<Object>} User profile with company data
 */
export async function requireCompanyAccess() {
  const user = await requireRole(['company_admin', 'company_member']);

  // Could add additional checks here, e.g., company verification status
  return user;
}

/**
 * Handle redirect after successful login
 */
export function handlePostLoginRedirect() {
  const intendedUrl = localStorage.getItem('remontco_redirect_after_login');
  localStorage.removeItem('remontco_redirect_after_login');

  if (intendedUrl && intendedUrl !== '/auth/login.html' && intendedUrl !== '/auth/register.html') {
    window.location.href = intendedUrl;
  } else {
    // Redirect based on role
    getCurrentUser().then(user => {
      if (user && user.role) {
        window.location.href = routeAfterLogin(user.role);
      } else {
        window.location.href = '/index.html';
      }
    });
  }
}
