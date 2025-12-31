export const STATUS_CODES = {
  NONE: 0,
  OFFICE: 1,
  REMOTE: 2,
  ANNUAL_LEAVE: 3,
  SICK_LEAVE: 4,
  UNPAID_LEAVE: 5,
  COMPENSATORY_LEAVE: 6,
  PUBLIC_HOLIDAY: 7
};

export const CODE_TO_KEY = {
  0: 'none',
  1: 'office',
  2: 'remote',
  3: 'annual_leave',
  4: 'sick_leave',
  5: 'unpaid_leave',
  6: 'compensatory_leave',
  7: 'public_holiday'
};

export const KEY_TO_CODE = Object.entries(CODE_TO_KEY).reduce((acc, [k, v]) => {
  acc[v] = Number(k);
  return acc;
}, {});

// Helper to decode status from DB integer to { am, pm } keys
export const decodeStatus = (statusInt) => {
  if (statusInt === null || statusInt === undefined) return { am: 'none', pm: 'none' };
  
  // Legacy/Simple status (0-99)
  if (statusInt < 100) {
    const key = CODE_TO_KEY[statusInt] || 'none';
    return { am: key, pm: key };
  }
  
  // Combined status (100 + am*10 + pm)
  const val = statusInt - 100;
  const amCode = Math.floor(val / 10);
  const pmCode = val % 10;
  return {
    am: CODE_TO_KEY[amCode] || 'none',
    pm: CODE_TO_KEY[pmCode] || 'none'
  };
};

// Helper to encode { am, pm } keys to DB integer
export const encodeStatus = (amKey, pmKey) => {
  const am = KEY_TO_CODE[amKey] || 0;
  const pm = KEY_TO_CODE[pmKey] || 0;
  
  if (am === pm) {
    return am;
  }
  
  return 100 + am * 10 + pm;
};

export const SUPPORT_EMAIL = 'letgsts@foxmail.com';
export const SITE_URL = 'https://wiotracker.xyz';
