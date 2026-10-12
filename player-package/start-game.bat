@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>&1
if not errorlevel 1 (
  py -3 "%~dp0launch_game.py"
  if not errorlevel 1 exit /b 0
)
where python >nul 2>&1
if not errorlevel 1 (
  python "%~dp0launch_game.py"
  if not errorlevel 1 exit /b 0
)
where powershell.exe >nul 2>&1
if not errorlevel 1 (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0launch_game.ps1"
  exit /b
)
echo Python 3 or Windows PowerShell is required to launch the local game server.
echo See README.txt for instructions.
pause
