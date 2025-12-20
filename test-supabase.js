const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ixggtocmcskaviomqahq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4Z2d0b2NtY3NrYXZpb21xYWhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MDU1NjIsImV4cCI6MjA3ODE4MTU2Mn0.ViGz_J6tVjw-Hrf4JmHuoXvBOczAOD4J3SbPK_68zRU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('test').select('*').limit(1);
    if (error) {
      console.error('Supabase Error:', error);
    } else {
      console.log('Supabase Connection Successful! Data:', data);
    }
  } catch (err) {
    console.error('Unexpected Error:', err);
  }

  console.log('Testing Auth...');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Auth Error:', error);
    } else {
      console.log('Auth Session:', data);
    }
  } catch (err) {
    console.error('Auth Unexpected Error:', err);
  }

  console.log('Testing Raw Fetch to Auth Endpoint...');
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      }
    });
    console.log('Fetch Status:', response.status);
    const text = await response.text();
    console.log('Fetch Response:', text.substring(0, 100));
  } catch (err) {
    console.error('Fetch Error:', err);
  }
}

testConnection();
