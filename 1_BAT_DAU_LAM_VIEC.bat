@echo off
chcp 65001 >nul
title LENSY CRM - BẮT ĐẦU PHIÊN LÀM VIỆC
color 0B

:: 1. Setup Node.js, npm & Git PATH
set "PATH=C:\Program Files\nodejs;%USERPROFILE%\AppData\Roaming\npm;%APPDATA%\npm;C:\Program Files\Git\cmd;%PATH%"

cd /d "%~dp0"

cls
echo ====================================================================
echo   LENSY CRM - KHỞI ĐỘNG PHIÊN LÀM VIỆC (DEV ENVIRONMENT)
echo   Phát triển bởi: MIRMIA STUDIO & ACADEMY
echo ====================================================================
echo.

:: 2. Kiểm tra Git
where git >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [CẢNH BÁO] Không tìm thấy Git trên máy tính!
    echo Bạn vẫn có thể chạy web, nhưng tính năng đồng bộ mã nguồn sẽ bị tắt.
    echo.
) else (
    :: Kiểm tra nếu đã có git remote thì pull code mới nhất
    git remote -v >nul 2>nul
    if %errorlevel% equ 0 (
        echo [1/3] Đang kiểm tra và tải code mới nhất từ GitHub...
        git pull origin main 2>nul
        if %errorlevel% neq 0 (
            color 0E
            echo [THÔNG BÁO] Chưa đồng bộ được từ GitHub (chưa có remote hoặc mất mạng).
            echo Đang tiếp tục chạy mã nguồn hiện tại trên máy.
        ) else (
            echo [OK] Đã đồng bộ bản mới nhất từ GitHub thành công!
        )
    ) else (
        echo [1/3] Dự án đang chạy ở chế độ cục bộ (Local Git Ready).
    )
)
echo.

:: 3. Khởi động Backend (Nếu có thư mục /backend)
if exist "backend\package.json" (
    echo [*] Đang khởi động Backend API Server (Cổng 5000)...
    start "LensFlow Backend (Port 5000)" /min cmd /c "cd /d "%~dp0backend" && call npm.cmd run dev"
)

:: 4. Mở trình duyệt tự động sau 3 giây
color 0B
echo [2/3] Đang chuẩn bị mở trình duyệt tới http://localhost:5173 ...
start /b cmd /c "ping 127.0.0.1 -n 4 >nul & start http://localhost:5173"
echo.

:: 5. Khởi động Frontend Dev Server
echo [3/3] Đang khởi động Frontend Web App (Cổng 5173)...
echo ====================================================================
echo   - Giao diện Khách (Quote Link):     http://localhost:5173
echo   - Lịch chụp Thợ ảnh (Calendar View): http://localhost:5173
echo   - Backend API Server:               http://localhost:5000/api
echo.
echo   HÃY GIỮ CỬA SỔ NÀY TRONG KHI LÀM VIỆC.
echo   Khi kết thúc, hãy chạy file '2_KET_THUC_LAM_VIEC.bat' để đóng sạch
echo   tiến trình và sao lưu mã nguồn an toàn!
echo ====================================================================
echo.

if exist "frontend\package.json" (
    cd /d "%~dp0frontend"
    call npm.cmd run dev
) else (
    call npm.cmd run dev
)

echo.
echo [THÔNG BÁO] Server đã dừng hoạt động.
pause
