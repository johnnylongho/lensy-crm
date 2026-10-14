const fs = require('fs');
const path = require('path');

console.log('--- PURGING FRONTEND MOCK DATA ---');

// 1. ClientsManagementPage.tsx
const clientsPagePath = path.join(__dirname, 'frontend', 'src', 'components', 'clients', 'ClientsManagementPage.tsx');
let clientsContent = fs.readFileSync(clientsPagePath, 'utf8');

// Replace MOCK_CLIENTS_DATA array with empty array
clientsContent = clientsContent.replace(
  /\/\/ Dữ liệu mẫu chuẩn Studio khi chạy Offline[^\n]*\r?\nconst MOCK_CLIENTS_DATA: ClientProfileData\[\] = \[[\s\S]*?\r?\n\];/,
  'const MOCK_CLIENTS_DATA: ClientProfileData[] = [];'
);
clientsContent = clientsContent.replace(/import { MOCK_CALENDAR_EVENTS } from '\.\.\/\.\.\/data\/mockData';\r?\n?/, '');
clientsContent = clientsContent.replace(/setClients\(MOCK_CLIENTS_DATA\);/g, 'setClients([]);');

fs.writeFileSync(clientsPagePath, clientsContent, 'utf8');
console.log('✅ Cleaned ClientsManagementPage.tsx');

// 2. GearsManagementPage.tsx
const gearsPagePath = path.join(__dirname, 'frontend', 'src', 'components', 'dashboard', 'GearsManagementPage.tsx');
let gearsContent = fs.readFileSync(gearsPagePath, 'utf8');

// Replace mock fallback in fetchGears
gearsContent = gearsContent.replace(
  /\/\/ Mock fallback với purchase_price đầy đủ\r?\n\s*setGears\(\[\r?\n[\s\S]*?\]\);/,
  'setGears([]);'
);
fs.writeFileSync(gearsPagePath, gearsContent, 'utf8');
console.log('✅ Cleaned GearsManagementPage.tsx');

// 3. PackagesManagementPage.tsx
const packagesPagePath = path.join(__dirname, 'frontend', 'src', 'components', 'dashboard', 'PackagesManagementPage.tsx');
let packagesContent = fs.readFileSync(packagesPagePath, 'utf8');

packagesContent = packagesContent.replace(/setPackages\(MOCK_PACKAGES\);/g, 'setPackages([]);');
packagesContent = packagesContent.replace(/setSelectedPackage\(MOCK_PACKAGES\[0\]\);/g, '');
packagesContent = packagesContent.replace(/setPackages\(localSaved \? JSON\.parse\(localSaved\) : MOCK_PACKAGES\);/g, 'setPackages(localSaved ? JSON.parse(localSaved) : []);');
packagesContent = packagesContent.replace(/import { MOCK_PACKAGES } from '\.\.\/\.\.\/data\/mockData';/, '// Mock data removed');

fs.writeFileSync(packagesPagePath, packagesContent, 'utf8');
console.log('✅ Cleaned PackagesManagementPage.tsx');

// 4. RoiProgressBar.tsx
const roiPath = path.join(__dirname, 'frontend', 'src', 'components', 'dashboard', 'RoiProgressBar.tsx');
if (fs.existsSync(roiPath)) {
  let roiContent = fs.readFileSync(roiPath, 'utf8');
  roiContent = roiContent.replace(
    /const fallbackGears: GearItem\[\] = \[\r?\n[\s\S]*?\];/,
    'const fallbackGears: GearItem[] = [];'
  );
  fs.writeFileSync(roiPath, roiContent, 'utf8');
  console.log('✅ Cleaned RoiProgressBar.tsx');
}

// 5. GrowthProgressBar.tsx
const growthPath = path.join(__dirname, 'frontend', 'src', 'components', 'dashboard', 'GrowthProgressBar.tsx');
if (fs.existsSync(growthPath)) {
  let growthContent = fs.readFileSync(growthPath, 'utf8');
  growthContent = growthContent.replace(
    /const fallbackGears: GearItem\[\] = \[\r?\n[\s\S]*?\];/,
    'const fallbackGears: GearItem[] = [];'
  );
  fs.writeFileSync(growthPath, growthContent, 'utf8');
  console.log('✅ Cleaned GrowthProgressBar.tsx');
}

// 6. BookingDetailModal.tsx
const bookingDetailPath = path.join(__dirname, 'frontend', 'src', 'components', 'dashboard', 'BookingDetailModal.tsx');
if (fs.existsSync(bookingDetailPath)) {
  let bdContent = fs.readFileSync(bookingDetailPath, 'utf8');
  bdContent = bdContent.replace(
    /const fallbackGears: GearItem\[\] = \[\r?\n[\s\S]*?\];/,
    'const fallbackGears: GearItem[] = [];'
  );
  fs.writeFileSync(bookingDetailPath, bdContent, 'utf8');
  console.log('✅ Cleaned BookingDetailModal.tsx');
}

// 7. QuoteView.tsx
const quoteViewPath = path.join(__dirname, 'frontend', 'src', 'components', 'quote', 'QuoteView.tsx');
if (fs.existsSync(quoteViewPath)) {
  let qvContent = fs.readFileSync(quoteViewPath, 'utf8');
  qvContent = qvContent.replace(/pkgList = MOCK_PACKAGES;/g, 'pkgList = [];');
  qvContent = qvContent.replace(/setPackages\(MOCK_PACKAGES\);/g, 'setPackages([]);');
  qvContent = qvContent.replace(/setSelectedPackage\(MOCK_PACKAGES\[0\]\);/g, '');
  qvContent = qvContent.replace(
    /if \(token === MOCK_QUOTE\.quoteToken\) {\r?\n\s*setQuote\(MOCK_QUOTE\);[\s\S]*?}/,
    '// Mock quote fallback removed'
  );
  fs.writeFileSync(quoteViewPath, qvContent, 'utf8');
  console.log('✅ Cleaned QuoteView.tsx');
}

console.log('--- ALL FRONTEND MOCK DATA REMOVED SUCCESSFULLY ---');
