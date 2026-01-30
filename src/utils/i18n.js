import { supabase } from '../services/supabase.js';

let currentLanguage = localStorage.getItem('remontco_language') || 'bg';
let translations = {};

/**
 * Initialize i18n system
 */
export async function initI18n() {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    // Explicitly check if we have a saved language, otherwise default to 'bg'
    if (!localStorage.getItem('remontco_language')) {
      localStorage.setItem('remontco_language', 'bg');
      currentLanguage = 'bg';
    }

    await loadLanguage(currentLanguage);
  } catch (error) {
    console.warn('I18n logic failed, falling back to BG:', error);
    await loadLanguage('bg');
  } finally {
    // ALWAYS reveal the site, regardless of the logic above
    document.body.classList.add('ready');
  }
}

/**
 * Load language file
 * @param {string} lang - Language code (bg/en)
 */
export async function loadLanguage(lang) {
  try {
    // Add timestamp to prevent caching of translation files
    const response = await fetch(`/i18n/${lang}.json?v=${new Date().getTime()}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch translations: ${response.statusText}`);
    }

    translations = await response.json();
    currentLanguage = lang;
    localStorage.setItem('remontco_language', lang);
    translatePage();
    console.log(`Loaded language: ${lang}`, translations);
  } catch (error) {
    console.error('Error loading language file:', error);
    // Fallback to Bulgarian if error and we are not already trying Bulgarian
    if (lang !== 'bg') {
      await loadLanguage('bg');
    }
  }
}

/**
 * Get translation by key
 * @param {string} key - Translation key (e.g., 'nav.home')
 * @returns {string} Translated text
 */
export function t(key) {
  const keys = key.split('.');
  let value = translations;

  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }

  return value;
}

/**
 * Get current language
 * @returns {string} Current language code
 */
export function getCurrentLanguage() {
  return currentLanguage;
}

/**
 * Switch language
 * @param {string} lang - Language code to switch to
 */
export async function switchLanguage(lang) {
  if (lang !== currentLanguage) {
    await loadLanguage(lang);
  }
}

/**
 * Update page content with current language
 */
export function translatePage() {
  // Update elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    element.textContent = t(key);
  });

  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    element.placeholder = t(key);
  });

  // Update HTML lang attribute
  document.documentElement.lang = currentLanguage;

  // Dispatch language change event
  window.dispatchEvent(new CustomEvent('languageChanged', {
    detail: { language: currentLanguage }
  }));
}

/**
 * Apply translations to dynamically created element
 * @param {HTMLElement} element - Element to translate
 */
export function translateElement(element) {
  if (!element) return;

  const elementsToTranslate = element.querySelectorAll('[data-i18n]');
  elementsToTranslate.forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  const placeholders = element.querySelectorAll('[data-i18n-placeholder]');
  placeholders.forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });
}
