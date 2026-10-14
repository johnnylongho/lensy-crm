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

async function clean() {
  await supabase.from('clients').delete().eq('id', '9bc9e44c-2aaf-40e4-b9d3-9afe9e78b008');
  const { data } = await supabase.from('clients').select('id, name, phone');
  console.log('Clients count:', data.length);
  console.log(data);
}

clean();
