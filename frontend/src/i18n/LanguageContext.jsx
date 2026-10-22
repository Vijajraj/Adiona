import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';

const defaultT = (key, params = {}) => {
  const langDict = translations.en;
  let text = langDict[key] || key;
  if (params && typeof params === 'object') {
    Object.keys(params).forEach((p) => {
      text = text.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
    });
  }
  return text;
};

const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: defaultT,
});

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      return localStorage.getItem('adiona_language') || 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('adiona_language', lang);
      document.documentElement.lang = lang;
    } catch {
      // Storage unavailable fallback
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key, params = {}) => {
    const langDict = translations[language] || translations.en;
    let text = langDict[key] || translations.en[key] || key;
    if (params && typeof params === 'object') {
      Object.keys(params).forEach((p) => {
        text = text.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);
