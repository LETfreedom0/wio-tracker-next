import { supabase } from './supabaseClient';

/**
 * 获取指定日期范围内的日程
 * @param {string} userId 
 * @param {string} startDate 
 * @param {string} endDate 
 */
export const fetchSchedules = async (userId, startDate, endDate) => {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('time', { ascending: true, nullsFirst: false }) // Sort by time first
    .order('created_at', { ascending: true }); // Then by creation

  if (error) throw error;
  return data;
};

/**
 * 添加新日程
 * @param {string} userId 
 * @param {string} date (YYYY-MM-DD)
 * @param {string} title 
 * @param {string} time (HH:MM) - Optional
 */
export const addSchedule = async (userId, date, title, time = null) => {
  const { data, error } = await supabase
    .from('schedules')
    .insert([
      { user_id: userId, date, title, time, is_completed: false }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * 更新日程状态
 * @param {string} id 
 * @param {boolean} isCompleted 
 */
export const updateScheduleStatus = async (id, isCompleted) => {
  const { data, error } = await supabase
    .from('schedules')
    .update({ is_completed: isCompleted })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * 删除日程
 * @param {string} id 
 */
export const deleteSchedule = async (id) => {
  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};
