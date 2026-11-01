/**
 * RAW BATCH SCRIPT GENERATOR
 * Hỗ trợ tạo file kịch bản tự động lọc file RAW (.bat cho Windows / .sh cho MacOS)
 * Giúp thợ ảnh không phải nhặt 20-30 file RAW thủ công từ thư mục 1.000 file.
 */

export const generateRawFilterBatchScript = (
  items: Array<{ filename: string }>,
  clientName = 'KhachHang'
): string => {
  const cleanBaseNames = items
    .map(i => i.filename.replace(/\.[^/.]+$/, '').trim())
    .filter(Boolean);

  const forList = cleanBaseNames.map(name => `    ${name}`).join('\r\n');

  return `@echo off
chcp 65001 >nul
title LENSY CRM - BO LOC FILE RAW TU DONG
color 0A

echo ====================================================================
echo    LENSY CRM - TU DONG LOC FILE RAW CHO SHOW CHUP
echo ====================================================================
echo  Khach hang: ${clientName}
echo  Tong so anh da chon: ${cleanBaseNames.length} file
echo.
echo  Dang quet va gom file RAW vao thu muc: Selected_RAW_HauKy\\ ...
echo --------------------------------------------------------------------

if not exist "Selected_RAW_HauKy" (
    mkdir "Selected_RAW_HauKy"
)

set /a foundCount=0

for %%F in (
${forList}
) do (
    for %%X in (CR3 CR2 ARW NEF RAF DNG RAW JPG JPEG) do (
        if exist "%%F.%%X" (
            copy /Y "%%F.%%X" "Selected_RAW_HauKy\\" >nul
            echo  [+] Da nhan dien va gom file: %%F.%%X
            set /a foundCount+=1
        )
    )
)

echo --------------------------------------------------------------------
echo.
echo  KET QUA: Da loc va copy thanh cong %foundCount% file RAW!
echo  Thu muc luu tru: .\\Selected_RAW_HauKy\\
echo.
echo  Ban co the chep folder 'Selected_RAW_HauKy' sang iPad de keo mau tren Lightroom Mobile.
echo ====================================================================
echo.
pause
`;
};

export const downloadRawFilterBatchScript = (
  items: Array<{ filename: string }>,
  clientName = 'KhachHang'
): boolean => {
  const cleanBaseNames = items
    .map(i => i.filename.replace(/\.[^/.]+$/, '').trim())
    .filter(Boolean);

  if (cleanBaseNames.length === 0) return false;

  const safeClientName = clientName.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, '_');
  const filename = `Loc_Anh_RAW_Show_${safeClientName}.bat`;
  const content = generateRawFilterBatchScript(items, clientName);

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
};
