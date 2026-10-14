const fs = require('fs');
const path = require('path');
const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = (match[2] || '').trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    env[match[1]] = val;
  }
});
const { createClient } = require(path.join(__dirname, 'frontend', 'node_modules', '@supabase', 'supabase-js'));
const supabase = createClient(env.SUPABASE_URL || env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY);

const isPlaceholderPhone = (phone) => {
  if (!phone) return true;
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length < 9) return true;
  if (/^0+(\d)\1{5,}$/.test(cleaned)) return true;
  if (cleaned === '0900000000' || cleaned === '0000000000' || cleaned === '0123456789') return true;
  return false;
};

async function previewSync() {
  const { data: dbClients } = await supabase.from('clients').select('*');
  const { data: dbBookings } = await supabase.from('bookings').select('*');

  console.log('Current dbClients count:', dbClients.length);
  console.log('Current dbBookings count:', dbBookings.length);

  const existingClientMap = new Map();
  dbClients.forEach(c => {
    existingClientMap.set(c.name.trim().toLowerCase(), c);
  });

  const clientsToInsert = [];
  const bookingUpdates = [];

  // Group bookings by clean client name
  const groupedBookings = {};
  dbBookings.forEach(b => {
    const nameKey = (b.client_name || 'Khách hàng').trim().toLowerCase();
    groupedBookings[nameKey] = groupedBookings[nameKey] || [];
    groupedBookings[nameKey].push(b);
  });

  console.log('Distinct client names in bookings:', Object.keys(groupedBookings).length);
  for (const [nameKey, bList] of Object.entries(groupedBookings)) {
    const sample = bList[0];
    const exists = existingClientMap.get(nameKey);
    console.log(`- ${sample.client_name}: ${bList.length} show(s), exists in clients table: ${!!exists}`);
  }
}

previewSync();
