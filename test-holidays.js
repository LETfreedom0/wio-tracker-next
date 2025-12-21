
// const fetch = require('node-fetch');
const Holidays = require('date-holidays');

async function fetchHolidayData(countryCode, year) {
    console.log(`Fetching for ${countryCode} ${year}`);
    // Skip CN and Nager for this test to test fallback
    
    // 3. Fallback to local 'date-holidays' library
    try {
        const hd = new Holidays(countryCode);
        const holidays = hd.getHolidays(year);
        if (!holidays) return [];
        
        return holidays.map(h => {
             // Replicating the logic from the app
             let dateStr = h.date;
             // The app code: h.date.split(' ')[0]
             // But h.date might be a Date object.
             // Let's check what h.date is.
             console.log(`Type of h.date: ${typeof h.date}`, h.date);
             
             // App logic simulation
             try {
                dateStr = h.date.split(' ')[0];
             } catch (e) {
                 console.log('Split failed, trying toISOString');
                 try {
                    dateStr = h.date.toISOString().split('T')[0];
                 } catch (e2) {
                     console.log('toISOString failed');
                 }
             }

             return {
                date: dateStr, 
                name: h.name,
                type: h.type,
                isSubstitute: false
             };
        });
    } catch (e) {
        console.error('Local holiday fetch failed:', e);
        return [];
    }
}

async function test() {
    const usHolidays = await fetchHolidayData('US', 2024);
    console.log('US Holidays (Local):', usHolidays.slice(0, 3));
}

test();
