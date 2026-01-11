import React from 'react';

const StatusButtons = ({ status, onStatusChange, t, layout = 'vertical' }) => {
  const isOffice = status.am === 'office';
  const isRemote = status.am === 'remote';

  const containerClass = layout === 'horizontal' 
    ? "grid grid-cols-2 gap-4 w-full" 
    : "grid grid-cols-1 gap-6 w-full max-w-sm";

  const buttonBaseClass = "relative overflow-hidden group rounded-xl border-2 transition-all duration-300 flex items-center justify-center gap-3";
  // Vertical layout uses larger padding and flex-col
  // Horizontal layout uses smaller padding and flex-row (or flex-col but compact)
  
  const buttonClass = (isActive, colorClass, shadowClass) => `
    ${buttonBaseClass}
    ${layout === 'vertical' ? 'p-8 flex-col' : 'p-4 flex-row sm:flex-col lg:flex-row'}
    ${isActive 
      ? `${colorClass} ${shadowClass}` 
      : 'border-border bg-card hover:bg-muted/50'
    }
  `;

  const iconContainerClass = (isActive, activeBg, inactiveBg) => `
    rounded-full transition-colors
    ${layout === 'vertical' ? 'p-4' : 'p-2'}
    ${isActive ? activeBg : inactiveBg}
  `;

  const iconSize = layout === 'vertical' ? 40 : 24;
  const textSize = layout === 'vertical' ? 'text-2xl' : 'text-lg';

  return (
    <div className={containerClass}>
      {/* Office Button */}
      <button
        onClick={() => onStatusChange({ am: 'office', pm: 'office' })}
        className={buttonClass(
          isOffice, 
          'border-success bg-success/10', 
          'shadow-[0_0_15px_rgba(34,197,94,0.15)]'
        )}
      >
        <div className={iconContainerClass(
          isOffice, 
          'bg-success text-white', 
          'bg-success/10 text-success'
        )}>
          <svg xmlns="http://www.w3.org/2000/svg" width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
        </div>
        <span className={`font-bold ${textSize} ${isOffice ? 'text-success' : 'text-foreground'}`}>
          {t('office') || 'Office'}
        </span>
        {isOffice && (
          <div className="absolute top-2 right-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-success">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        )}
      </button>

      {/* Remote Button */}
      <button
        onClick={() => onStatusChange({ am: 'remote', pm: 'remote' })}
        className={buttonClass(
          isRemote, 
          'border-primary bg-primary/10', 
          'shadow-[0_0_15px_rgba(59,130,246,0.15)]'
        )}
      >
        <div className={iconContainerClass(
          isRemote, 
          'bg-primary text-white', 
          'bg-primary/10 text-primary'
        )}>
          <svg xmlns="http://www.w3.org/2000/svg" width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>
        <span className={`font-bold ${textSize} ${isRemote ? 'text-primary' : 'text-foreground'}`}>
          {t('remote') || 'Remote'}
        </span>
        {isRemote && (
          <div className="absolute top-2 right-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        )}
      </button>
    </div>
  );
};

export default StatusButtons;
