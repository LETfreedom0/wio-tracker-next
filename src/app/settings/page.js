'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Navigation from '../components/Navigation';
import Input from '../components/Input';
import { useLanguage } from '../context/LanguageContext';

export default function Settings() {
  const [wioTarget, setWioTarget] = useState('');
  const [annualLeaveQuota, setAnnualLeaveQuota] = useState('');
  const [sickLeaveQuota, setSickLeaveQuota] = useState('');
  const { t, language, changeLanguage } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);

  // 加载保存的设置
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      loadSettings(user);
    };

    checkUser();
  }, []);

  const loadSettings = async (currentUser) => {
    // 1. 优先从本地加载
    const savedTarget = localStorage.getItem('wioTarget');
    const savedAnnualLeave = localStorage.getItem('annualLeaveQuota');
    const savedSickLeave = localStorage.getItem('sickLeaveQuota');
    // Language is handled by Context

    // 只要有任意一个配置项在本地存在，就认为本地有数据
    // 注意：这里用 !== null 判断，因为空字符串也是有效值（虽然会被解析为0）
    const hasLocalSettings = savedTarget !== null || savedAnnualLeave !== null || savedSickLeave !== null;

    if (hasLocalSettings) {
      if (savedTarget !== null) setWioTarget(savedTarget);
      if (savedAnnualLeave !== null) setAnnualLeaveQuota(savedAnnualLeave);
      if (savedSickLeave !== null) setSickLeaveQuota(savedSickLeave);
      // 如果本地有数据，就不从数据库加载了，直接返回
      return; 
    }

    // 2. 如果本地没有数据，且用户已登录，从数据库加载
    if (currentUser) {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();
        
        if (data) {
          setWioTarget(data.wio_target ?? '');
          setAnnualLeaveQuota(data.annual_leave_quota ?? '');
          setSickLeaveQuota(data.sick_leave_quota ?? '');
          changeLanguage(data.language || 'english');

          // 可选：将数据库的数据同步到本地，以便下次可以直接从本地读取
          localStorage.setItem('wioTarget', data.wio_target ?? '');
          localStorage.setItem('annualLeaveQuota', data.annual_leave_quota ?? '');
          localStorage.setItem('sickLeaveQuota', data.sick_leave_quota ?? '');
          // Language is saved to local storage by Context when changed
        }
      } catch (error) {
        console.error('加载设置失败:', error);
      }
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // 转换数值，空字符串转为 0 或 null，避免发送空字符串给整数列
      const targetValue = wioTarget === '' ? 0 : parseInt(wioTarget);
      const annualQuotaValue = annualLeaveQuota === '' ? 0 : parseInt(annualLeaveQuota);
      const sickQuotaValue = sickLeaveQuota === '' ? 0 : parseInt(sickLeaveQuota);

      if (user) {
        const { error } = await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            wio_target: targetValue,
            annual_leave_quota: annualQuotaValue,
            sick_leave_quota: sickQuotaValue,
            language: language,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
        
        if (error) throw error;
      }
      
      // 无论是否登录，都保存到本地，以满足"优先从本地加载"的需求
      localStorage.setItem('wioTarget', wioTarget);
      localStorage.setItem('annualLeaveQuota', annualLeaveQuota);
      localStorage.setItem('sickLeaveQuota', sickLeaveQuota);
      localStorage.setItem('language', language);
      
      alert('设置已保存！');
    } catch (error) {
      console.error('保存设置失败:', error);
      alert(`保存设置失败: ${error.message || '未知错误'}\n详情请查看控制台。`);
      // 回退到localStorage
      localStorage.setItem('wioTarget', wioTarget);
      localStorage.setItem('annualLeaveQuota', annualLeaveQuota);
      localStorage.setItem('sickLeaveQuota', sickLeaveQuota);
      localStorage.setItem('language', language);
      alert('保存设置失败，已保存到本地存储！');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background font-display text-foreground">
      <Navigation />
      
      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center py-4 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl space-y-4 sm:space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">{t('settings_title')}</h2>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-subtle">{t('settings_desc')}</p>
            </div>
            <Link href="/" className="md:hidden flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors bg-primary/10 px-3 py-1.5 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              {t('back')}
            </Link>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 mt-0.5">info</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {user ? t('data_synced_title') : t('data_local_title')}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                {user 
                  ? t('data_synced_desc')
                  : t('data_local_desc')}
              </p>
            </div>
          </div>

          {/* Settings Form */}
          <div className="bg-card p-4 sm:p-6 rounded-xl shadow-sm border border-border space-y-4 sm:space-y-6">
            {/* WIO Target Section */}
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-foreground">{t('wio_target_title')}</h3>
              <div className="max-w-md">
                <Input
                  label={t('wio_target_label')}
                  id="wio-target"
                  placeholder={t('wio_target_placeholder')}
                  type="number"
                  value={wioTarget}
                  onChange={(e) => setWioTarget(e.target.value)}
                />
              </div>
            </div>

            <div className="border-t border-border"></div>

            {/* Leave Quota Section */}
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-foreground">{t('leave_quota_title')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <Input
                  label={t('annual_leave_quota_label')}
                  id="annual-leave-quota"
                  placeholder={t('annual_leave_placeholder')}
                  type="number"
                  value={annualLeaveQuota}
                  onChange={(e) => setAnnualLeaveQuota(e.target.value)}
                />
                <Input
                  label={t('sick_leave_quota_label')}
                  id="sick-leave-quota"
                  placeholder={t('sick_leave_placeholder')}
                  type="number"
                  value={sickLeaveQuota}
                  onChange={(e) => setSickLeaveQuota(e.target.value)}
                />
              </div>
            </div>

            <div className="border-t border-border"></div>

            {/* Language Section */}
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-foreground">{t('language_title')}</h3>
              <fieldset>
                <legend className="sr-only">Language selection</legend>
                <div className="flex flex-wrap gap-3">
                  <label className={`relative flex items-center justify-center px-5 py-3 rounded-lg border cursor-pointer transition-all duration-200 ${language === 'en' ? 'border-primary ring-2 ring-primary/50' : 'border-border hover:border-primary/50'} bg-card`}>
                    <input
                      className="absolute h-full w-full opacity-0 cursor-pointer"
                      name="language"
                      type="radio"
                      value="en"
                      checked={language === 'en'}
                      onChange={(e) => changeLanguage(e.target.value)}
                    />
                    <span className="text-sm font-medium text-foreground">{t('english')}</span>
                  </label>
                  <label className={`relative flex items-center justify-center px-5 py-3 rounded-lg border cursor-pointer transition-all duration-200 ${language === 'zh' ? 'border-primary ring-2 ring-primary/50' : 'border-border hover:border-primary/50'} bg-card`}>
                    <input
                      className="absolute h-full w-full opacity-0 cursor-pointer"
                      name="language"
                      type="radio"
                      value="zh"
                      checked={language === 'zh'}
                      onChange={(e) => changeLanguage(e.target.value)}
                    />
                    <span className="text-sm font-medium text-foreground">{t('chinese')}</span>
                  </label>
                </div>
              </fieldset>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? t('saving') : t('save_changes')}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
