@echo off
cd /d "%~dp0"
IF NOT EXIST node_modules (
  echo Installing frontend packages. Please wait...
  call npm install
)
IF NOT EXIST backend\node_modules (
  echo Installing backend packages. Please wait...
  pushd backend
  call npm install
  popd
)
start "FineVision Backend" cmd /k "cd /d ""%~dp0backend"" && npm start"
start http://localhost:5173
npm run web -- --port 5173
pause
