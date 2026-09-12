@echo off
title Powerhub Inspector

echo.
echo  ============================================================
echo   POWERHUB ASSISTANT - FOLDER INSPECTOR
echo   Dang tao Word report de Copilot doc...
echo  ============================================================
echo.

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [LOI] Khong tim thay Python.
    echo       Tai Python tai: https://python.org/downloads
    pause
    exit /b 1
)

echo [INFO] Dang chay inspect_powerhub.py...
echo.

python "%~dp0inspect_powerhub.py"

echo.
if exist "D:\Powerhub_assistant\INSPECTION_REPORT.docx" (
    echo  [OK] File da duoc tao:
    echo       D:\Powerhub_assistant\INSPECTION_REPORT.docx
    echo.
    choice /C YN /M "Mo file ngay bay gio?"
    if errorlevel 1 if not errorlevel 2 (
        start "" "D:\Powerhub_assistant\INSPECTION_REPORT.docx"
    )
) else (
    echo  [LOI] File chua duoc tao. Xem log loi phia tren.
)

echo.
pause
