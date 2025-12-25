'use client';

import { useRef, useState, useEffect } from 'react';
import { toPng } from 'html-to-image';
import QRCode from 'qrcode';

export default function ShareModal({ 
  isOpen, 
  onClose, 
  currentDate, 
  wioPercentage, 
  wioTarget, 
  attendanceData, 
  publicHolidays,
  t,
  language
}) {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(t('website_url'), { margin: 0, color: { dark: '#0f172a', light: '#ffffff' } })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error(err));
    }
  }, [isOpen, t]);

  if (!isOpen) return null;

  /**
   * 处理下载图片逻辑
   * 使用 html-to-image 将 DOM 节点转换为 PNG 图片
   * 这种方式使用 SVG foreignObject，通常比 html2canvas 更准确地还原 CSS 样式
   */
  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    
    // Wait for fonts to be fully loaded
    await document.fonts.ready;

    // Temporarily remove animation classes to prevent layout shifts during capture
    const modalContent = cardRef.current.closest('.animate-in');
    let originalAnimationClasses = '';
    if (modalContent) {
        originalAnimationClasses = modalContent.className;
        modalContent.classList.remove('animate-in', 'fade-in', 'zoom-in', 'duration-200');
    }

    try {
      // Capture the visible element directly to avoid layout issues with off-screen clones
      const dataUrl = await toPng(cardRef.current, { 
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 3, 
        skipFonts: true, // Avoid SecurityError
        filter: (node) => {
            // Exclude elements that are explicitly marked to be ignored
            return !node.dataset || node.dataset.html2canvasIgnore !== 'true';
        }
      });
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `wio-share-${currentDate.getFullYear()}-${currentDate.getMonth() + 1}.png`;
      link.click();
    } catch (err) {
      console.error("Export failed", err);
      
      // Fallback to html2canvas if html-to-image fails
      try {
          const html2canvas = (await import('html2canvas')).default;
          const canvas = await html2canvas(cardRef.current, {
              scale: 3,
              backgroundColor: '#ffffff',
              useCORS: true,
              logging: false,
              scrollY: 0,
              onclone: (doc) => {
                  const element = doc.querySelector('[data-html2canvas-ignore="true"]');
                  if (element) element.remove();
              }
          });
          const image = canvas.toDataURL("image/png");
          const link = document.createElement('a');
          link.href = image;
          link.download = `wio-share-${currentDate.getFullYear()}-${currentDate.getMonth() + 1}.png`;
          link.click();
      } catch (fallbackErr) {
          console.error("Fallback export failed", fallbackErr);
      }
    } finally {
      // Restore animation classes
      if (modalContent && originalAnimationClasses) {
         modalContent.className = originalAnimationClasses;
      }
      setDownloading(false);
    }
  };

  // Duplicate logic from Home to render the static grid
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  /**
   * 获取日期的状态
   * 优先使用用户设置，其次是公共假期
   * @param {number} day - 日期
   * @returns {Object} 状态对象
   */
  const getDateStatus = (day) => {
    const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`;
    const userStatus = attendanceData[dateKey];

    if (userStatus && userStatus.am !== 'none' && userStatus.am !== 'public_holiday') {
        return userStatus;
    }

    if (publicHolidays[dateKey]) {
        return { am: 'public_holiday', pm: 'public_holiday', name: publicHolidays[dateKey].name };
    }
    
    return { am: 'none', pm: 'none' };
  };

  /**
   * 获取状态对应的颜色
   * @param {string} status - 状态字符串
   * @returns {string} 颜色值 (Hex)
   */
  const getGradientColor = (status) => {
      switch (status) {
        case 'office': return '#22c55e'; // Green-500
        case 'remote': return '#3b82f6'; // Blue-500
        case 'annual_leave': return '#f97316'; // Orange-500
        case 'sick_leave': return '#a855f7'; // Purple-500
        case 'unpaid_leave': return '#64748b'; // Slate-500
        case 'compensatory_leave': return '#06b6d4'; // Cyan-500
        case 'public_holiday': return '#e11d48'; // Rose-600
        default: return 'transparent';
      }
  };

  /**
   * 获取状态样式
   * 处理上午/下午不同的情况，生成渐变背景
   * @param {Object} statusObj - 状态对象 {am, pm}
   * @returns {Object} 样式对象
   */
  const getStatusStyle = (statusObj) => {
    const { am, pm } = statusObj;
    
    if (am === 'none' && pm === 'none') {
        return { background: 'transparent' };
    }
    
    const hexToRgba = (hex) => {
        if (hex === 'transparent') return 'transparent';
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, 0.3)`;
    }

    if (am === pm) {
        return { background: hexToRgba(getGradientColor(am)) };
    }

    return {
        background: `linear-gradient(135deg, ${hexToRgba(getGradientColor(am))} 50%, ${hexToRgba(getGradientColor(pm))} 50%)`
    };
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleString(language === 'en' ? 'en-US' : 'zh-CN', { year: 'numeric', month: 'long' });
  const isBelowTarget = wioPercentage < wioTarget;

  // Calculate used statuses for dynamic legend
  const usedStatuses = new Set();
  for (let i = 1; i <= daysInMonth; i++) {
      const status = getDateStatus(i);
      if (status.am !== 'none') usedStatuses.add(status.am);
      if (status.pm !== 'none') usedStatuses.add(status.pm);
  }

  const allLegendItems = [
      { key: 'office', label: t('office'), color: '#22c55e', bg: 'rgba(34, 197, 94, 0.2)' },
      { key: 'remote', label: t('remote'), color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.2)' },
      { key: 'annual_leave', label: t('annual_leave'), color: '#f97316', bg: 'rgba(249, 115, 22, 0.2)' },
      { key: 'compensatory_leave', label: t('compensatory_leave'), color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.2)' },
      { key: 'sick_leave', label: t('sick_leave'), color: '#a855f7', bg: 'rgba(168, 85, 247, 0.2)' },
      { key: 'unpaid_leave', label: t('unpaid_leave'), color: '#64748b', bg: 'rgba(100, 116, 139, 0.2)' },
      { key: 'public_holiday', label: t('public_holiday'), color: '#e11d48', bg: 'rgba(225, 29, 72, 0.2)' },
  ];

  const activeLegendItems = allLegendItems.filter(item => usedStatuses.has(item.key));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-card w-full max-w-md rounded-xl shadow-lg border border-border p-6 animate-in fade-in zoom-in duration-200 flex flex-col items-center">
        <h3 className="text-lg font-bold mb-4">{t('share_title')}</h3>
        
        {/* Card Preview */}
        <div 
            ref={cardRef} 
            className="w-full p-6 rounded-xl shadow-md overflow-hidden relative"
            style={{ 
                backgroundColor: '#ffffff', 
                borderColor: '#f1f5f9', 
                borderWidth: '1px', 
                borderStyle: 'solid', 
                color: '#0f172a',
                fontFeatureSettings: '"tnum"', // Use tabular nums to prevent jitter
                fontVariantNumeric: 'tabular-nums'
            }}
        >
            {/* Background Decoration - using style for safe colors and absolute positioning instead of negative margins */}
            <div 
                className="absolute w-32 h-32 rounded-full blur-2xl"
                style={{ 
                    backgroundColor: 'rgba(19, 127, 236, 0.1)',
                    top: '-40px',
                    right: '-40px'
                }}
            ></div>
            <div 
                className="absolute w-32 h-32 rounded-full blur-2xl"
                style={{ 
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    bottom: '-40px',
                    left: '-40px'
                }}
            ></div>

            {/* Header */}
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex flex-col">
                    <h2 className="text-2xl font-bold tracking-tight" style={{ lineHeight: '1.2' }}>{t('share_card_title').replace('{month}', monthName)}</h2>
                    <p className="text-xs mt-2 font-medium tracking-wide uppercase" style={{ color: '#64748b', lineHeight: '1' }}>{t('website_name')}</p>
                </div>
                <div className="flex flex-col items-end">
                    <span 
                        className="text-4xl font-bold block"
                        style={{ color: isBelowTarget ? '#ef4444' : '#22c55e', lineHeight: '1' }}
                    >
                        {wioPercentage}%
                    </span>
                    <span className="text-[10px] font-bold mt-1 tracking-wider block" style={{ color: '#94a3b8', lineHeight: '1' }}>WIO SCORE</span>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="mb-4 relative z-10">
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] mb-1" style={{ color: '#94a3b8' }}>
                    <div>{t('sun')}</div>
                    <div>{t('mon')}</div>
                    <div>{t('tue')}</div>
                    <div>{t('wed')}</div>
                    <div>{t('thu')}</div>
                    <div>{t('fri')}</div>
                    <div>{t('sat')}</div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                     {Array.from({ length: firstDayOfMonth }, (_, i) => (
                        <div key={`empty-${i}`} className="h-8"></div>
                     ))}
                     {Array.from({ length: daysInMonth }, (_, i) => {
                        const day = i + 1;
                        const status = getDateStatus(day);
                        const style = getStatusStyle(status);
                        
                        return (
                            <div 
                                key={day} 
                                style={{ ...style, color: '#334155' }}
                                className="h-8 w-full flex items-center justify-center rounded-md font-medium"
                            >
                                {day}
                            </div>
                        );
                     })}
                </div>
            </div>

            {/* Legend */}
            {activeLegendItems.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mb-6 relative z-10">
                    {activeLegendItems.map((item) => (
                        <div key={item.key} className="flex items-center gap-1.5" style={{ fontSize: '10px', color: '#64748b' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '9999px', backgroundColor: item.bg, border: `1px solid ${item.color}` }}></div>
                            <span>{item.label}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Footer */}
            <div className="pt-4 flex justify-between items-end relative z-10" style={{ borderTopWidth: '1px', borderTopStyle: 'solid', borderColor: '#f1f5f9' }}>
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="size-5" style={{ color: '#137fec' }}>
                            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                <path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z" fill="currentColor"></path>
                            </svg>
                        </div>
                        <span className="font-bold text-sm" style={{ color: '#1e293b' }}>{t('website_url')}</span>
                    </div>
                    <p className="text-[10px] font-medium" style={{ color: '#64748b' }}>{t('slogan')}</p>
                </div>
                
                <div className="flex items-center gap-2">
                    <span className="text-[10px]" style={{ color: '#94a3b8' }}>{t('scan_to_visit')}</span>
                    {qrCodeUrl && (
                        <img src={qrCodeUrl} alt="QR Code" className="w-12 h-12" style={{ display: 'block' }} />
                    )}
                </div>
            </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 w-full">
            <button 
                onClick={onClose}
                className="flex-1 py-2 rounded-lg text-sm font-medium hover:bg-primary/5 text-subtle hover:text-foreground transition-colors"
            >
                {t('cancel')}
            </button>
            <button 
                onClick={handleDownload}
                disabled={downloading}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-2"
            >
                {downloading ? (
                    <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t('processing')}
                    </>
                ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        {t('download_image')}
                    </>
                )}
            </button>
        </div>
      </div>
    </div>
  );
}
