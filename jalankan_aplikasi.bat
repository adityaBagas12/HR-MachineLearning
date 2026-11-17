@echo off
title Employee Attrition & Performance Predictor - Kelompok 5
color 0b

echo ========================================================
echo   MENJALANKAN SERVER MACHINE LEARNING (KELOMPOK 5)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Membuka browser ke http://localhost:8000 ...
timeout /t 2 /nobreak >nul
start http://localhost:8000

echo [2/2] Menjalankan server Uvicorn...
echo.
echo (JANGAN TUTUP JENDELA INI SELAMA MENGGUNAKAN WEB)
echo Tekan CTRL + C jika ingin menghentikan server.
echo ========================================================
echo.

python -m uvicorn app:app --reload

pause
