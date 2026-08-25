@echo off
chcp 65001 > nul
title SportHubAI — Startup Script

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║         SportHubAI — Starting All Services          ║
echo ╚══════════════════════════════════════════════════════╝
echo.

REM ── Start Backend (port 3000) ──────────────────────────────────────────────
echo [1/4] Starting Backend (port 3000)...
start "SportHubAI Backend" cmd /k "cd /d e:\SportHubAI\backend && npm start"

REM ── Start Customer Frontend (port 5175) ────────────────────────────────────
echo [2/4] Starting Customer Frontend (port 5175)...
start "SportHubAI Customer" cmd /k "cd /d e:\SportHubAI\frontend\customer && npm run dev"

REM ── Start Owner Frontend (port 5174) ───────────────────────────────────────
echo [3/4] Starting Owner Frontend (port 5174)...
start "SportHubAI Owner" cmd /k "cd /d e:\SportHubAI\frontend\owner && npm run dev"

REM ── Start Admin Frontend (port 5173) ───────────────────────────────────────
echo [4/4] Starting Admin Frontend (port 5173)...
start "SportHubAI Admin" cmd /k "cd /d e:\SportHubAI\frontend\admin && npm run dev"

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║  All 4 services started!                                     ║
echo ║                                                              ║
echo ║  - Customer : http://192.168.1.99:5175                       ║
echo ║  - Owner    : http://192.168.1.99:5174                       ║
echo ║  - Admin    : http://192.168.1.99:5173                       ║
echo ║  - Backend  : http://192.168.1.99:3000                       ║
echo ║                                                              ║
echo ║  Nếu dùng Ngrok, mở terminal mới và chạy:                   ║
echo ║    .\ngrok.exe http 3000                                     ║
echo ║  rồi chạy:                                                   ║
echo ║    .\set-ngrok-url.bat https://xxxx.ngrok-free.app           ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
pause
