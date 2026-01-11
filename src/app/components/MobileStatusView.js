import React, { useState, useEffect } from 'react';
import SwipeCheckIn from './SwipeCheckIn';

const MobileStatusView = ({ currentDate, status, onStatusChange, t, language }) => {
  // Format date: "Monday, Jan 11"
  const dateOptions = { weekday: 'long', month: 'short', day: 'numeric' };
  
  const localeMap = {
    en: 'en-US',
    zh: 'zh-CN',
    fr: 'fr-FR',
    ru: 'ru-RU',
    es: 'es-ES',
    ar: 'ar-SA',
    pt: 'pt-PT',
    de: 'de-DE',
    ja: 'ja-JP',
    ko: 'ko-KR'
  };

  const locale = localeMap[language] || language || 'en-US';
  const dateStr = currentDate.toLocaleDateString(locale, dateOptions);

  const isOffice = status.am === 'office';
  const isRemote = status.am === 'remote';
  const isNone = !isOffice && !isRemote;

  const [stampAnim, setStampAnim] = useState(null); // 'office' or 'remote' or null
  const [funText, setFunText] = useState('');

  const getFunText = (key, defaultVal) => {
      const val = t(key);
      // If t returns the key itself, it means translation is missing
      return val === key ? defaultVal : val;
  };

  // Fun texts
  const officeTexts = [
    getFunText('fun_office_1', "Brick moving day! 🧱"),
    getFunText('fun_office_2', "Full energy! ⚡"),
    getFunText('fun_office_3', "Office vibes 🏢"),
    getFunText('fun_office_4', "Hustle mode on 💼"),
    t('fun_office_5') === 'fun_office_5' ? "Meeting marathon? 🏃‍♂️" : t('fun_office_5'),
    t('fun_office_6') === 'fun_office_6' ? "Coffee is ready! ☕" : t('fun_office_6'),
    t('fun_office_7') === 'fun_office_7' ? "Team power! 🤝" : t('fun_office_7'),
    t('fun_office_8') === 'fun_office_8' ? "Let's get things done! ✅" : t('fun_office_8'),
    t('fun_office_9') === 'fun_office_9' ? "Office sweet office? 🤔" : t('fun_office_9'),
    t('fun_office_10') === 'fun_office_10' ? "Commuting warrior 🚇" : t('fun_office_10')
  ];
  const remoteTexts = [
    getFunText('fun_remote_1', "Home sweet office 🏠"),
    getFunText('fun_remote_2', "Cozy coding ☕"),
    getFunText('fun_remote_3', "Focus time 🎧"),
    getFunText('fun_remote_4', "Pajama power 👕"),
    t('fun_remote_5') === 'fun_remote_5' ? "No commute today! 🚫🚗" : t('fun_remote_5'),
    t('fun_remote_6') === 'fun_remote_6' ? "Work from sofa 🛋️" : t('fun_remote_6'),
    t('fun_remote_7') === 'fun_remote_7' ? "Cat is my coworker 🐱" : t('fun_remote_7'),
    t('fun_remote_8') === 'fun_remote_8' ? "Zoom zoom zoom 📹" : t('fun_remote_8'),
    t('fun_remote_9') === 'fun_remote_9' ? "Silent mode on 🔕" : t('fun_remote_9'),
    t('fun_remote_10') === 'fun_remote_10' ? "Home cooked lunch 🥗" : t('fun_remote_10')
  ];
  const defaultText = getFunText('fun_default', "Where are you today?");

  useEffect(() => {
    if (isOffice) {
        setFunText(officeTexts[Math.floor(Math.random() * officeTexts.length)]);
    } else if (isRemote) {
        setFunText(remoteTexts[Math.floor(Math.random() * remoteTexts.length)]);
    } else {
        setFunText(defaultText);
    }
  }, [isOffice, isRemote]);

  const handleSwipeLeft = () => {
    // Remote
    if (!isRemote) {
        onStatusChange({ am: 'remote', pm: 'remote' });
        triggerStamp('remote');
    }
  };

  const handleSwipeRight = () => {
    // Office
    if (!isOffice) {
        onStatusChange({ am: 'office', pm: 'office' });
        triggerStamp('office');
    }
  };

  const triggerStamp = (type) => {
    setStampAnim(null);
    // Force reflow
    setTimeout(() => setStampAnim(type), 10);
    // Reset after animation
    setTimeout(() => setStampAnim(null), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Background Decor (Optional) */}
      <div className={`absolute inset-0 transition-colors duration-500 opacity-10 ${
          isOffice ? 'bg-success' : isRemote ? 'bg-primary' : 'bg-transparent'
      }`}></div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-10 z-10">
        
        {/* Date & Greeting */}
        <div className="text-center space-y-2">
          <h2 className="text-sm font-bold tracking-widest text-subtle uppercase">{t('today') || 'TODAY'}</h2>
          <h1 className="text-3xl font-black text-foreground">{dateStr}</h1>
        </div>

        {/* Status Card / Icon */}
        <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Stamp Animation Overlay */}
            {stampAnim && (
                <div className="absolute inset-0 z-20 flex items-center justify-center animate-stamp pointer-events-none">
                    <div className={`
                        border-4 rounded-full w-48 h-48 flex items-center justify-center transform -rotate-12 bg-card/80 backdrop-blur-sm shadow-xl
                        ${stampAnim === 'office' ? 'border-success text-success' : 'border-primary text-primary'}
                    `}>
                        <span className="text-4xl font-black uppercase tracking-widest opacity-90">
                            {stampAnim === 'office' ? (t('office') || 'OFFICE') : (t('remote') || 'REMOTE')}
                        </span>
                    </div>
                </div>
            )}

            {/* Central Visual */}
            <div className={`
                w-48 h-48 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-2xl
                ${isOffice 
                    ? 'bg-gradient-to-br from-success/20 to-success/5 shadow-success/20 scale-110' 
                    : isRemote 
                        ? 'bg-gradient-to-br from-primary/20 to-primary/5 shadow-primary/20 scale-110'
                        : 'bg-card border-2 border-dashed border-border'
                }
            `}>
                {isOffice ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-success drop-shadow-sm">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                ) : isRemote ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary drop-shadow-sm">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                ) : (
                    <span className="text-4xl">🤔</span>
                )}
            </div>
        </div>

        {/* Fun Text */}
        <div className="h-8">
            <p className={`text-lg font-medium text-center transition-all duration-500 ${
                isOffice ? 'text-success' : isRemote ? 'text-primary' : 'text-subtle'
            }`}>
                {funText}
            </p>
        </div>

        {/* Swipe Control */}
        <div className="w-full flex flex-col items-center gap-4">
            <SwipeCheckIn 
                onSwipeLeft={handleSwipeLeft} 
                onSwipeRight={handleSwipeRight}
                t={t}
            />
            <p className="text-xs text-subtle opacity-60">
                {t('swipe_hint') || '< Slide to check in >'}
            </p>
        </div>

      </div>

      {/* Bottom Hint */}
      <div className="pb-8 text-center animate-pulse">
        <div className="flex items-center justify-center gap-2 text-subtle text-sm">
            <span>{t('calendar_view') || 'Calendar'}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"></path>
                <path d="M12 5l7 7-7 7"></path>
            </svg>
        </div>
      </div>
    </div>
  );
};

export default MobileStatusView;
