'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from '../../lib/i18n/locales/en';
import { zh } from '../../lib/i18n/locales/zh';
import { fr } from '../../lib/i18n/locales/fr';
import { ru } from '../../lib/i18n/locales/ru';
import { es } from '../../lib/i18n/locales/es';
import { ar } from '../../lib/i18n/locales/ar';
import { pt } from '../../lib/i18n/locales/pt';
import { de } from '../../lib/i18n/locales/de';

const LanguageContext = createContext();

const translations = {
  en,
  zh,
  fr,
  ru,
  es,
  ar,
  pt,
  de,
  english: en, // Alias for legacy support
  chinese: zh, // Alias for legacy support
};

export function LanguageProvider({ children }) {
  // 默认使用中文，或者根据浏览器语言设置
  const [language, setLanguage] = useState('zh');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 1. 尝试从 localStorage 读取
    const savedLanguage = localStorage.getItem('language');
    
    if (savedLanguage) {
      // 映射旧值
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedLanguage === 'english') setLanguage('en');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      else if (savedLanguage === 'chinese') setLanguage('zh');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      else if (translations[savedLanguage]) setLanguage(savedLanguage);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      else setLanguage('en'); // Fallback
    } else {
      // 2. 如果没有保存的语言，尝试检测浏览器语言
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('zh')) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLanguage('zh');
      } else if (browserLang.startsWith('fr')) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLanguage('fr');
      } else if (browserLang.startsWith('ru')) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLanguage('ru');
      } else if (browserLang.startsWith('es')) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLanguage('es');
      } else if (browserLang.startsWith('ar')) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLanguage('ar');
      } else if (browserLang.startsWith('pt')) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLanguage('pt');
      } else if (browserLang.startsWith('de')) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLanguage('de');
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLanguage('en');
      }
    }
    setIsLoaded(true);
  }, []);

  const changeLanguage = (lang) => {
    let newLang = lang;
    if (lang === 'english') newLang = 'en';
    else if (lang === 'chinese') newLang = 'zh';

    if (translations[newLang]) {
      setLanguage(newLang);
      localStorage.setItem('language', newLang);
      
      // Update document direction for Arabic
      if (newLang === 'ar') {
        document.documentElement.dir = 'rtl';
        document.documentElement.lang = 'ar';
      } else {
        document.documentElement.dir = 'ltr';
        document.documentElement.lang = newLang;
      }
    }
  };

  const t = (key, params = {}) => {
    const currentTranslations = translations[language] || translations['en'];
    let text = currentTranslations[key] || translations['en'][key] || key;

    // 简单的参数替换 {param}
    Object.keys(params).forEach(param => {
      text = text.replace(new RegExp(`{${param}}`, 'g'), params[param]);
    });

    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, isLoaded }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
