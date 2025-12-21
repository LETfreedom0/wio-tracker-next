'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Navigation from '../components/Navigation';
import Input from '../components/Input';
import { useLanguage } from '../context/LanguageContext';
import { countries } from '../../lib/countries';
import { GlobeAltIcon, UserIcon, StarIcon, EnvelopeIcon } from '@heroicons/react/24/solid';
import { encodeStatus } from '../../lib/constants';

export default function Settings() {
  const [wioTarget, setWioTarget] = useState('');
  const [annualLeaveQuota, setAnnualLeaveQuota] = useState('');
  const [sickLeaveQuota, setSickLeaveQuota] = useState('');
  // publicHolidayQuota removed from state as it's not editable nor stored in DB
  const [username, setUsername] = useState('');
  const [country, setCountry] = useState('');
  const [membershipTier, setMembershipTier] = useState('free');
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
    // public_holiday_quota removed from DB
    const savedCountry = localStorage.getItem('country');
    const savedUsername = localStorage.getItem('username');
    // Language is handled by Context

    // 只要有任意一个配置项在本地存在，就认为本地有数据
    // 注意：这里用 !== null 判断，因为空字符串也是有效值（虽然会被解析为0）
    const hasLocalSettings = savedTarget !== null || savedAnnualLeave !== null || savedSickLeave !== null || savedCountry !== null || savedUsername !== null;

    if (hasLocalSettings) {
      if (savedTarget !== null) setWioTarget(savedTarget);
      if (savedAnnualLeave !== null) setAnnualLeaveQuota(savedAnnualLeave);
      if (savedSickLeave !== null) setSickLeaveQuota(savedSickLeave);
      // public_holiday_quota removed
      if (savedCountry !== null) setCountry(savedCountry);
      if (savedUsername !== null) setUsername(savedUsername);
      
      // 注意：这里不再直接 return。
      // 如果用户已登录，我们依然尝试从数据库加载最新数据以保持同步。
      // 这解决了"本地有部分旧数据导致无法显示云端用户名"的问题。
    }

    // 2. 如果用户已登录，从数据库加载（会覆盖本地的旧数据，实现同步）
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
          // public_holiday_quota removed from DB
          setUsername(data.username || currentUser.user_metadata?.username || '');
          setCountry(data.country || currentUser.user_metadata?.country || ''); // Use fetched country
          setMembershipTier(data.membership_tier || 'free');
          changeLanguage(data.language || 'english');

          // 可选：将数据库的数据同步到本地，以便下次可以直接从本地读取
          localStorage.setItem('wioTarget', data.wio_target ?? '');
          localStorage.setItem('annualLeaveQuota', data.annual_leave_quota ?? '');
          localStorage.setItem('sickLeaveQuota', data.sick_leave_quota ?? '');
          // public_holiday_quota removed from DB
          localStorage.setItem('country', data.country || '');
          localStorage.setItem('username', data.username || currentUser.user_metadata?.username || '');
          // Language is saved to local storage by Context when changed
        }
      } catch (error) {
        // PGRST116: JSON object requested, multiple (or no) rows returned
        if (error.code === 'PGRST116') {
           // No settings found in DB, try to populate from user metadata
           setUsername(currentUser.user_metadata?.username || '');
           setCountry(currentUser.user_metadata?.country || '');
        } else {
           console.error('加载设置失败:', error);
        }
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
      // publicHolidayQuota is now calculated automatically, not from input

      // 3. Update DB 'calendar_data' - Clear OLD public holidays for this user first!
      // This ensures we comply with "do not store public holidays in DB" requirement.
      // We must delete all existing 'public_holiday' (status=7) entries for this user from the DB.
      if (user) {
        // Status 7 = Public Holiday
        const { error: deleteError } = await supabase
            .from('calendar_data')
            .delete()
            .eq('user_id', user.id)
            .eq('status', 7); // 7 is PUBLIC_HOLIDAY

        if (deleteError) {
             console.error('Failed to clear old holidays:', deleteError);
        } else {
             console.log('Successfully cleared old holidays from DB.');
        }

        const { error } = await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            wio_target: targetValue,
            annual_leave_quota: annualQuotaValue,
            sick_leave_quota: sickQuotaValue,
            // public_holiday_quota removed from DB schema requirement
            username: username || null,
            country: country || null,
            language: language,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
        
        if (error) throw error;
      }
      
      // 无论是否登录，都保存到本地，以满足"优先从本地加载"的需求
      localStorage.setItem('wioTarget', wioTarget);
      localStorage.setItem('annualLeaveQuota', annualLeaveQuota);
      localStorage.setItem('sickLeaveQuota', sickLeaveQuota);
      // Public holiday quota is calculated on the fly, no need to store
      
      localStorage.setItem('language', language);
      localStorage.setItem('country', country);
      localStorage.setItem('username', username);
      
      // 清理本地 attendanceData 中的 public_holiday 数据
      const savedAttendance = localStorage.getItem('attendanceData');
      if (savedAttendance) {
          let attendance = JSON.parse(savedAttendance);
          let changed = false;
          Object.keys(attendance).forEach(key => {
              // 移除纯公共假期记录
              if (attendance[key].am === 'public_holiday' && attendance[key].pm === 'public_holiday') {
                  delete attendance[key];
                  changed = true;
              } else {
                  // 如果只有半天是 public_holiday，也清理掉该状态（设为 none 或保留另一半）
                  // 简单起见，如果包含 public_holiday，就将其置为 none（除非用户手动操作过，但这里很难区分）
                  // 鉴于 page.js 里的逻辑是忽略 public_holiday，这里清理干净更好。
                  if (attendance[key].am === 'public_holiday') {
                      attendance[key].am = 'none';
                      changed = true;
                  }
                  if (attendance[key].pm === 'public_holiday') {
                      attendance[key].pm = 'none';
                      changed = true;
                  }
                  if (attendance[key].am === 'none' && attendance[key].pm === 'none') {
                      delete attendance[key];
                      changed = true;
                  }
              }
          });
          if (changed) {
              localStorage.setItem('attendanceData', JSON.stringify(attendance));
          }
      }
      
      alert('设置已保存！');
    } catch (error) {
      console.error('保存设置失败:', error);
      alert(`保存设置失败: ${error.message || '未知错误'}\n详情请查看控制台。`);
      // 回退到localStorage
      localStorage.setItem('wioTarget', wioTarget);
      localStorage.setItem('annualLeaveQuota', annualLeaveQuota);
      localStorage.setItem('sickLeaveQuota', sickLeaveQuota);
      localStorage.setItem('language', language);
      localStorage.setItem('country', country);
      alert('保存设置失败，已保存到本地存储！');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    try {
      const savedAttendance = localStorage.getItem('attendanceData');
      const savedOt = localStorage.getItem('otData');
      
      const attendance = savedAttendance ? JSON.parse(savedAttendance) : {};
      const ot = savedOt ? JSON.parse(savedOt) : {};
      
      // 获取所有唯一的日期 Key
      const allDates = new Set([...Object.keys(attendance), ...Object.keys(ot)]);
      const sortedDates = Array.from(allDates).sort(); // YYYY-MM-DD 排序自然正确
      
      if (sortedDates.length === 0) {
        alert(language === 'zh' ? '没有数据可导出' : 'No data to export');
        return;
      }
      
      // CSV Header
      let csvContent = "Date,AM Status,PM Status,OT Hours\n";
      
      sortedDates.forEach(date => {
        const status = attendance[date] || { am: 'none', pm: 'none' };
        const otHours = ot[date] || 0;
        
        csvContent += `${date},${status.am},${status.pm},${otHours}\n`;
      });
      
      // 创建 Blob 并下载
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `wio_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed');
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
            {/* User Profile Section (Read Only / Edit via Auth Update if implemented, here just display or edit if DB supported) */}
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-foreground">{t('settings_profile_title') || 'Profile'}</h3>
              
              {/* Membership Badge */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full text-primary">
                  <StarIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-subtle uppercase tracking-wider">{t('membership_status') || 'Current Plan'}</p>
                  <p className="font-bold text-foreground capitalize">
                    {membershipTier === 'free' ? (t('membership_free') || 'Free Plan') : 
                     membershipTier === 'pro' ? (t('membership_pro') || 'Pro Plan') : 
                     (t('membership_premium') || 'Premium Plan')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                 {/* Email Field - Read Only */}
                 <div className="relative md:col-span-2">
                    <label className="block text-sm font-medium text-subtle mb-1">
                      {t('email_placeholder')}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={user?.email || ''}
                        disabled
                        className="appearance-none rounded-md relative block w-full px-3 py-2 pr-10 border border-border text-subtle bg-gray-100 sm:text-sm cursor-not-allowed"
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-subtle">
                        <EnvelopeIcon className="h-4 w-4" aria-hidden="true" />
                      </div>
                    </div>
                 </div>

                 <div className="relative">
                    <label htmlFor="username" className="block text-sm font-medium text-subtle mb-1">
                      {t('username_placeholder')}
                    </label>
                    <div className="relative">
                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="appearance-none rounded-md relative block w-full px-3 py-2 pr-10 border border-border placeholder-subtle text-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-background"
                      />
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-subtle">
                        <UserIcon className="h-4 w-4" aria-hidden="true" />
                      </div>
                    </div>
                 </div>

                 <div className="relative">
                    <label htmlFor="country" className="block text-sm font-medium text-subtle mb-1">
                      {t('country_label')}
                    </label>
                    <div className="relative">
                      <select
                        id="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-border placeholder-subtle text-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-background"
                      >
                        <option value="">{t('country_placeholder')}</option>
                        {countries.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-subtle">
                        <GlobeAltIcon className="h-4 w-4" aria-hidden="true" />
                      </div>
                    </div>
                 </div>
              </div>
            </div>

            <div className="border-t border-border"></div>

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
                {/* Public Holiday Quota is calculated automatically, no input needed */}
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

            <div className="border-t border-border"></div>

            {/* Export Section */}
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-base sm:text-lg font-bold text-foreground">{t('export_data_title')}</h3>
              <p className="text-sm text-subtle">{t('export_data_desc')}</p>
              <button
                onClick={handleExport}
                className="flex items-center justify-center px-4 py-2 rounded-lg border border-border hover:bg-primary/5 hover:border-primary transition-colors text-sm font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                {t('export_btn')}
              </button>
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
