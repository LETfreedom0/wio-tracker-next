'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Navigation from './components/Navigation';
import ShareModal from './components/ShareModal';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from './context/LanguageContext';
import { STATUS_CODES, CODE_TO_KEY, KEY_TO_CODE, decodeStatus, encodeStatus } from '../lib/constants';
import { getHolidayData } from '../lib/holidays';

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState({});
  const [otData, setOtData] = useState({});
  const [wioTarget, setWioTarget] = useState(80);
  const [annualQuota, setAnnualQuota] = useState(0);
  const [sickQuota, setSickQuota] = useState(0);
  const [publicHolidays, setPublicHolidays] = useState({});
  const [country, setCountry] = useState('');
  // publicHolidayQuota removed from state
  const [selectedLegend, setSelectedLegend] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Combined Legend State
  const [showCombinedConfig, setShowCombinedConfig] = useState(false);
  const [combinedConfig, setCombinedConfig] = useState({ am: 'office', pm: 'remote' });
  
  // OT Modal State
  const [showOtModal, setShowOtModal] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [currentOtDate, setCurrentOtDate] = useState(null);
  const [otDurationInput, setOtDurationInput] = useState('1');
  const [showHelp, setShowHelp] = useState(false);
  const { t, language } = useLanguage();

  // 初始化加载
  useEffect(() => {
    const init = async () => {
      // 优先加载本地数据，实现秒开体验
      loadDataFromLocal();

      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        await loadDataFromSupabase(user);
      }
      // 如果没有用户，loadDataFromLocal 已经处理了显示
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadDataFromSupabase(session.user);
      } else {
        loadDataFromLocal();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadDataFromLocal = () => {
    const savedAttendance = localStorage.getItem('attendanceData');
    if (savedAttendance) {
      const parsed = JSON.parse(savedAttendance);
      // Migrate old string format to new object format if needed
      const migrated = {};
      Object.entries(parsed).forEach(([key, val]) => {
        if (typeof val === 'string') {
          migrated[key] = { am: val, pm: val };
        } else {
          migrated[key] = val;
        }
      });
      setAttendanceData(migrated);
    }
    const savedOt = localStorage.getItem('otData');
    if (savedOt) {
      setOtData(JSON.parse(savedOt));
    }
    const savedTarget = localStorage.getItem('wioTarget');
    if (savedTarget) {
      setWioTarget(Number(savedTarget));
    }
    const savedAnnual = localStorage.getItem('annualLeaveQuota');
    if (savedAnnual) setAnnualQuota(Number(savedAnnual));
    const savedSick = localStorage.getItem('sickLeaveQuota');
    if (savedSick) setSickQuota(Number(savedSick));
    // publicHolidayQuota removed from local storage load
    const savedCountry = localStorage.getItem('country');
    if (savedCountry) setCountry(savedCountry);
  };

  /**
   * 从 Supabase 加载用户数据
   * 包括用户设置和日历考勤数据
   * 优化：并行加载数据以减少等待时间
   * @param {Object} currentUser - 当前登录用户对象
   */
  const loadDataFromSupabase = async (currentUser) => {
    setLoading(true);
    try {
      // 并行发起请求，避免串行等待
      const settingsPromise = supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      // 添加 limit 以避免默认的 1000 条限制，并按日期倒序排列确保获取最新数据
      const calendarPromise = supabase
        .from('calendar_data')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('date', { ascending: false })
        .limit(5000);

      const [
        { data: settingsData },
        { data: calendarDataDB, error: calendarError }
      ] = await Promise.all([settingsPromise, calendarPromise]);

      // 处理设置数据
      if (settingsData) {
        setWioTarget(settingsData.wio_target);
        setAnnualQuota(settingsData.annual_leave_quota || 0);
        setSickQuota(settingsData.sick_leave_quota || 0);
        // publicHolidayQuota removed from DB load
        if (settingsData.country) setCountry(settingsData.country);
        
        // Sync quotas to local
        localStorage.setItem('annualLeaveQuota', settingsData.annual_leave_quota || 0);
        localStorage.setItem('sickLeaveQuota', settingsData.sick_leave_quota || 0);
        // publicHolidayQuota removed from local storage sync
        localStorage.setItem('wioTarget', settingsData.wio_target);
        if (settingsData.country) localStorage.setItem('country', settingsData.country);
      }

      // 处理日历数据
      if (calendarError) throw calendarError;

      if (calendarDataDB) {
        const newAttendance = {};
        const newOt = {};
        calendarDataDB.forEach(record => {
          // 格式化日期 Key 以匹配前端逻辑 (去除前导零)
          const [y, m, d] = record.date.split('-');
          // 注意：Supabase 中存的 m 是 1-12，前端 Key 中用的 m 是 0-11
          const dateKey = `${parseInt(y)}-${parseInt(m) - 1}-${parseInt(d)}`;

          let status = record.status;
          
          // 如果是数字，转换为对应的对象状态
          if (typeof status === 'number') {
            const statusObj = decodeStatus(status);
            if (statusObj.am !== 'none' || statusObj.pm !== 'none') {
              newAttendance[dateKey] = statusObj;
            }
          }
          // 兼容旧的 JSONB 格式（如果数据库中还残留有旧数据）
          else if (typeof status === 'object' && status !== null && status.value) {
            const val = status.value;
            newAttendance[dateKey] = { am: val, pm: val };
          }
          
          // OT Logic: Store minutes
          if (record.ot > 0) {
            newOt[dateKey] = record.ot;
          }
        });
        setAttendanceData(newAttendance);
        setOtData(newOt);

        // 同步更新本地缓存，以便下次打开时能秒开
        localStorage.setItem('attendanceData', JSON.stringify(newAttendance));
        localStorage.setItem('otData', JSON.stringify(newOt));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load public holidays when country changes
  useEffect(() => {
    if (!country) return;

    const fetchHolidays = async () => {
      const currentYear = new Date().getFullYear();
      const years = [currentYear - 1, currentYear, currentYear + 1];
      let allHolidays = {};

      await Promise.all(years.map(async (year) => {
        const holidays = await getHolidayData(country, year);
        if (holidays) {
            holidays.forEach(h => {
                let dateStr = h.date;
                 if (typeof dateStr !== 'string') {
                       try {
                           dateStr = dateStr.toISOString().split('T')[0];
                       } catch (e) {
                           return;
                       }
                 } else {
                       dateStr = dateStr.split(' ')[0];
                 }
                 const [y, m, d] = dateStr.split('-').map(Number);
                 const dateKey = `${y}-${m - 1}-${d}`;
                 allHolidays[dateKey] = h;
            });
        }
      }));
      setPublicHolidays(prev => ({ ...prev, ...allHolidays }));
    };

    fetchHolidays();
  }, [country]);

  // 获取当前月份的天数
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  // 获取月份第一天是星期几
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // 获取日期状态
  const getDateStatus = useCallback((day) => {
    // 构造 Key 必须和设置页面生成假期时一致: YYYY-M-D
    // currentDate.getMonth() 返回 0-11，刚好符合
    const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
    const userStatus = attendanceData[dateKey];

    // 如果用户有显式设置（且不是 public_holiday），则优先显示用户设置
    if (userStatus && userStatus.am !== 'none' && userStatus.am !== 'public_holiday') {
        return userStatus;
    }

    // 检查公共假期
    if (publicHolidays[dateKey]) {
        return { am: 'public_holiday', pm: 'public_holiday', name: publicHolidays[dateKey].name };
    }
    
    return { am: 'none', pm: 'none' };
  }, [currentDate, attendanceData, publicHolidays]);

  // 获取加班状态
  const getOtStatus = (day) => {
    const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
    return otData[dateKey];
  };

  // 切换日期状态
  const toggleDateStatus = (day) => {
    const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
    let newValue;

    // 如果选择了图例，则直接应用该状态
    if (selectedLegend) {
      if (selectedLegend === 'ot') {
        setCurrentOtDate(day);
        setOtDurationInput(otData[dateKey] ? String(otData[dateKey]) : '1');
        setShowOtModal(true);
        return;
      } 
      
      if (selectedLegend === 'none') {
        newValue = { am: 'none', pm: 'none' };
      } else if (typeof selectedLegend === 'object') {
           newValue = selectedLegend;
      } else {
           newValue = { am: selectedLegend, pm: selectedLegend };
      }
      
      // Check if toggle needed (only if not 'none' logic, or maybe always apply?)
      // User asked for "Clear" marker.
      // If clicking with "Clear" (none), we force it to none.
      // If clicking with others, we might toggle off if same?
      // The original code toggles off if same.
      const current = attendanceData[dateKey];
      if (selectedLegend !== 'none' && current && current.am === newValue.am && current.pm === newValue.pm) {
           newValue = { am: 'none', pm: 'none' };
      }

      const newAttendance = {
        ...attendanceData,
        [dateKey]: newValue
      };

      setAttendanceData(newAttendance);
      localStorage.setItem('attendanceData', JSON.stringify(newAttendance));
      
      if (user) {
        saveStatusToSupabase(dateKey, newValue, otData[dateKey]);
      }
      return;
    }

    const statuses = ['none', 'office', 'remote', 'annual_leave', 'sick_leave', 'unpaid_leave', 'compensatory_leave', 'public_holiday'];
    const currentStatus = attendanceData[dateKey] || { am: 'none', pm: 'none' };
    
    let currentIndex = -1;
    if (currentStatus.am === currentStatus.pm) {
        currentIndex = statuses.indexOf(currentStatus.am);
    }
    
    const nextStatusKey = statuses[(currentIndex + 1) % statuses.length];
    newValue = { am: nextStatusKey, pm: nextStatusKey };
    
    const newAttendance = {
      ...attendanceData,
      [dateKey]: newValue
    };

    setAttendanceData(newAttendance);
    localStorage.setItem('attendanceData', JSON.stringify(newAttendance));

    if (user) {
      saveStatusToSupabase(dateKey, newValue, otData[dateKey]);
    }
  };

  // 自动保存单个日期的状态到 Supabase
  const saveStatusToSupabase = async (dateKey, statusObj, otVal) => {
    if (!user) return;
    try {
      const statusInt = encodeStatus(statusObj.am, statusObj.pm);
      
      // 转换 dateKey (YYYY-M-D) 到 DB 格式 (YYYY-MM-DD)
      const [y, m, d] = dateKey.split('-').map(Number);
      // m 是 0-11，需要加 1
      const dbDate = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

      const { error } = await supabase
        .from('calendar_data')
        .upsert({
          user_id: user.id,
          date: dbDate,
          status: statusInt,
          ot: otVal ? Math.round(otVal) : 0,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, date' });

      if (error) {
        console.error('Supabase auto-save error:', error);
      }
    } catch (error) {
      console.error('Error auto-saving:', error);
    }
  };

  // 切换加班状态 (Right Click)
  const toggleOtStatus = (day, e) => {
    e.preventDefault(); // 阻止默认右键菜单
    const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
    
    setCurrentOtDate(day);
    setOtDurationInput(otData[dateKey] ? String(otData[dateKey]) : '1');
    setShowOtModal(true);
  };
  
  // 保存 OT 时长
  const handleOtSave = () => {
    if (!currentOtDate) return;
    const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentOtDate}`;
    let duration = parseFloat(otDurationInput);
    
    // Calculate max duration based on weekday/weekend
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentOtDate);
    const dayOfWeek = targetDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const maxDuration = isWeekend ? 24 : 16;

    if (duration > maxDuration) {
        duration = maxDuration;
    }

    let newOtData = { ...otData };
    let finalDuration = 0;

    if (isNaN(duration) || duration <= 0) {
        // Remove OT if 0 or invalid
         delete newOtData[dateKey];
         finalDuration = 0;
    } else {
         newOtData[dateKey] = duration;
         finalDuration = duration;
    }
    
    setOtData(newOtData);
    localStorage.setItem('otData', JSON.stringify(newOtData));
    
    if (user) {
      saveStatusToSupabase(dateKey, attendanceData[dateKey] || { am: 'none', pm: 'none' }, finalDuration);
    }
    
    setShowOtModal(false);
  };

  // 获取状态样式
  const getStatusStyle = (statusObj) => {
    const { am, pm } = statusObj;
    
    const getColorClass = (status) => {
        switch (status) {
          case 'office': return 'bg-success/20 text-success font-medium';
          case 'remote': return 'bg-primary/20 text-primary font-medium';
          case 'annual_leave': return 'bg-warning/20 text-warning font-medium';
          case 'sick_leave': return 'bg-sick/20 text-sick font-medium';
          case 'unpaid_leave': return 'bg-unpaid/20 text-unpaid font-medium';
          case 'compensatory_leave': return 'bg-compensatory/20 text-compensatory font-medium';
          case 'public_holiday': return 'bg-rose-500/20 text-rose-600 font-medium'; // New Public Holiday style
          default: return 'text-subtle hover:bg-primary/10';
        }
    };
    
    const getGradientColor = (status) => {
        switch (status) {
          case 'office': return 'rgba(34, 197, 94, 0.2)'; // #22c55e (Green-500)
          case 'remote': return 'rgba(59, 130, 246, 0.2)'; // #3b82f6 (Blue-500)
          case 'annual_leave': return 'rgba(249, 115, 22, 0.2)'; // #f97316 (Orange-500)
          case 'sick_leave': return 'rgba(168, 85, 247, 0.2)'; // #a855f7 (Purple-500)
          case 'unpaid_leave': return 'rgba(100, 116, 139, 0.2)'; // #64748b (Slate-500)
          case 'compensatory_leave': return 'rgba(6, 182, 212, 0.2)'; // #06b6d4 (Cyan-500)
          case 'public_holiday': return 'rgba(225, 29, 72, 0.2)'; // #e11d48 (Rose-600)
          default: return 'transparent';
        }
    };

    if (am === pm) {
        return { className: getColorClass(am), style: {} };
    }
    
    const amColor = getGradientColor(am);
    const pmColor = getGradientColor(pm);
    
    return {
        className: 'font-medium text-foreground',
        style: {
            background: `linear-gradient(135deg, ${amColor} 50%, ${pmColor} 50%)`
        }
    };
  };

  // 计算WIO百分比
  const wioPercentage = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentDate);
    let officeDays = 0;
    let totalWorkingDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayOfWeek = date.getDay();
      
      // 只计算工作日（周一到周五）
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const { am, pm } = getDateStatus(day);
        
        // AM
        if (am !== 'annual_leave' && am !== 'sick_leave' && am !== 'unpaid_leave' && am !== 'public_holiday') {
            totalWorkingDays += 0.5;
            if (am === 'office') officeDays += 0.5;
        }

        // PM
        if (pm !== 'annual_leave' && pm !== 'sick_leave' && pm !== 'unpaid_leave' && pm !== 'public_holiday') {
            totalWorkingDays += 0.5;
            if (pm === 'office') officeDays += 0.5;
        }
      }
    }

    return totalWorkingDays > 0 ? Math.round((officeDays / totalWorkingDays) * 100) : 0;
  }, [currentDate, attendanceData, getDateStatus]);

  // 计算假期使用情况
  const leaveStats = useMemo(() => {
    let annualUsed = 0;
    let sickUsed = 0;
    let publicHolidaysUsed = 0; // Track used public holidays (past/today)
    let publicHolidaysTotal = 0; // Track total public holidays in current year
    const currentYear = currentDate.getFullYear();
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    // 1. 统计用户手动记录 (Attendance)
    Object.entries(attendanceData).forEach(([key, statusObj]) => {
        const [y, m, d] = key.split('-').map(Number);
        
        if (y === currentYear) {
            const { am, pm } = statusObj;
            if (am === 'annual_leave') annualUsed += 0.5;
            if (pm === 'annual_leave') annualUsed += 0.5;
            
            if (am === 'sick_leave') sickUsed += 0.5;
            if (pm === 'sick_leave') sickUsed += 0.5;
        }
    });

    // 2. 统计公共假期 (Public Holidays)
    Object.entries(publicHolidays).forEach(([key, holiday]) => {
        const [y, m, d] = key.split('-').map(Number);
        
        if (y === currentYear) {
             // 检查这一天是否被用户覆盖
             const userRecord = attendanceData[key];
             // 如果用户覆盖了（比如 Office/Remote/AnnualLeave），则不算公共假期消耗
             // 注意：如果用户请了年假覆盖公共假期，这通常不合理（通常会延长年假），但按逻辑这里就不算公共假期了，算年假（上面已经统计了）
             const isOverridden = userRecord && 
                                  userRecord.am !== 'none' && 
                                  userRecord.am !== 'public_holiday'; 
             
             if (!isOverridden) {
                 publicHolidaysTotal += 1; // 假设公共假期都是全天

                 const recordDate = new Date(y, m, d);
                 if (recordDate <= now) {
                     publicHolidaysUsed += 1;
                 }
             }
        }
    });
    
    return { annualUsed, sickUsed, publicHolidaysUsed, publicHolidaysTotal };
  }, [attendanceData, publicHolidays, currentDate]);

  // 计算 OT 统计
  const otStats = useMemo(() => {
    let monthTotal = 0;
    let yearTotal = 0;
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-11
    
    Object.entries(otData).forEach(([key, duration]) => {
         const [y, m] = key.split('-').map(Number);
         if (y === currentYear) {
             yearTotal += Number(duration) || 0;
             if (m === currentMonth) {
                 monthTotal += Number(duration) || 0;
             }
         }
    });
    
    return { monthTotal, yearTotal };
  }, [otData, currentDate]);

  // 月份导航
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // 获取当前月份名称
  const getMonthName = () => {
    return currentDate.toLocaleString(language === 'en' ? 'en-US' : 'zh-CN', { year: 'numeric', month: 'long' });
  };

  // 获取今天是几号
  const getToday = () => {
    const today = new Date();
    if (today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear()) {
      return today.getDate();
    }
    return null;
  };

  const today = getToday();
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = getFirstDayOfMonth(currentDate);
  const isBelowTarget = wioPercentage < wioTarget;

  const monthlyWioNode = (
    <div className={`bg-card p-4 sm:p-6 rounded-lg border border-border shadow-sm ${isBelowTarget ? 'ring-2 ring-danger/50' : ''}`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg">{t('monthly_wio')}</h3>
            <button 
                onClick={() => setIsShareModalOpen(true)}
                className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-md hover:bg-primary/20 transition-colors"
                title={t('share_title')}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                <span className="font-medium">{t('share_btn')}</span>
            </button>
        </div>
        <span className={`font-bold text-2xl ${isBelowTarget ? 'text-danger' : 'text-success'}`}>
          {wioPercentage}%
        </span>
      </div>
      <p className="text-sm text-subtle mt-1 mb-3">{t('target')}: {wioTarget}%</p>
      <div className="w-full bg-border rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full transition-all duration-300 ${
            isBelowTarget ? 'bg-danger' : 'bg-primary'
          }`}
          style={{ width: `${wioPercentage}%` }}
        ></div>
      </div>
      {isBelowTarget && (
        <p className="text-xs text-danger mt-2">{t('wio_below_target')}</p>
      )}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background font-display text-foreground">
      <Navigation />

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 flex-grow">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 sm:mb-8">
            <h1 className="text-3xl font-bold tracking-tight">{t('wio_status_title')}</h1>
            {!user && (
              <p className="mt-2 text-subtle">
                {t('data_local_hint')}
              </p>
            )}
          </div>

          <div className="lg:hidden mb-4">
            {monthlyWioNode}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
            {/* Calendar Section */}
            <div className="lg:col-span-2 bg-card p-4 sm:p-6 rounded-lg border border-border shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">{getMonthName()}</h3>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={goToPreviousMonth}
                    className="p-2 rounded-full hover:bg-primary/10 transition-colors text-subtle hover:text-primary"
                  >
                    <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"></path></svg>
                  </button>
                  <button 
                    onClick={goToNextMonth}
                    className="p-2 rounded-full hover:bg-primary/10 transition-colors text-subtle hover:text-primary"
                  >
                    <svg fill="currentColor" height="20" viewBox="0 0 256 256" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"></path></svg>
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 text-center text-sm relative">
                <div className="font-bold text-subtle py-2">{t('sun')}</div>
                <div className="font-bold text-subtle py-2">{t('mon')}</div>
                <div className="font-bold text-subtle py-2">{t('tue')}</div>
                <div className="font-bold text-subtle py-2">{t('wed')}</div>
                <div className="font-bold text-subtle py-2">{t('thu')}</div>
                <div className="font-bold text-subtle py-2">{t('fri')}</div>
                <div className="font-bold text-subtle py-2">{t('sat')}</div>
                
                {/* Empty cells for the first week */}
                {Array.from({ length: firstDayOfMonth }, (_, i) => (
                  <div key={`empty-${i}`}></div>
                ))}

                {/* Calendar days */}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const status = getDateStatus(day);
                  const otDuration = getOtStatus(day);
                  const isOt = otDuration > 0;
                  const isToday = day === today;

                  const { className: statusClass, style: statusStyle } = getStatusStyle(status);
                  
                  // Check if it is a public holiday and if it is in the future (or today)
                  // Use currentDate context to build full date object
                  const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                  const now = new Date();
                  now.setHours(0, 0, 0, 0); // Reset time part for accurate comparison
                  
                  const isFutureOrToday = cellDate >= now;
                  const isPublicHoliday = status.am === 'public_holiday' && status.pm === 'public_holiday';
                  const holidayName = status.name;

                  return (
                    <button
                      key={day}
                      onClick={() => toggleDateStatus(day)}
                      onContextMenu={(e) => toggleOtStatus(day, e)}
                      style={statusStyle}
                      className={`h-10 sm:h-12 w-full flex flex-col items-center justify-center rounded-lg transition-colors relative ${statusClass} ${isToday ? 'ring-2 ring-primary/50' : ''}`}
                      aria-label={`${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${day}, AM: ${status.am}, PM: ${status.pm}`}
                    >
                      <span className={`leading-none ${isPublicHoliday && isFutureOrToday && holidayName ? 'text-xs font-bold mb-0.5' : 'text-sm'}`}>
                        {isToday ? t('today') : day}
                      </span>
                      
                      {/* Holiday Name Display */}
                      {isPublicHoliday && isFutureOrToday && holidayName && (
                          <span 
                            className="text-[10px] leading-none truncate w-full px-0.5 text-rose-700 font-bold opacity-90 transform scale-90 sm:scale-100 origin-center"
                            title={holidayName}
                          >
                              {holidayName}
                          </span>
                      )}
                      
                      {isOt && (
                        <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[10px] text-white ring-2 ring-card shadow-sm" title={`${t('ot')} ${otDuration} ${t('hours')}`}>
                          {otDuration}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>



              {/* Legend (Moved from sidebar) */}
              <div className="mt-4 sm:mt-6 bg-card p-3 sm:p-4 rounded-lg border border-border shadow-sm">
                <div className="flex flex-col gap-2 mb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg">{t('legend')}</h3>
                            <button 
                                onClick={() => setShowHelp(!showHelp)}
                                className="text-subtle hover:text-primary transition-colors focus:outline-none"
                                title={t('click_for_help')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
                            </button>
                        </div>
                        {selectedLegend && (
                            <button 
                                onClick={() => setSelectedLegend(null)}
                                className="text-xs text-primary hover:underline"
                            >
                                {t('cancel_selection')}
                            </button>
                        )}
                    </div>
                    {showHelp && (
                        <div className="text-sm text-subtle bg-muted/50 p-3 rounded border border-border animate-in fade-in slide-in-from-top-1">
                            {t('help_text')}
                        </div>
                    )}
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  {[
                    { key: 'office', label: t('office'), className: 'bg-success/20 border-success' },
                    { key: 'remote', label: t('remote'), className: 'bg-primary/20 border-primary' },
                    { key: 'annual_leave', label: t('annual_leave'), className: 'bg-warning/20 border-warning' },
                    { key: 'compensatory_leave', label: t('compensatory_leave'), className: 'bg-compensatory/20 border-compensatory' },
                    { key: 'sick_leave', label: t('sick_leave'), className: 'bg-sick/20 border-sick' },
                    { key: 'unpaid_leave', label: t('unpaid_leave'), className: 'bg-unpaid/20 border-unpaid' },
                    { key: 'public_holiday', label: t('public_holiday'), className: 'bg-rose-500/20 border-rose-600' },
                    { key: 'none', label: t('clear'), className: 'border-dashed border-subtle' }
                  ].map(item => (
                    <div 
                      key={item.key}
                      onClick={() => setSelectedLegend(selectedLegend === item.key ? null : item.key)}
                      className={`flex items-center gap-2 cursor-pointer py-1.5 px-2 rounded-md transition-colors ${
                        selectedLegend === item.key ? 'bg-primary/10 ring-1 ring-primary' : 'hover:bg-primary/5'
                      }`}
                    >
                      <div className={`size-4 rounded-full border ${item.className}`}></div>
                      <span>{item.label}</span>
                    </div>
                  ))}
                  
                  <div 
                    onClick={() => setSelectedLegend(selectedLegend === 'ot' ? null : 'ot')}
                    className={`flex items-center gap-2 cursor-pointer py-1.5 px-2 rounded-md transition-colors ${
                      selectedLegend === 'ot' ? 'bg-primary/10 ring-1 ring-primary' : 'hover:bg-primary/5'
                    }`}
                  >
                    <div className="size-4 rounded-full flex items-center justify-center relative">
                       <span className="absolute top-0 right-0 h-3 w-3 bg-danger rounded-full border-2 border-card"></span>
                    </div>
                    <span>{t('ot')}</span>
                  </div>

                  <div 
                    onClick={() => {
                        setShowCombinedConfig(!showCombinedConfig);
                        // If opening, maybe pre-fill with current selected if it is object?
                        if (!showCombinedConfig && typeof selectedLegend === 'object' && selectedLegend !== null) {
                            setCombinedConfig(selectedLegend);
                        }
                    }}
                    className={`flex items-center gap-2 cursor-pointer py-1.5 px-2 rounded-md transition-colors ${
                      showCombinedConfig ? 'bg-primary/10 ring-1 ring-primary' : 'hover:bg-primary/5'
                    }`}
                  >
                    <div className="size-4 rounded-full border" style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 50%, rgba(59, 130, 246, 0.2) 50%)' }}></div>
                    <span>{t('custom')}</span>
                  </div>

                  <div className="flex items-center gap-2 py-1.5 px-2">
                    <div className="size-4 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">今</div>
                    <span>{t('today')}</span>
                  </div>

                  {/* Combined Config Panel */}
                  {showCombinedConfig && (
                    <div className="w-full mt-4 p-4 border border-border rounded-md bg-card/50">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            {['am', 'pm'].map(period => (
                                <div key={period}>
                                    <label className="block text-xs font-bold mb-2 uppercase text-subtle">{t(period)}</label>
                                    <div className="space-y-1">
                                        {[
                                            { key: 'office', label: t('office_short'), color: 'bg-success/20' },
                                            { key: 'remote', label: t('remote_short'), color: 'bg-primary/20' },
                                            { key: 'annual_leave', label: t('annual_leave_short'), color: 'bg-warning/20' },
                                            { key: 'compensatory_leave', label: t('compensatory_leave_short'), color: 'bg-compensatory/20' },
                                            { key: 'sick_leave', label: t('sick_leave_short'), color: 'bg-sick/20' },
                                            { key: 'unpaid_leave', label: t('unpaid_leave_short'), color: 'bg-unpaid/20' },
                                            { key: 'public_holiday', label: t('public_holiday_short'), color: 'bg-rose-500/20' },
                                            { key: 'none', label: t('none'), color: 'border border-dashed' }
                                        ].map(opt => (
                                            <div 
                                                key={opt.key}
                                                onClick={() => setCombinedConfig(prev => ({ ...prev, [period]: opt.key }))}
                                                className={`flex items-center gap-2 p-1.5 rounded cursor-pointer text-xs ${
                                                    combinedConfig[period] === opt.key ? 'bg-primary/10 ring-1 ring-primary' : 'hover:bg-primary/5'
                                                }`}
                                            >
                                                <div className={`size-3 rounded-full ${opt.color}`}></div>
                                                <span>{opt.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => {
                                setSelectedLegend(combinedConfig);
                            }}
                            className={`w-full py-2 rounded text-sm font-bold transition-colors ${
                                JSON.stringify(selectedLegend) === JSON.stringify(combinedConfig) 
                                ? 'bg-success text-white' 
                                : 'bg-primary text-white hover:bg-primary/90'
                            }`}
                        >
                            {JSON.stringify(selectedLegend) === JSON.stringify(combinedConfig) ? t('selected') : t('apply_combination')}
                        </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-8">
              {/* Monthly WIO Progress (Desktop) */}
              <div className="hidden lg:block">
                {monthlyWioNode}
              </div>

              {/* Leave & OT Stats */}
              <div className="bg-card p-4 sm:p-6 rounded-lg border border-border shadow-sm space-y-4">
                <h3 className="font-bold text-lg">{t('statistics')}</h3>
                
                {/* Annual Leave */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-subtle">{t('annual_leave_stat')}</span>
                    <span className="font-medium">{leaveStats.annualUsed} / {annualQuota || '-'} {t('days')}</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2">
                    <div 
                      className="bg-warning h-2 rounded-full transition-all"
                      style={{ width: `${annualQuota ? Math.min((leaveStats.annualUsed / annualQuota) * 100, 100) : 0}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-subtle mt-1 text-right">{t('remaining')}: {annualQuota ? annualQuota - leaveStats.annualUsed : '-'} {t('days')}</p>
                </div>

                {/* Sick Leave */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-subtle">{t('sick_leave_stat')}</span>
                    <span className="font-medium">{leaveStats.sickUsed} / {sickQuota || '-'} {t('days')}</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2">
                    <div 
                      className="bg-sick h-2 rounded-full transition-all"
                      style={{ width: `${sickQuota ? Math.min((leaveStats.sickUsed / sickQuota) * 100, 100) : 0}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-subtle mt-1 text-right">{t('remaining')}: {sickQuota ? sickQuota - leaveStats.sickUsed : '-'} {t('days')}</p>
                </div>

                {/* Public Holiday Stats */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-subtle">{t('public_holiday_stat') || 'Public Holidays'}</span>
                    <span className="font-medium">{leaveStats.publicHolidaysUsed} / {leaveStats.publicHolidaysTotal} {t('days')}</span>
                  </div>
                   <div className="w-full bg-border rounded-full h-2">
                    <div 
                      className="bg-rose-500 h-2 rounded-full transition-all"
                      style={{ width: `${leaveStats.publicHolidaysTotal ? Math.min((leaveStats.publicHolidaysUsed / leaveStats.publicHolidaysTotal) * 100, 100) : 0}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-subtle mt-1 text-right">{t('remaining')}: {leaveStats.publicHolidaysTotal - leaveStats.publicHolidaysUsed} {t('days')}</p>
                </div>

                {/* OT Stats */}
                <div className="pt-2 border-t border-border">
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-sm font-medium">{t('ot_stats')}</span>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="bg-background p-3 rounded-md text-center">
                       <div className="text-xs text-subtle">{t('this_month')}</div>
                       <div className="text-lg font-bold text-danger">{otStats.monthTotal} <span className="text-xs font-normal text-subtle">{t('hours')}</span></div>
                     </div>
                     <div className="bg-background p-3 rounded-md text-center">
                       <div className="text-xs text-subtle">{t('this_year')}</div>
                       <div className="text-lg font-bold text-danger">{otStats.yearTotal} <span className="text-xs font-normal text-subtle">{t('hours')}</span></div>
                     </div>
                   </div>
                </div>
              </div>

              {/* Action Buttons Removed */}
              
            </div>
          </div>
          {/* SEO Content Section */}
          <div className="mt-12 lg:mt-24 border-t border-border pt-12 text-subtle">
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-4">{t('seo_title_1')}</h2>
              <p className="mb-6 leading-relaxed">{t('seo_desc_1')}</p>
              
              <h2 className="text-2xl font-bold text-foreground mb-4">{t('seo_title_2')}</h2>
              <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>{t('seo_feature_1')}</li>
                <li>{t('seo_feature_2')}</li>
                <li>{t('seo_feature_3')}</li>
                <li>{t('seo_feature_4')}</li>
              </ul>

              <h2 className="text-2xl font-bold text-foreground mb-4">{t('seo_title_3')}</h2>
              <p className="mb-6 leading-relaxed">{t('seo_desc_3')}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">{t('seo_faq_title')}</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{t('seo_faq_q1')}</h3>
                  <p>{t('seo_faq_a1')}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{t('seo_faq_q2')}</h3>
                  <p>{t('seo_faq_a2')}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{t('seo_faq_q3')}</h3>
                  <p>{t('seo_faq_a3')}</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
      {/* OT Duration Modal */}
      {showOtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm rounded-xl shadow-lg border border-border p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold mb-4">{t('set_ot_duration')}</h3>
            <p className="text-sm text-subtle mb-4">
              {t('set_ot_desc', { date: currentOtDate })}
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">{t('duration_hours')}</label>
              <input 
                type="number" 
                step="0.5"
                min="0"
                max={(() => {
                    if (!currentOtDate) return 24;
                    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentOtDate);
                    const day = d.getDay();
                    return (day === 0 || day === 6) ? 24 : 16;
                })()}
                value={otDurationInput}
                onChange={(e) => setOtDurationInput(e.target.value)}
                className="w-full p-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleOtSave();
                  if (e.key === 'Escape') setShowOtModal(false);
                }}
              />
              <p className="text-xs text-subtle mt-1">
                {(() => {
                    if (!currentOtDate) return '';
                    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentOtDate);
                    const day = d.getDay();
                    const isWeekend = day === 0 || day === 6;
                    return isWeekend ? t('ot_max_weekend') : t('ot_max_workday');
                })()}
              </p>
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowOtModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/5 text-subtle hover:text-foreground transition-colors"
              >
                {t('cancel')}
              </button>
              <button 
                onClick={handleOtSave}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
              >
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        currentDate={currentDate}
        wioPercentage={wioPercentage}
        wioTarget={wioTarget}
        attendanceData={attendanceData}
        publicHolidays={publicHolidays}
        t={t}
        language={language}
      />
    </div>
  );
}
