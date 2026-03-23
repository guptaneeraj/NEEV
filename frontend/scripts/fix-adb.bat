@echo off
echo [1/4] Terminating all adb.exe processes...
taskkill /F /IM adb.exe /T 2>nul

echo [2/4] Checking for processes using port 5037 (ADB default port)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5037 ^| findstr LISTENING') do (
    echo Found process %%a using port 5037. Terminating...
    taskkill /F /PID %%a /T 2>nul
)

echo [3/4] Manually starting ADB server...
set "ADB_PATH=C:\Users\gupta\AppData\Local\Android\Sdk\platform-tools\adb.exe"
if exist "%ADB_PATH%" (
    "%ADB_PATH%" start-server
) else (
    echo Error: adb.exe not found at %ADB_PATH%
    echo Checking PATH...
    adb start-server
)

echo [4/4] Verifying ADB status...
adb devices

echo.
echo ✅ ADB reset attempted. If you still see "could not read ok",
echo please check if your Antivirus or Firewall is blocking adb.exe.
pause
