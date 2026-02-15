@echo off
setlocal

cd /d "%~dp0"
set "START_BOT=1"
if /i "%~1"=="--web-only" set "START_BOT=0"

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed or not in PATH.
  echo Install Node.js first: https://nodejs.org/
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm is not installed or not in PATH.
  pause
  exit /b 1
)

if "%START_BOT%"=="1" (
  where python >nul 2>nul
  if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH.
    pause
    exit /b 1
  )

  echo [INFO] Starting bot + API bridge on http://localhost:8080 ...
  echo [INFO] If bot login fails, API-only mode will start automatically.
  start "Roblox Keys Bot + API" cmd /k "cd /d ""%~dp0"" && (python main.py || python run_api_only.py)"
  timeout /t 2 >nul
) else (
  echo [INFO] Web-only mode selected. Skipping bot/API startup.
)

cd banana-store

if not exist node_modules (
  echo [INFO] Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
)

echo [INFO] Starting website on http://localhost:3000 ...
call npm run dev

if errorlevel 1 (
  echo [ERROR] Website failed to start.
  pause
  exit /b 1
)

endlocal
