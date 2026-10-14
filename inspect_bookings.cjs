const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envFile, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = (match[2] || '').trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
const { createClient } = require(path.join(__dirname, 'frontend', 'node_modules', '@supabase', 'supabase-js'));
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectBookings() {
  const { data, error } = await supabase.from('bookings').select('id, client_name, session_title, event_date, status, is_deleted, package_price, location, notes').order('event_date', { ascending: false });
  if (error) {
    console.error('Error fetching bookings:', error);
    return;
  }
  console.log(`Total bookings found: ${data.length}`);
  data.forEach((b, idx) => {
    console.log(`${idx + 1}. [${b.event_date}] ${b.client_name} - ${b.session_title} (${b.status}) price:${b.package_price} deleted:${b.is_deleted}`);
  });
}

inspectBookings().catch(console.error);
