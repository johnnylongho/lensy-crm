const fs = require('fs');
const path = require('path');

// Load environment variables manually from .env
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

console.log('Connecting to Supabase URL:', supabaseUrl);

const { createClient } = require(path.join(__dirname, 'frontend', 'node_modules', '@supabase', 'supabase-js'));
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const tables = ['users', 'studios', 'studio_members', 'bookings', 'gears', 'clients', 'packages'];
  const summary = {};

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase.from(table).select('*', { count: 'exact' });
      if (error) {
        summary[table] = { error: error.message };
      } else {
        summary[table] = {
          count: data.length,
          sample: data.slice(0, 5)
        };
      }
    } catch (err) {
      summary[table] = { error: err.message };
    }
  }

  console.log('=== SUPABASE DATABASE AUDIT SUMMARY ===');
  for (const [table, res] of Object.entries(summary)) {
    if (res.error) {
      console.log(`❌ Table: ${table} - Error: ${res.error}`);
    } else {
      console.log(`✅ Table: ${table} - Total Rows: ${res.count}`);
    }
  }

  fs.writeFileSync('audit_summary_raw.json', JSON.stringify(summary, null, 2), 'utf8');
  console.log('Exported raw audit to audit_summary_raw.json');
}

main().catch(console.error);
