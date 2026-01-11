'use client';

import { useState, useEffect } from 'react';
import { addSchedule, updateScheduleStatus, deleteSchedule } from '../../lib/schedules';

export default function ScheduleModal({ 
  isOpen, 
  onClose, 
  date, 
  schedules, 
  userId, 
  onScheduleChange,
  t 
}) {
  const [newScheduleTitle, setNewScheduleTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localSchedules, setLocalSchedules] = useState(schedules || []);

  useEffect(() => {
    // Sort schedules: completed at bottom, then by time, then by id
    const sorted = [...(schedules || [])].sort((a, b) => {
        if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
        if (a.time && b.time) return a.time.localeCompare(b.time);
        if (a.time && !b.time) return -1;
        if (!a.time && b.time) return 1;
        return 0;
    });
    setLocalSchedules(sorted);
  }, [schedules]);

  if (!isOpen) return null;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newScheduleTitle.trim() || !userId) return;

    setIsSubmitting(true);
    try {
      // Format date to YYYY-MM-DD for DB
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      const newSchedule = await addSchedule(userId, dateStr, newScheduleTitle.trim());
      if (newSchedule) {
        setLocalSchedules([...localSchedules, newSchedule]);
        setNewScheduleTitle('');
        onScheduleChange && onScheduleChange();
      }
    } catch (error) {
      console.error('Failed to add schedule:', error);
      alert(t('schedule_add_error') || 'Failed to add schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      // Optimistic update
      setLocalSchedules(prev => prev.map(s => 
        s.id === id ? { ...s, is_completed: !currentStatus } : s
      ));

      await updateScheduleStatus(id, !currentStatus);
      onScheduleChange && onScheduleChange();
    } catch (error) {
      console.error('Failed to toggle schedule:', error);
      // Revert on error
      setLocalSchedules(schedules);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('schedule_delete_confirm') || 'Are you sure?')) return;
    
    try {
      setLocalSchedules(prev => prev.filter(s => s.id !== id));
      await deleteSchedule(id);
      onScheduleChange && onScheduleChange();
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      setLocalSchedules(schedules);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-md rounded-xl shadow-lg border border-border p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">
            {date.toLocaleDateString()} {t('schedule_title') || 'Schedules'}
          </h3>
          <button 
            onClick={onClose}
            className="text-subtle hover:text-foreground transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* List */}
        <div className="space-y-2 mb-6 max-h-[60vh] overflow-y-auto">
          {localSchedules.length === 0 ? (
            <p className="text-center text-subtle py-4 text-sm">
              {t('no_schedules') || 'No schedules yet'}
            </p>
          ) : (
            localSchedules.map(schedule => (
              <div 
                key={schedule.id} 
                className={`group flex items-center justify-between p-3 rounded-lg border transition-all ${
                  schedule.is_completed 
                    ? 'bg-muted/30 border-transparent opacity-60' 
                    : 'bg-background border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggle(schedule.id, schedule.is_completed)}
                    className={`flex-shrink-0 size-5 rounded border flex items-center justify-center transition-colors ${
                      schedule.is_completed 
                        ? 'bg-success border-success text-white' 
                        : 'border-subtle hover:border-primary'
                    }`}
                  >
                    {schedule.is_completed && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                  </button>
                  <div className="flex flex-col min-w-0">
                      <span className={`text-sm truncate ${schedule.is_completed ? 'line-through text-subtle' : ''}`}>
                        {schedule.title}
                      </span>
                      {schedule.time && (
                          <span className="text-xs text-subtle font-mono">
                            {schedule.time.slice(0, 5)}
                          </span>
                      )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(schedule.id)}
                  className="opacity-0 group-hover:opacity-100 text-subtle hover:text-danger p-1 transition-all"
                  title={t('delete') || 'Delete'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add New */}
        <form onSubmit={handleAdd} className="relative">
          <input
            type="text"
            value={newScheduleTitle}
            onChange={(e) => setNewScheduleTitle(e.target.value)}
            placeholder={t('add_schedule_placeholder') || 'Add a new task...'}
            className="w-full pl-4 pr-12 py-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm"
            disabled={!userId || isSubmitting}
          />
          <button
            type="submit"
            disabled={!newScheduleTitle.trim() || !userId || isSubmitting}
            className="absolute right-1.5 top-1.5 p-1.5 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </form>
        {!userId && (
          <p className="text-xs text-danger mt-2 text-center">
            {t('login_required_schedule') || 'Please login to manage schedules'}
          </p>
        )}
      </div>
    </div>
  );
}
