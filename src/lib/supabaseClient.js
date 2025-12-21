import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const isValidUrl = (url) => {
  try {
    return Boolean(new URL(url));
  } catch (e) {
    return false;
  }
};

// Debug configuration (will be visible in browser console or server logs)
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase configuration missing:', {
    url: supabaseUrl ? 'Set' : 'Missing',
    key: supabaseAnonKey ? 'Set' : 'Missing'
  });
} else if (!isValidUrl(supabaseUrl)) {
  console.warn('Supabase URL is invalid:', supabaseUrl);
}

// 创建一个 Mock 客户端，防止因缺少配置导致应用崩溃
const createMockClient = () => {
  const mockBuilder = {
    select: () => mockBuilder,
    eq: () => mockBuilder,
    single: () => Promise.resolve({ data: null, error: null }),
    upsert: () => Promise.resolve({ error: { message: 'Supabase configuration missing' } }),
    then: (resolve) => resolve({ data: null, error: null })
  };

  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: () => Promise.resolve({ error: { message: 'Supabase URL not configured' } }),
      signUp: () => Promise.resolve({ error: { message: 'Supabase URL not configured' } }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: () => mockBuilder
  };
};

export const supabase = (isValidUrl(supabaseUrl) && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createMockClient();
