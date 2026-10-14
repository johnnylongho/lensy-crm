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

async function purgeAndExport() {
  console.log('--- BƯỚC 1: DỌN DẸP MOCK & TEST RECORDS TRÊN SUPABASE ---');
  
  // Danh sách các booking test / mock cần xóa
  const testNames = [
    'Test Client AI',
    'Audit Client Automated Test',
    'Khách Test Form',
    'Test Client RLS',
    'Anh Minh & Chị Thảo',
    'Anh Tuấn & Chị Mai',
    'Nguyễn Hoàng Oanh'
  ];

  for (const name of testNames) {
    const { data: toDelete, error: findErr } = await supabase
      .from('bookings')
      .select('id, client_name, session_title')
      .ilike('client_name', `%${name}%`);

    if (findErr) {
      console.error(`Lỗi tìm ${name}:`, findErr.message);
      continue;
    }

    if (toDelete && toDelete.length > 0) {
      for (const item of toDelete) {
        const { error: delErr } = await supabase
          .from('bookings')
          .delete()
          .eq('id', item.id);
        if (delErr) {
          console.error(`❌ Không thể xóa [${item.id}] ${item.client_name}:`, delErr.message);
        } else {
          console.log(`🗑️ Đã xóa record rác/test: [${item.id}] ${item.client_name} - ${item.session_title}`);
        }
      }
    }
  }

  console.log('\n--- BƯỚC 2: TRÍCH XUẤT MASTER DATA THỰC TẾ (JSON & CSV) ---');
  const masterData = {};
  const tables = ['users', 'studios', 'studio_members', 'bookings', 'gears', 'clients', 'packages'];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      console.error(`Lỗi lấy bảng ${table}:`, error.message);
      masterData[table] = { error: error.message };
    } else {
      masterData[table] = data;
      console.log(`✅ Bảng ${table}: Đã lấy ${data.length} bản ghi thực tế.`);
      
      // Tạo CSV cho từng bảng
      if (data && data.length > 0) {
        const headers = Object.keys(data[0]);
        const csvRows = [
          headers.join(','),
          ...data.map(row => 
            headers.map(h => {
              let val = row[h];
              if (val === null || val === undefined) return '""';
              if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
              return `"${String(val).replace(/"/g, '""')}"`;
            }).join(',')
          )
        ];
        fs.writeFileSync(`master_data_${table}.csv`, csvRows.join('\n'), 'utf8');
      }
    }
  }

  // Xuất file tổng hợp JSON
  fs.writeFileSync('master_data_export.json', JSON.stringify(masterData, null, 2), 'utf8');
  console.log('\n🎉 Hoàn thành xuất master data: master_data_export.json và các file master_data_*.csv');
}

purgeAndExport().catch(console.error);
