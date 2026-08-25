@echo off
chcp 65001 > nul

set LAN_IP=192.168.1.99
set LAN_BACKEND_PORT=3000

if "%~1"=="" (
  echo Missing parameter! Use: .\set-ngrok-url.bat lan OR .\set-ngrok-url.bat https://your-ngrok.ngrok-free.app
  pause
  exit /b 1
)

if /i "%~1"=="lan" (
  set BASE_URL=http://%LAN_IP%:%LAN_BACKEND_PORT%
  set MODE=LAN
) else (
  set BASE_URL=%~1
  set MODE=NGROK
)

set API_URL=%BASE_URL%/api/v1

echo Updating .env files to Mode: %MODE%
echo BASE_URL = %BASE_URL%
echo API_URL  = %API_URL%

(
  echo VITE_API_URL=%API_URL%
  echo VITE_BACKEND_URL=%BASE_URL%
  echo LOCAL_NETWORK_IP=%LAN_IP%
) > "e:\SportHubAI\frontend\customer\.env"
echo [OK] customer/.env updated

(
  echo VITE_API_URL=%API_URL%
  echo VITE_BACKEND_URL=%BASE_URL%
  echo LOCAL_NETWORK_IP=%LAN_IP%
) > "e:\SportHubAI\frontend\owner\.env"
echo [OK] owner/.env updated

(
  echo VITE_API_URL=%API_URL%
  echo VITE_BACKEND_URL=%BASE_URL%
  echo LOCAL_NETWORK_IP=%LAN_IP%
) > "e:\SportHubAI\frontend\admin\.env"
echo [OK] admin/.env updated

echo Done! Please restart Vite dev servers (npm run dev) or refresh browser (F5).
