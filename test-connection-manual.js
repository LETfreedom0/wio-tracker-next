
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ixggtocmcskaviomqahq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4Z2d0b2NtY3NrYXZpb21xYWhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MDU1NjIsImV4cCI6MjA3ODE4MTU2Mn0.ViGz_J6tVjw-Hrf4JmHuoXvBOczAOD4J3SbPK_68zRU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing connection to:', supabaseUrl);
  const start = Date.now();
  try {
    const { data, error } = await supabase.from('user_settings').select('count', { count: 'exact', head: true });
    const duration = Date.now() - start;
    
    if (error) {
      console.error('Error connecting to Supabase:', error);
      if (error.code === 'PGRST301') { // Example code, but often fetch errors don't have codes
         console.error('This might be a permission issue or the table does not exist.');
      }
    } else {
      console.log('Connection successful! Duration:', duration, 'ms');
      console.log('Data:', data);
    }
  } catch (err) {
    console.error('Exception during connection:', err);
    if (err.cause) console.error('Cause:', err.cause);
  }
}

test();
