import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  formatDate,
  formatDateTime,
  getLocale,
  translateCategory,
  translateDepartment,
  translateMessage,
  translatePriority,
  translateRole,
  translateStatus,
} from '../i18n/language';

const STORAGE_KEY = 'civicdesk_language';
const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    if (typeof window === 'undefined') return 'en';
    return window.localStorage.getItem(STORAGE_KEY) === 'te' ? 'te' : 'en';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, language);
    }
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (value) => {
    setLanguageState(value === 'te' ? 'te' : 'en');
  };

  const toggleLanguage = () => {
    setLanguageState((current) => (current === 'en' ? 'te' : 'en'));
  };

  const value = useMemo(
    () => ({
      language,
      isTelugu: language === 'te',
      locale: getLocale(language),
      setLanguage,
      toggleLanguage,
      l: (english, telugu) => (language === 'te' ? telugu : english),
      translateCategory: (value) => translateCategory(language, value),
      translateStatus: (value) => translateStatus(language, value),
      translatePriority: (value) => translatePriority(language, value),
      translateRole: (value) => translateRole(language, value),
      translateDepartment: (value) => translateDepartment(language, value),
      translateMessage: (value) => translateMessage(language, value),
      formatDate: (value, options) => formatDate(language, value, options),
      formatDateTime: (value, options) => formatDateTime(language, value, options),
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
