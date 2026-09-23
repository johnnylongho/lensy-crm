@echo off
chcp 65001 >nul
title LENSY CRM - BAT DAU PHIEN LAM VIEC
color 0B

:: 1. Setup Node.js, npm & Git PATH
set "PATH=C:\Program Files\nodejs;%USERPROFILE%\AppData\Roaming\npm;%APPDATA%\npm;C:\Program Files\Git\cmd;%PATH%"

cd /d "%~dp0"

cls
echo ====================================================================
echo   LENSY CRM - KHOI DONG PHIEN LAM VIEC [DEV ENVIRONMENT]
echo   Phat trien boi: MIRMIA STUDIO ^& ACADEMY
echo ====================================================================
echo.

:: 2. Kiem tra Git
where git >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [CANH BAO] Khong tim thay Git tren may tinh!
    echo Ban van co the chay web, nhung tinh nang dong bo ma nguon se bi tat.
    echo.
) else (
    git remote -v >nul 2>nul
    if %errorlevel% equ 0 (
        echo [1/3] Dang kiem tra va tai code moi nhat tu GitHub...
        git pull origin main 2>nul
        if %errorlevel% neq 0 (
            color 0E
            echo [THONG BAO] Chua dong bo duoc tu GitHub [chua co remote hoac mat mang].
            echo Dang tiep tuc chay ma nguon hien tai tren may.
        ) else (
            echo [OK] Da dong bo ban moi nhat tu GitHub thanh cong!
        )
    ) else (
        echo [1/3] Du an dang chay o che do cuc bo [Local Git Ready].
    )
)
echo.

:: 3. Giai phong cong va khoi dong Backend chay ngam (Chung cua so, khong mo them cua so phu)
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 5173, 5000, 3000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>nul

if exist "backend\package.json" (
    echo [*] Dang khoi dong Backend API Server [Cong 5000 ngam]...
    start "" /b cmd /c "cd /d "%~dp0backend" && call npm.cmd run dev"
)

:: 4. Mo trinh duyet tu dong sau 3 giay
color 0B
echo [2/3] Dang chuan bi mo trinh duyet toi http://localhost:5173 ...
start /b cmd /c "ping 127.0.0.1 -n 4 >nul & start http://localhost:5173"
echo.

:: 5. Khoi dong Frontend Dev Server
echo [3/3] Dang khoi dong Frontend Web App (Cong 5173)...
echo ====================================================================
echo   - Giao dien Khach (Quote Link):     http://localhost:5173
echo   - Lich chup Tho anh (Calendar View): http://localhost:5173
echo   - Backend API Server:               http://localhost:5000/api
echo.
echo   HAY GIU CUA SO NAY TRONG KHI LAM VIEC.
echo   Khi ket thuc, hay chay file '2_KET_THUC_LAM_VIEC.bat' de dong sach
echo   tien trinh va sao luu ma nguon an toan!
echo ====================================================================
echo.

if exist "frontend\package.json" (
    cd /d "%~dp0frontend"
    if not exist "node_modules\" (
        echo [!] Phat hien chua co node_modules, dang tu dong chay npm install...
        call npm.cmd install
    )
    call npm.cmd run dev
) else (
    if not exist "node_modules\" (
        echo [!] Phat hien chua co node_modules, dang tu dong chay npm install...
        call npm.cmd install
    )
    call npm.cmd run dev
)

echo.
echo [THONG BAO] Server da dung hoat dong.
pause
