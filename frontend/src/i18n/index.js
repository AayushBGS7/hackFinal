import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import hi from './hi.json';
import hinglish from './hinglish.json';

const savedLang = localStorage.getItem('healthSaathi_lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      hinglish: { translation: hinglish },
    },
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

// Persist language choice
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('healthSaathi_lang', lng);
});

export default i18n;
