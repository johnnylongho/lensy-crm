@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
title LENSY CRM - KET THUC VA DONG BO DU AN
color 0A

:: Setup Node.js, npm & Git PATH
set "PATH=C:\Program Files\nodejs;%USERPROFILE%\AppData\Roaming\npm;%APPDATA%\npm;C:\Program Files\Git\cmd;%PATH%"

cd /d "%~dp0"

:SYNC_PROCESS
cls
echo ====================================================================
echo   LENSY CRM (MIRMIA STUDIO) - KET THUC VA DONG BO DU AN
echo ====================================================================
echo.

:: 1. Don dep cac tien trinh dev server tren cong 5173 va 5000
echo [1/3] Dang don dep cac tien trinh dev server tren cong 5173, 5000...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 5173, 5000, 3000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>nul
echo [OK] Da giai phong cac cong dev server an toan.
echo.

:: 2. Kiem tra Git
where git >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [LOI] Khong tim thay Git tren he thong!
    echo Vui long kiem tra lai phan mem Git.
    pause
    exit /b 1
)

:: 3. Kiem tra thay doi ma nguon
echo [2/3] Kiem tra trang thai thay doi ma nguon...
git status --porcelain > "%temp%\lf_git_status.tmp"

set HAS_CHANGES=0
for /f "usebackq delims=" %%A in ("%temp%\lf_git_status.tmp") do (
    set HAS_CHANGES=1
)
if exist "%temp%\lf_git_status.tmp" del "%temp%\lf_git_status.tmp" >nul 2>nul

if "%HAS_CHANGES%"=="0" goto NO_LOCAL_CHANGES

:HAS_LOCAL_CHANGES
echo Danh sach cac file vua duoc thay doi / tao moi:
echo --------------------------------------------------------------------
git status -s
echo --------------------------------------------------------------------
echo.
echo Dang dong goi cac thay doi (git add -A)...
git add -A

echo.
set "USER_INPUT="
set /p USER_INPUT="Nhap ghi chu cho phien lam viec (Nhan Enter de dung mac dinh): "

if not defined USER_INPUT (
    set "USER_INPUT=Dong bo phien lam viec Lensy tu %COMPUTERNAME%"
)
if "!USER_INPUT!"=="" (
    set "USER_INPUT=Dong bo phien lam viec Lensy tu %COMPUTERNAME%"
)

git commit -m "!USER_INPUT!"
goto CHECK_REMOTE

:NO_LOCAL_CHANGES
echo [THONG TIN] Toan bo ma nguon tren may da duoc luu sach se (Khong co file moi).
goto CHECK_REMOTE

:CHECK_REMOTE
echo.
echo [3/3] Dang kiem tra ket noi Cloud / GitHub Remote...
git remote get-url origin >nul 2>nul
if %errorlevel% neq 0 (
    goto LOCAL_ONLY_SUCCESS
)

echo Dang day du lieu len GitHub (git push origin main)...
git push origin main
if %errorlevel% neq 0 goto PUSH_FAILED

:PUSH_SUCCESS
color 0A
echo.
echo ====================================================================
echo   [THANH CONG] DONG BO HOAN TAT 100%% LEN GITHUB!
echo ====================================================================
echo   - Ban cap nhat moi nhat tren Cloud:
git log -1 --format="     + Commit: %%h - %%s"
echo.
echo   [OK] TOAN BO MA NGUON DA AN TOAN - BAN CO THE YEN TAM TAT MAY!
echo ====================================================================
echo.
echo Nhan phim bat ky de dong cua so nay...
pause >nul
exit /b 0

:LOCAL_ONLY_SUCCESS
color 0A
echo.
echo ====================================================================
echo   [THANH CONG] DA LUU TRU PHIEN LAM VIEC VAO LOCAL GIT!
echo ====================================================================
echo   - Ban luu gan nhat:
git log -1 --format="     + Commit: %%h - %%s"
echo.
echo   - Ghi chu: Ban chua cau hinh link GitHub (origin remote).
echo   - De sao luu len GitHub Cloud, hay chay lenh:
echo       git remote add origin https://github.com/your-username/lensy.git
echo.
echo   [OK] CAC TIEN TRINH DA DUOC TAT SACH - AN TOAN DE TAT MAY!
echo ====================================================================
echo.
echo Nhan phim bat ky de dong cua so nay...
pause >nul
exit /b 0

:PUSH_FAILED
color 0C
echo.
echo ====================================================================
echo   [CANH BAO] DONG BO CLOUD CHUA HOAN TAT!
echo ====================================================================
echo   Nguyen nhan co the do:
echo    1. Mat ket noi Internet tren thiet bi nay.
echo    2. Tren GitHub dang co ban moi hon chua duoc keo ve (Conflict).
echo    3. Quyen dang nhap hoac token GitHub can duoc xac thuc lai.
echo.
set /p RETRY="Go Y de thu dong bo lai (hoac nhan Enter de thoat): "
if /i "%RETRY%"=="Y" goto SYNC_PROCESS

echo.
echo Nhan phim bat ky de dong cua so nay...
pause >nul
exit /b 1
