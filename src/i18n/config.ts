import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import th from './locales/th.json';
import en from './locales/en.json';
import lo from './locales/lo.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      th: { translation: th },
      en: { translation: en },
      lo: { translation: lo },
    },
    fallbackLng: 'lo',
    lng: 'lo', // Default language
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
