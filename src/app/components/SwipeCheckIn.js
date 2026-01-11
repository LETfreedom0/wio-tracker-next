import React, { useState, useRef, useEffect } from 'react';

const SwipeCheckIn = ({ onSwipeLeft, onSwipeRight, t }) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef(null);
  const maxDrag = 120; // Maximum drag distance in pixels
  const threshold = 80; // Threshold to trigger action

  const handleStart = (clientX) => {
    setIsDragging(true);
  };

  const handleMove = (clientX) => {
    if (!isDragging) return;
    // Calculate new position relative to center
    // We assume the start position is effectively the center of the track
    // But since we track delta, we need to know the initial touch?
    // Actually simpler: we just track the current offset from 0 (center)
  };
  
  // Refined approach: Track start X
  const startXRef = useRef(0);
  const currentXRef = useRef(0);

  const onStart = (e) => {
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    startXRef.current = clientX;
  };

  const onMove = (e) => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const delta = clientX - startXRef.current;
    
    // Limit drag
    let newDrag = delta;
    if (newDrag > maxDrag) newDrag = maxDrag;
    if (newDrag < -maxDrag) newDrag = -maxDrag;
    
    setDragX(newDrag);
  };

  const onEnd = () => {
    setIsDragging(false);
    
    if (dragX > threshold) {
      onSwipeRight && onSwipeRight();
    } else if (dragX < -threshold) {
      onSwipeLeft && onSwipeLeft();
    }
    
    // Reset position with animation
    setDragX(0);
  };

  // Dynamic Styles
  const getTrackStyle = () => {
    if (dragX > 20) return 'bg-success/10 border-success/30';
    if (dragX < -20) return 'bg-primary/10 border-primary/30';
    return 'bg-card border-border';
  };
  
  const getLabelStyle = (direction) => {
    const opacity = Math.min(Math.abs(dragX) / threshold, 1);
    if (direction === 'left') { // Remote
        return { opacity: dragX < 0 ? 0.3 + opacity : 0.3, transform: `scale(${dragX < 0 ? 1 + opacity * 0.1 : 1})` };
    } else { // Office
        return { opacity: dragX > 0 ? 0.3 + opacity : 0.3, transform: `scale(${dragX > 0 ? 1 + opacity * 0.1 : 1})` };
    }
  };

  return (
    <div 
      className={`relative w-full max-w-[320px] h-16 rounded-full border-2 transition-colors duration-200 select-none touch-none ${getTrackStyle()}`}
      ref={trackRef}
    >
      {/* Labels */}
      <div className="absolute inset-0 flex justify-between items-center px-6 font-bold text-sm pointer-events-none">
        <span className="text-primary transition-all duration-200" style={getLabelStyle('left')}>
          {t('remote') || 'Remote'}
        </span>
        <span className="text-success transition-all duration-200" style={getLabelStyle('right')}>
          {t('office') || 'Office'}
        </span>
      </div>

      {/* Arrows indicating direction */}
      <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-primary transition-opacity duration-200 ${dragX < -10 ? 'opacity-100' : 'opacity-0'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
      </div>
      <div className={`absolute right-4 top-1/2 -translate-y-1/2 text-success transition-opacity duration-200 ${dragX > 10 ? 'opacity-100' : 'opacity-0'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
      </div>

      {/* Handle */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.15)] flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform duration-100 z-10 border border-border"
        style={{ 
          transform: `translate(calc(-50% + ${dragX}px), -50%)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
        onTouchStart={onStart}
        onTouchMove={onMove}
        onTouchEnd={onEnd}
        onMouseDown={onStart} // Mouse support for testing
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-subtle">
            <path d="M18 8L22 12L18 16"></path>
            <path d="M6 8L2 12L6 16"></path>
            <path d="M2 12H22"></path>
        </svg>
      </div>
      
      {/* Global Mouse Events (to handle drag outside component) */}
      {isDragging && (
        <div 
          className="fixed inset-0 z-50 cursor-grabbing"
          onMouseMove={onMove}
          onMouseUp={onEnd}
          onMouseLeave={onEnd}
        ></div>
      )}
    </div>
  );
};

export default SwipeCheckIn;
