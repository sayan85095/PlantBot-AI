import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import bn from './locales/bn.json';
import hi from './locales/hi.json';
import fr from './locales/fr.json';
import ja from './locales/ja.json';
import es from './locales/es.json';

const resources = {
  en: { translation: en },
  bn: { translation: bn },
  hi: { translation: hi },
  fr: { translation: fr },
  ja: { translation: ja },
  es: { translation: es },
};

const language = localStorage.getItem('plantbot_lang') || 'en';

i18n.use(initReactI18next).init({
  resources,
  lng: language,
  fallbackLng: 'en',
  react: {
    useSuspense: false,
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
