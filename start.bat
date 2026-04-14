@echo off
set NODE_PATH=%USERPROFILE%\tools\node-portable
set PATH=%NODE_PATH%;%PATH%

echo IJsvogel Casusportaal starten...

start "IJsvogel API" cmd /k "set PATH=%NODE_PATH%;%PATH% && cd /d "%~dp0" && npm run dev --workspace=apps/api"
start "IJsvogel Web" cmd /k "set PATH=%NODE_PATH%;%PATH% && cd /d "%~dp0" && npm run dev --workspace=apps/web"

echo Wachten op servers...
timeout /t 5 /nobreak >nul

start http://localhost:3000
