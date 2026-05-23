@echo off
cd /d "%~dp0"
echo Starting FinVision AI...
IF NOT EXIST node_modules (
  echo Installing packages. Please wait...
  npm install
)
start http://localhost:5173
npm run dev
pause
