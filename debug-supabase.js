
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('Key:', supabaseAnonKey ? 'Set' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('Testing connection...');
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Connection error:', error);
    } else {
      console.log('Connection successful. Session:', data.session ? 'Active' : 'None');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testConnection();
