@echo off
chcp 65001 >nul
title LENSY CRM - KẾT THÚC VÀ ĐỒNG BỘ DỰ ÁN
color 0A

:: Setup Node.js, npm & Git PATH
set "PATH=C:\Program Files\nodejs;%USERPROFILE%\AppData\Roaming\npm;%APPDATA%\npm;C:\Program Files\Git\cmd;%PATH%"

cd /d "%~dp0"

:SYNC_PROCESS
cls
echo ====================================================================
echo   LENSY CRM (MIRMIA STUDIO) - KẾT THÚC VÀ ĐỒNG BỘ DỰ ÁN
echo ====================================================================
echo.

:: 1. Tắt các tiến trình chạy nền trên cổng 5173 và 5000 (Dọn dẹp cổng)
echo [1/3] Đang dọn dẹp các tiến trình server đang chạy nền...
powershell -Command "Get-NetTCPConnection -LocalPort 5173, 5000, 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>nul
echo [OK] Đã giải phóng các cổng 5173, 5000 an toàn.
echo.

:: 2. Kiểm tra Git
where git >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [LỖI] Không tìm thấy Git trên hệ thống!
    echo Vui lòng cài đặt Git để tự động lưu lịch sử mã nguồn.
    pause
    exit /b 1
)

:: 3. Kiểm tra thay đổi mã nguồn
echo [2/3] Kiểm tra trạng thái thay đổi mã nguồn...
git status --porcelain > "%temp%\lf_git_status.tmp"

set HAS_CHANGES=0
for /f "usebackq delims=" %%A in ("%temp%\lf_git_status.tmp") do (
    set HAS_CHANGES=1
)
if exist "%temp%\lf_git_status.tmp" del "%temp%\lf_git_status.tmp" >nul 2>nul

if "%HAS_CHANGES%"=="0" goto NO_LOCAL_CHANGES

:HAS_LOCAL_CHANGES
echo Danh sách các file vừa được chỉnh sửa / tạo mới:
echo --------------------------------------------------------------------
git status -s
echo --------------------------------------------------------------------
echo.
echo Đang đóng gói các thay đổi (git add -A)...
git add -A

echo.
set "USER_INPUT="
set /p USER_INPUT="Nhập ghi chú cho phiên làm việc (Nhấn Enter để dùng mặc định): "

if "%USER_INPUT%"=="" (
    set "USER_INPUT=Lưu phiên làm việc LensFlow từ %COMPUTERNAME% lúc %TIME%"
)

git commit -m "%USER_INPUT%"
goto CHECK_REMOTE

:NO_LOCAL_CHANGES
echo [THÔNG TIN] Toàn bộ mã nguồn trên máy đã được lưu sạch sẽ (Không có file mới).
goto CHECK_REMOTE

:CHECK_REMOTE
echo.
echo [3/3] Đang kiểm tra kết nối Cloud / GitHub Remote...
git remote get-url origin >nul 2>nul
if %errorlevel% neq 0 (
    goto LOCAL_ONLY_SUCCESS
)

echo Đang đẩy dữ liệu lên GitHub (git push origin main)...
git push origin main
if %errorlevel% neq 0 goto PUSH_FAILED

:PUSH_SUCCESS
color 0A
echo.
echo ====================================================================
echo   [THÀNH CÔNG] ĐỒNG BỘ HOÀN TẤT 100%% LÊN GITHUB!
echo ====================================================================
echo   - Bản cập nhật mới nhất:
git log -1 --format="     + Commit: %%h - %%s"
echo.
echo   [OK] TOÀN BỘ MÃ NGUỒN ĐÃ AN TOÀN - BẠN CÓ THỂ YÊN TÂM TẮT MÁY!
echo ====================================================================
echo.
echo Nhấn phím bất kỳ để đóng cửa sổ này...
pause >nul
exit /b 0

:LOCAL_ONLY_SUCCESS
color 0A
echo.
echo ====================================================================
echo   [THÀNH CÔNG] ĐÃ LƯU TRỮ TOÀN BỘ PHIÊN LÀM VIỆC VÀO LOCAL GIT!
echo ====================================================================
echo   - Bản lưu gần nhất:
git log -1 --format="     + Commit: %%h - %%s"
echo   - Lưu ý: Bạn chưa gắn link GitHub (origin remote).
echo   - Nếu muốn sao lưu lên Cloud, hãy chạy lệnh:
echo       git remote add origin https://github.com/your-username/your-repo.git
echo.
echo   [OK] CÁC TIẾN TRÌNH ĐÃ ĐƯỢC TẮT SẠCH - AN TOÀN ĐỂ TẮT MÁY!
echo ====================================================================
echo.
echo Nhấn phím bất kỳ để đóng cửa sổ này...
pause >nul
exit /b 0

:PUSH_FAILED
color 0C
echo.
echo ====================================================================
echo   [CẢNH BÁO] ĐỒNG BỘ CLOUD CHƯA HOÀN TẤT!
echo ====================================================================
echo   Nguyên nhân có thể do:
echo    1. Mất kết nối Internet trên thiết bị này.
echo    2. Trên GitHub đang có bản mới hơn chưa được kéo về (Conflict).
echo    3. Quyền đăng nhập hoặc token GitHub cần được xác thực lại.
echo.
set /p RETRY="Gõ Y để thử đồng bộ lại (hoặc nhấn Enter để thoát): "
if /i "%RETRY%"=="Y" goto SYNC_PROCESS

echo.
echo Nhấn phím bất kỳ để đóng cửa sổ này...
pause >nul
exit /b 1
