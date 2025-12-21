import Holidays from 'date-holidays';
import { supabase } from './supabaseClient';

export const getHolidayData = async (countryCode, year) => {
    if (!countryCode) return [];
    
    // 1. Try to fetch from DB 'public_holidays' table
    try {
        const { data, error } = await supabase
            .from('public_holidays')
            .select('data')
            .eq('country_code', countryCode)
            .eq('year', year)
            .single();

        if (data && data.data) {
            // console.log(`Using cached holidays for ${countryCode} ${year} from DB`);
            return data.data;
        }
    } catch (dbError) {
        // Ignore DB error, fall back to API
        console.warn('DB fetch failed, falling back to API:', dbError);
    }

    // 2. Fetch from API (Original Logic)
    let holidays = [];
    // 2.1. Special handling for China (CN) using Timor API
    if (countryCode === 'CN') {
      try {
        // Fetch from Timor API which supports substitute workdays
        const response = await fetch(`https://timor.tech/api/holiday/year/${year}`);
        const data = await response.json();
        
        if (data.code === 0 && data.holiday) {
          holidays = Object.values(data.holiday).map(item => {
            // item format: { holiday: boolean, name: string, wage: number, date: 'YYYY-MM-DD', status: 1 }
            // status 1 means workday (substitute), holiday: true means public holiday
            
            // Only return actual public holidays. Ignore substitute workdays as requested.
            if (item.holiday) {
                return {
                  date: item.date,
                  name: item.name,
                  type: 'public',
                  isSubstitute: false
                };
            }
            return null;
          }).filter(Boolean); // Filter out nulls (substitute workdays)
        }
      } catch (error) {
        console.error(`Failed to fetch CN holidays for ${year} from Timor API, falling back to local lib`, error);
        // Fallback to local library if API fails
      }
    }
    
    // 2.2. Special handling for other countries using Nager.Date API (More accurate than local lib)
    // Nager.Date covers many countries.
    if (countryCode !== 'CN' && holidays.length === 0) {
        try {
            const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`);
            if (response.ok) {
                const data = await response.json();
                holidays = data.map(item => ({
                    date: item.date, // YYYY-MM-DD
                    name: item.localName || item.name,
                    type: 'public', // Nager only returns public holidays usually
                    isSubstitute: false
                }));
            }
        } catch (error) {
             console.warn(`Failed to fetch holidays for ${countryCode} from Nager.Date, falling back to local lib`, error);
        }
    }

    // 2.3. Fallback to local 'date-holidays' library
    if (holidays.length === 0) {
        try {
            const hd = new Holidays(countryCode);
            const hdHolidays = hd.getHolidays(year);
            if (hdHolidays) {
                holidays = hdHolidays
                  .filter(h => {
                    // Filter out partial holidays or observance days
                    // Especially for China: Women's Day, Youth Day, Children's Day, Army Day
                    if (countryCode === 'CN') {
                        // These partial holidays usually have a note or start at 12:00:00
                        if (h.note || (typeof h.date === 'string' && h.date.includes('12:00:00'))) {
                            return false;
                        }
                    }
                    return true;
                  })
                  .map(h => ({
                    date: typeof h.date === 'string' ? h.date.split(' ')[0] : h.date.toISOString().split('T')[0],
                    name: h.name,
                    type: h.type,
                    isSubstitute: false
                }));
            }
        } catch (e) {
            console.error('Local holiday fetch failed:', e);
        }
    }

    // 3. Store result in DB 'public_holidays' table
    if (holidays.length > 0) {
        try {
            await supabase
                .from('public_holidays')
                .upsert({
                    country_code: countryCode,
                    year: year,
                    data: holidays,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'country_code,year' });
        } catch (saveError) {
            console.error('Failed to cache holidays to DB:', saveError);
        }
    }

    return holidays;
};
