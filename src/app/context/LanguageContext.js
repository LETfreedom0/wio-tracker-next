'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from '../../lib/i18n/locales/en';
import { zh } from '../../lib/i18n/locales/zh';

const LanguageContext = createContext();

const translations = {
  en,
  zh,
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
      else setLanguage(savedLanguage);
    } else {
      // 2. 如果没有保存的语言，尝试检测浏览器语言
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('zh')) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLanguage('zh');
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLanguage('en');
      }
    }
    setIsLoaded(true);
  }, []);

  const changeLanguage = (lang) => {
    const newLang = lang === 'english' ? 'en' : (lang === 'chinese' ? 'zh' : lang);
    setLanguage(newLang);
    
    // 保存到 localStorage，保持与现有逻辑兼容，存储 'english' 或 'chinese'
    // 或者我们统一迁移到 'en'/'zh'。为了最小化对现有 Settings 页面的破坏，
    // 我们这里存储转换后的值，但在 Settings 页面保存时可能需要注意。
    // 实际上 Settings 页面是自己独立写 localStorage 的。
    // 为了保持一致，我们这里也更新 localStorage。
    const legacyLang = newLang === 'en' ? 'english' : 'chinese';
    localStorage.setItem('language', legacyLang);
  };

  const t = (key, params = {}) => {
    const currentTranslations = translations[language] || translations['en'];
    let text = currentTranslations[key] || key;

    // 简单的参数替换 {param}
    Object.keys(params).forEach(param => {
      text = text.replace(new RegExp(`{${param}}`, 'g'), params[param]);
    });

    return text;
  };

  // 避免水合不匹配，初始渲染时不显示或显示默认
  // 但为了SEO和体验，通常最好是服务端也能确定语言。
  // 鉴于这是纯客户端 Context，我们接受初始闪烁或默认值。
  // 这里直接返回 children，但在 useEffect 中更新语言会触发重渲染。

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
