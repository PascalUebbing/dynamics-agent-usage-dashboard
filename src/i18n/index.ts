import { translations, type Locale, type TranslationKey } from './translations';

export function detectLocale(): Locale {
  const languageId = window.parent?.Xrm?.Utility.getGlobalContext().userSettings.languageId;
  if (languageId === 1031) {
    return 'de';
  }

  return navigator.language.toLowerCase().startsWith('de') ? 'de' : 'en';
}

export function createTranslator(locale: Locale) {
  return (key: TranslationKey): string => translations[locale][key];
}
