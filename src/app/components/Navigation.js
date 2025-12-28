'use client';

import React, { useState, useEffect, Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { useRouter, usePathname } from 'next/navigation';
import { useLanguage } from '../context/LanguageContext';
import { SUPPORT_EMAIL } from '../../lib/constants';

export default function Navigation() {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const pathname = usePathname();
  const { t, language, changeLanguage } = useLanguage();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2" aria-label="WIO Tracker Home">
              <div className="text-primary size-7" aria-hidden="true">
                <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z" fill="currentColor"></path>
                </svg>
              </div>
              <h1 className="text-lg font-bold text-foreground">WIO Tracker</h1>
            </Link>
            <nav className="hidden md:flex items-center gap-4" role="navigation">
              <Link href="/" className={`text-sm font-medium ${pathname === '/' ? 'text-primary' : 'text-subtle hover:text-primary transition-colors'}`}>{t('home')}</Link>
              <Link href="/settings" className={`text-sm font-medium ${pathname === '/settings' ? 'text-primary' : 'text-subtle hover:text-primary transition-colors'}`}>{t('settings')}</Link>
              <Link href={`mailto:${SUPPORT_EMAIL}?subject=WIO Tracker Feedback`} className="text-sm font-medium text-subtle hover:text-primary transition-colors">{t('contact_author')}</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href={`mailto:${SUPPORT_EMAIL}?subject=WIO Tracker Feedback`} className="md:hidden text-subtle hover:text-primary transition-colors p-1" title={t('contact_author')} aria-label={t('contact_author')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
              </svg>
            </Link>
            <Link href="/settings" className={`md:hidden ${pathname === '/settings' ? 'text-primary' : 'text-subtle hover:text-primary transition-colors'} p-1`} title={t('settings')} aria-label={t('settings')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </Link>
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-subtle hidden md:block">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-subtle hover:text-primary transition-colors"
                >
                  {t('logout')}
                </button>
              </div>
            ) : (
              <Link href="/login" className="text-sm font-medium text-subtle hover:text-primary transition-colors">
                {t('login')}
              </Link>
            )}

            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center text-subtle hover:text-primary transition-colors p-1" aria-label="Change Language">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-20 mt-2 w-40 origin-top-right rounded-md bg-card py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-border overflow-y-auto max-h-96">
                  {[
                    { code: 'en', label: 'English' },
                    { code: 'zh', label: '中文' },
                    { code: 'fr', label: 'Français' },
                    { code: 'ru', label: 'Русский' },
                    { code: 'es', label: 'Español' },
                    { code: 'ar', label: 'العربية' },
                    { code: 'pt', label: 'Português' },
                    { code: 'de', label: 'Deutsch' },
                  ].map((langOption) => (
                    <Menu.Item key={langOption.code}>
                      {({ active }) => (
                        <button
                          onClick={() => changeLanguage(langOption.code)}
                          className={`${
                            active ? 'bg-primary/10' : ''
                          } ${language === langOption.code ? 'font-bold text-primary' : 'text-foreground'} block px-4 py-2 text-sm w-full text-left`}
                        >
                          {langOption.label}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </Menu.Items>
              </Transition>
            </Menu>

            <div className="flex items-center gap-2 text-sm text-subtle">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
              <span className="text-subtle hidden sm:inline">{user ? t('data_synced') : t('data_local')}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
